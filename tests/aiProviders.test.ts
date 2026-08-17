import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAiProvider, SUPPORTED_PROVIDERS } from '@/lib/ai/provider';
import { createKimiProvider } from '@/lib/ai/kimi';
import { createNvidiaProvider } from '@/lib/ai/nvidia';
import { createOpenAiProvider } from '@/lib/ai/openai';
import { mockProvider } from '@/lib/ai/mock';
import { ProviderConfigError, parseProviderJson } from '@/lib/ai/openaiCompatible';
import { validateComponents } from '@/lib/validation';

const generatedDocument = {
  components: [
    {
      id: 'hero-1',
      type: 'hero',
      props: { title: 'From Provider', subtitle: 'S', ctaText: 'Go', ctaLink: '#', image: '' },
      styles: { backgroundColor: '#4f46e5', color: '#ffffff' },
    },
    {
      id: 'footer-1',
      type: 'footer',
      props: { copyright: '© 2026 X', links: ['Privacy'] },
      styles: { backgroundColor: '#ffffff', color: '#1f2937' },
    },
  ],
};

// OpenAI-style chat-completions response body used by all HTTP adapters.
function completionBody(content: unknown) {
  return {
    choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }],
    usage: { prompt_tokens: 11, completion_tokens: 22, total_tokens: 33 },
  };
}

function stubFetchOk(body: unknown = completionBody(generatedDocument)) {
  const fetchMock = vi.fn(async () =>
    new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe.each([
  ['kimi', createKimiProvider, 'KIMI_API_KEY', 'KIMI_MODEL', 'moonshot-v1-8k'],
  ['nvidia', createNvidiaProvider, 'NVIDIA_API_KEY', 'NVIDIA_MODEL', 'meta/llama-3.1-8b-instruct'],
  ['openai', createOpenAiProvider, 'OPENAI_API_KEY', 'OPENAI_MODEL', 'gpt-4o-mini'],
] as const)('%s provider adapter', (name, create, keyEnv, modelEnv, defaultModel) => {
  it('throws a clear configuration error when the credential is missing', async () => {
    vi.stubEnv(keyEnv, '');
    const provider = create();
    await expect(provider.generateStructuredComponents('a valid prompt here')).rejects.toThrow(
      `${keyEnv} is not configured`
    );
  });

  it('produces the same validated internal document shape', async () => {
    vi.stubEnv(keyEnv, 'test-server-side-key');
    const fetchMock = stubFetchOk();

    const provider = create();
    expect(provider.name).toBe(name);

    const result = await provider.generateStructuredComponents('a valid prompt here');

    // Identical internal contract across providers
    const validation = validateComponents(result.components);
    expect(validation.ok).toBe(true);
    expect(result.model).toBe(defaultModel);
    expect(result.promptTokens).toBe(11);
    expect(result.completionTokens).toBe(22);
    expect(result.totalTokens).toBe(33);

    // Credential goes only to the provider endpoint, in the auth header
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, { headers: Record<string, string> }];
    expect(url).toContain('/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer test-server-side-key');
  });

  it('honors the model environment override', async () => {
    vi.stubEnv(keyEnv, 'test-key');
    vi.stubEnv(modelEnv, 'custom-model-x');
    stubFetchOk();
    const result = await create().generateStructuredComponents('a valid prompt here');
    expect(result.model).toBe('custom-model-x');
  });

  it('fails clearly on provider HTTP errors', async () => {
    vi.stubEnv(keyEnv, 'test-key');
    vi.stubGlobal('fetch', vi.fn(async () => new Response('upstream down', { status: 500 })));
    await expect(create().generateStructuredComponents('a valid prompt here')).rejects.toThrow(
      `${name} request failed (500)`
    );
  });

  it('fails clearly on malformed provider responses', async () => {
    vi.stubEnv(keyEnv, 'test-key');
    stubFetchOk(completionBody('definitely not json at all'));
    await expect(create().generateStructuredComponents('a valid prompt here')).rejects.toThrow(
      'malformed provider response'
    );
  });
});

describe('mock provider', () => {
  it('produces a valid internal document with no credentials', async () => {
    const result = await mockProvider.generateStructuredComponents('a yoga studio landing page');
    expect(validateComponents(result.components).ok).toBe(true);
    expect(result.model).toBe('mock-1');
  });
});

describe('getAiProvider resolution', () => {
  it('resolves each supported provider from AI_PROVIDER', () => {
    for (const name of SUPPORTED_PROVIDERS) {
      vi.stubEnv('AI_PROVIDER', name);
      expect(getAiProvider().name).toBe(name);
    }
  });

  it('defaults to mock when AI_PROVIDER is unset', () => {
    vi.stubEnv('AI_PROVIDER', '');
    delete process.env.AI_PROVIDER;
    expect(getAiProvider().name).toBe('mock');
  });

  it('rejects an unsupported provider instead of silently substituting', () => {
    vi.stubEnv('AI_PROVIDER', 'banana');
    expect(() => getAiProvider()).toThrow(ProviderConfigError);
    expect(() => getAiProvider()).toThrow('Unsupported AI_PROVIDER "banana"');
  });
});

describe('parseProviderJson', () => {
  it('parses clean JSON, fenced JSON, and JSON with surrounding prose', () => {
    expect(parseProviderJson('{"components": []}')).toEqual({ components: [] });
    expect(parseProviderJson('```json\n{"components": []}\n```')).toEqual({ components: [] });
    expect(parseProviderJson('Here you go:\n{"components": []}\nDone.')).toEqual({ components: [] });
  });

  it('rejects non-JSON content', () => {
    expect(() => parseProviderJson('no json here')).toThrow('malformed provider response');
  });
});
