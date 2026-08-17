import { COMPONENT_DOCUMENT_SYSTEM_PROMPT } from './prompt';
import type { AiProvider, AiGenerationResult } from './provider';

const REQUEST_TIMEOUT_MS = 45_000;

// Thrown for server-side configuration problems: missing credential or an
// unsupported AI_PROVIDER value. The route maps this to a clear 500 instead
// of the 502 used for upstream provider failures.
export class ProviderConfigError extends Error {}

export interface OpenAiCompatibleConfig {
  name: string;
  baseUrl: string;
  apiKeyEnv: string;
  model: string;
}

// Tolerates prose around the JSON document (code fences, preamble) — some
// compatible providers are less strict about JSON mode than others.
export function parseProviderJson(content: string): unknown {
  const trimmed = content.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('malformed provider response: no JSON object found');
  }
  try {
    return JSON.parse(withoutFence.slice(start, end + 1));
  } catch {
    throw new Error('malformed provider response: invalid JSON');
  }
}

// Kimi, NVIDIA NIM, and OpenAI all expose an OpenAI-style chat-completions
// API. One adapter factory serves all three; credentials are read from
// server-side environment only and are never logged or sent to the client.
export function createOpenAiCompatibleProvider(config: OpenAiCompatibleConfig): AiProvider {
  return {
    name: config.name,

    async generateStructuredComponents(prompt: string): Promise<AiGenerationResult> {
      const apiKey = process.env[config.apiKeyEnv];
      if (!apiKey) {
        throw new ProviderConfigError(
          `${config.apiKeyEnv} is not configured (required when AI_PROVIDER=${config.name})`
        );
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(`${config.baseUrl}/chat/completions`, {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: config.model,
            temperature: 0.7,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: COMPONENT_DOCUMENT_SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`${config.name} request failed (${response.status})`);
        }

        const data = await response.json();
        const content: unknown = data?.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          throw new Error(`${config.name} returned no content`);
        }

        const parsed = parseProviderJson(content);
        const usage = data?.usage ?? {};
        return {
          // Intentionally untrusted here — the route passes it through
          // validateComponents before it can reach builder, DB, or publish.
          components: (parsed as Record<string, unknown>)?.components,
          model: config.model,
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
