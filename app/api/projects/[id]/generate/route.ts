import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/apiResponse';
import { rateLimit } from '@/lib/rateLimit';
import { validateComponents, validatePrompt } from '@/lib/validation';
import { getAiProvider } from '@/lib/ai/provider';
import { ProviderConfigError } from '@/lib/ai/openaiCompatible';

interface RouteContext {
  params: { id: string };
}

// AI calls are expensive — tighter limit than the other endpoints.
// Single-replica in-memory limiter, see app/lib/rateLimit.ts.
const GENERATE_RATE_LIMIT = 5;
const GENERATE_RATE_WINDOW_MS = 60_000;

interface UsageRecord {
  userId: string;
  projectId: string;
  provider: string;
  model: string;
  success: boolean;
  prompt: string;
  latencyMs: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  error?: string;
}

// POST /api/projects/[id]/generate — prompt → provider → validated component
// document → persisted on the owned project → returned to the builder.
// Raw model output never reaches the database or the client unvalidated.
export async function POST(request: NextRequest, { params }: RouteContext) {
  const startedAt = Date.now();

  const recordUsage = async (record: Omit<UsageRecord, 'latencyMs'>) => {
    try {
      await prisma.aiUsage.create({
        data: { ...record, latencyMs: Date.now() - startedAt },
      });
    } catch (error) {
      // Accounting must never break the user-facing request.
      console.error('AiUsage write failed:', error);
    }
  };

  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiError(401, 'Unauthorized');
    }

    const { allowed, retryAfterSeconds } = rateLimit(
      `generate:${user.id}`,
      GENERATE_RATE_LIMIT,
      GENERATE_RATE_WINDOW_MS
    );
    if (!allowed) {
      return apiError(429, `Rate limit exceeded. Try again in ${retryAfterSeconds}s.`);
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiError(400, 'Request body must be valid JSON');
    }

    const promptCheck = validatePrompt(body.prompt);
    if (!promptCheck.ok) {
      return apiError(400, promptCheck.error);
    }
    const prompt = promptCheck.prompt;

    const project = await prisma.project.findFirst({
      where: { id: params.id, userId: user.id },
    });
    if (!project) {
      return apiError(404, 'Project not found');
    }

    let provider;
    try {
      provider = getAiProvider();
    } catch (error) {
      // Unsupported AI_PROVIDER — a configuration error, never a silent
      // fallback to another provider.
      const message = error instanceof Error ? error.message : 'provider configuration error';
      await recordUsage({
        userId: user.id,
        projectId: project.id,
        provider: (process.env.AI_PROVIDER || 'mock').toLowerCase(),
        prompt: prompt.slice(0, 500),
        model: 'unknown',
        success: false,
        error: message,
      });
      return apiError(500, message);
    }
    const usageBase = {
      userId: user.id,
      projectId: project.id,
      provider: provider.name,
      prompt: prompt.slice(0, 500),
    };

    let result;
    try {
      result = await provider.generateStructuredComponents(prompt);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'provider error';
      const isConfigError = error instanceof ProviderConfigError;
      await recordUsage({
        ...usageBase,
        model: 'unknown',
        success: false,
        error: message,
      });
      // Missing credential / misconfiguration -> 500; upstream failure -> 502.
      return isConfigError
        ? apiError(500, message)
        : apiError(502, `AI generation failed: ${message}`);
    }

    // The provider's output is untrusted input. Validate the ENTIRE document;
    // nothing malformed, unknown, or unsafe reaches the database or client.
    const validation = validateComponents(result.components);
    if (!validation.ok) {
      await recordUsage({
        ...usageBase,
        model: result.model,
        success: false,
        error: `invalid output: ${validation.error}`,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
      });
      return apiError(502, 'AI returned invalid component data. Please try again.');
    }

    const { count } = await prisma.project.updateMany({
      where: { id: project.id, userId: user.id },
      data: { components: validation.components as object[] },
    });
    if (count === 0) {
      return apiError(404, 'Project not found');
    }

    await recordUsage({
      ...usageBase,
      model: result.model,
      success: true,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
    });

    return apiOk({
      components: validation.components,
      model: result.model,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return apiError(500, 'Failed to generate');
  }
}
