import { describe, it, expect } from 'vitest';
import { validateComponents } from '@/lib/validation';
import { createNvidiaProvider } from '@/lib/ai/nvidia';
import { createKimiProvider } from '@/lib/ai/kimi';
import { createOpenAiProvider } from '@/lib/ai/openai';

// REAL provider smoke tests. These call the live provider APIs and are
// skipped automatically when the corresponding credential is not configured,
// so they are safe in CI. They verify the real path:
//   prompt -> provider HTTP API -> structured output -> validateComponents()
// Never log credentials; assertions cover structure, not secret values.

const PROMPT = 'A landing page for a small coffee roastery in Portland';

const hasNvidia = Boolean(process.env.NVIDIA_API_KEY);
const hasKimi = Boolean(process.env.KIMI_API_KEY);
const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);

describe('real provider smoke tests (skipped without credentials)', () => {
  it.runIf(hasNvidia)('nvidia: real generation validates against the component contract', async () => {
    const startedAt = Date.now();
    const provider = createNvidiaProvider();
    const result = await provider.generateStructuredComponents(PROMPT);
    const latencyMs = Date.now() - startedAt;

    console.log(
      `[smoke:nvidia] model=${result.model} latencyMs=${latencyMs} ` +
        `promptTokens=${result.promptTokens} completionTokens=${result.completionTokens} ` +
        `totalTokens=${result.totalTokens}`
    );

    const validation = validateComponents(result.components);
    if (!validation.ok) {
      console.error(`[smoke:nvidia] validation failed: ${validation.error}`);
    }
    expect(validation.ok).toBe(true);
    if (validation.ok) {
      expect(validation.components.length).toBeGreaterThan(0);
      console.log(
        `[smoke:nvidia] ${validation.components.length} validated components: ` +
          validation.components.map((c) => c.type).join(', ')
      );
    }
  }, 60_000);

  it.runIf(hasKimi)('kimi: real generation validates against the component contract', async () => {
    const provider = createKimiProvider();
    const result = await provider.generateStructuredComponents(PROMPT);
    const validation = validateComponents(result.components);
    expect(validation.ok).toBe(true);
  }, 60_000);

  it.runIf(hasOpenAi)('openai: real generation validates against the component contract', async () => {
    const provider = createOpenAiProvider();
    const result = await provider.generateStructuredComponents(PROMPT);
    const validation = validateComponents(result.components);
    expect(validation.ok).toBe(true);
  }, 60_000);

  it('reports which real providers are configured', () => {
    console.log(
      `[smoke] configured providers -> nvidia:${hasNvidia} kimi:${hasKimi} openai:${hasOpenAi}`
    );
    expect(true).toBe(true);
  });
});
