import { createOpenAiCompatibleProvider } from './openaiCompatible';
import type { AiProvider } from './provider';

// NVIDIA NIM exposes an OpenAI-compatible chat-completions API.
// Server-side configuration:
//   NVIDIA_API_KEY   (required when AI_PROVIDER=nvidia)
//   NVIDIA_BASE_URL  (optional, default https://integrate.api.nvidia.com/v1)
//   NVIDIA_MODEL     (optional, default meta/llama-3.1-8b-instruct)
export function createNvidiaProvider(): AiProvider {
  return createOpenAiCompatibleProvider({
    name: 'nvidia',
    baseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    apiKeyEnv: 'NVIDIA_API_KEY',
    model: process.env.NVIDIA_MODEL || 'meta/llama-3.1-8b-instruct',
  });
}
