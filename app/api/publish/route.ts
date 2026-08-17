import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { apiOk, apiError } from '@/lib/apiResponse';
import { rateLimit } from '@/lib/rateLimit';
import { validateComponents } from '@/lib/validation';
import { generateStaticCSS, generateStaticHTML } from '@/lib/renderStatic';

// 10 generations per minute per user. Single-replica in-memory limiter,
// see app/lib/rateLimit.ts for the scaling caveat.
const EXPORT_RATE_LIMIT = 10;
const EXPORT_RATE_WINDOW_MS = 60_000;

// Generates standalone HTML/CSS for the posted component document.
// Used by the builder's Export dialog. Real site publishing (persisted,
// public URL) lives at POST /api/projects/[id]/publish.
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return apiError(401, 'Unauthorized');
    }

    const { allowed, retryAfterSeconds } = rateLimit(
      `export:${userId}`,
      EXPORT_RATE_LIMIT,
      EXPORT_RATE_WINDOW_MS
    );
    if (!allowed) {
      return apiError(429, `Rate limit exceeded. Try again in ${retryAfterSeconds}s.`);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(400, 'Request body must be valid JSON');
    }

    const validation = validateComponents(
      (body as Record<string, unknown> | null)?.components
    );
    if (!validation.ok) {
      return apiError(400, validation.error);
    }

    const html = generateStaticHTML(validation.components);
    const css = generateStaticCSS();

    return apiOk({ html, css });
  } catch (error) {
    console.error('Export error:', error);
    return apiError(500, 'Failed to generate export');
  }
}
