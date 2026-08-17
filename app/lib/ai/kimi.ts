import { createOpenAiCompatibleProvider } from './openaiCompatible';
import type { AiProvider } from './provider';

// Kimi (Moonshot AI) exposes an OpenAI-compatible chat-completions API.
// Server-side configuration:
//   KIMI_API_KEY   (required when AI_PROVIDER=kimi)
//   KIMI_BASE_URL  (optional, default https://api.moonshot.ai/v1)
//   KIMI_MODEL     (optional, default moonshot-v1-8k)
export function createKimiProvider(): AiProvider {
  return createOpenAiCompatibleProvider({
    name: 'kimi',
    baseUrl: process.env.KIMI_BASE_URL || 'https://api.moonshot.ai/v1',
    apiKeyEnv: 'KIMI_API_KEY',
    model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
  });
}
