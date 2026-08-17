import { createOpenAiCompatibleProvider } from './openaiCompatible';
import type { AiProvider } from './provider';

// OpenAI is an OPTIONAL provider — not required for the product to function.
// Server-side configuration:
//   OPENAI_API_KEY   (required when AI_PROVIDER=openai)
//   OPENAI_BASE_URL  (optional, default https://api.openai.com/v1)
//   OPENAI_MODEL     (optional, default gpt-4o-mini)
export function createOpenAiProvider(): AiProvider {
  return createOpenAiCompatibleProvider({
    name: 'openai',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  });
}
