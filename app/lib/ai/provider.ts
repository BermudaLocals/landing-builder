import { mockProvider } from './mock';
import { createKimiProvider } from './kimi';
import { createNvidiaProvider } from './nvidia';
import { createOpenAiProvider } from './openai';
import { ProviderConfigError } from './openaiCompatible';

export interface AiGenerationResult {
  // Raw parsed provider output. Never trust it: every caller must pass this
  // through validateComponents before it reaches the builder, the database,
  // or a published page.
  components: unknown;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface AiProvider {
  name: string;
  generateStructuredComponents(prompt: string): Promise<AiGenerationResult>;
}

export const SUPPORTED_PROVIDERS = ['kimi', 'nvidia', 'openai', 'mock'] as const;

// Provider selection is server-side only, via AI_PROVIDER. An unknown value
// is a configuration error — the product never silently substitutes another
// provider (no implicit fallback chain).
export function getAiProvider(): AiProvider {
  const kind = (process.env.AI_PROVIDER || 'mock').toLowerCase();

  switch (kind) {
    case 'kimi':
      return createKimiProvider();
    case 'nvidia':
      return createNvidiaProvider();
    case 'openai':
      return createOpenAiProvider();
    case 'mock':
      return mockProvider;
    default:
      throw new ProviderConfigError(
        `Unsupported AI_PROVIDER "${kind}". Supported: ${SUPPORTED_PROVIDERS.join(', ')}`
      );
  }
}
