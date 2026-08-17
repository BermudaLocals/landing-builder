import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    project: { findFirst: vi.fn(), updateMany: vi.fn() },
    aiUsage: { create: vi.fn() },
  },
}));

vi.mock('@/lib/ai/provider', () => ({
  getAiProvider: vi.fn(),
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { getAiProvider } from '@/lib/ai/provider';
import { POST as generate } from '@/api/projects/[id]/generate/route';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma, true);
const mockGetProvider = vi.mocked(getAiProvider);

// Each test uses its own user id so the per-user rate-limit buckets stay
// independent of one another.
function signedIn(userId: string) {
  mockAuth.mockResolvedValue({ userId: `clerk_${userId}` } as never);
  mockPrisma.user.findUnique.mockResolvedValue({ id: userId, clerkId: `clerk_${userId}` } as never);
}

const ownedProject = {
  id: 'p1',
  userId: 'user_1',
  slug: 'my-page-abc123',
  title: 'My Page',
  components: [],
};

const validGenerated = [
  { id: 'hero-1', type: 'hero', props: { title: 'Generated' }, styles: { backgroundColor: '#fff' } },
];

function providerReturning(components: unknown) {
  mockGetProvider.mockReturnValue({
    name: 'mock',
    generateStructuredComponents: vi.fn(async () => ({
      model: 'mock-1',
      components,
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    })),
  } as never);
}

function providerThrowing(message: string) {
  mockGetProvider.mockReturnValue({
    name: 'mock',
    generateStructuredComponents: vi.fn(async () => {
      throw new Error(message);
    }),
  } as never);
}

const req = (body?: unknown) =>
  new NextRequest('http://localhost:3000/api/projects/p1/generate', {
    method: 'POST',
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
const ctx = (id: string) => ({ params: { id } });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/projects/[id]/generate', () => {
  it('rejects unauthenticated requests', async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);
    const res = await generate(req({ prompt: 'a valid prompt here' }), ctx('p1'));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('returns 404 for a nonexistent project', async () => {
    signedIn('user_nf');
    mockPrisma.project.findFirst.mockResolvedValue(null as never);
    const res = await generate(req({ prompt: 'a valid prompt here' }), ctx('missing'));
    expect(res.status).toBe(404);
  });

  it('returns 404 for a project owned by another user', async () => {
    signedIn('user_bob');
    // Ownership-scoped query finds nothing for Bob.
    mockPrisma.project.findFirst.mockResolvedValue(null as never);
    const res = await generate(req({ prompt: 'a valid prompt here' }), ctx('p1'));
    expect(res.status).toBe(404);
    expect(mockPrisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', userId: 'user_bob' } })
    );
  });

  it('rejects invalid prompts', async () => {
    signedIn('user_prompt');
    mockPrisma.project.findFirst.mockResolvedValue(ownedProject as never);
    providerReturning(validGenerated);

    expect((await generate(req({ prompt: 'short' }), ctx('p1'))).status).toBe(400);
    expect((await generate(req({ prompt: 42 }), ctx('p1'))).status).toBe(400);
    expect((await generate(req({ prompt: 'x'.repeat(1001) }), ctx('p1'))).status).toBe(400);
    expect((await generate(req({}), ctx('p1'))).status).toBe(400);
  });

  it('rate limits repeated generations', async () => {
    signedIn('user_rl');
    mockPrisma.project.findFirst.mockResolvedValue({ ...ownedProject, userId: 'user_rl' } as never);
    mockPrisma.project.updateMany.mockResolvedValue({ count: 1 } as never);
    providerReturning(validGenerated);

    let saw429 = false;
    for (let i = 0; i < 10; i++) {
      const res = await generate(req({ prompt: 'a valid prompt here' }), ctx('p1'));
      if (res.status === 429) {
        saw429 = true;
        break;
      }
    }
    expect(saw429).toBe(true);
  });

  it('returns 502 and records a failed usage row on provider failure', async () => {
    signedIn('user_pfail');
    mockPrisma.project.findFirst.mockResolvedValue({ ...ownedProject, userId: 'user_pfail' } as never);
    providerThrowing('OPENAI_API_KEY is not configured');

    const res = await generate(req({ prompt: 'a valid prompt here' }), ctx('p1'));
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('OPENAI_API_KEY');

    expect(mockPrisma.aiUsage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_pfail',
          projectId: 'p1',
          success: false,
          error: 'OPENAI_API_KEY is not configured',
        }),
      })
    );
    expect(mockPrisma.project.updateMany).not.toHaveBeenCalled();
  });

  it('rejects malformed AI output and persists nothing', async () => {
    signedIn('user_malformed');
    mockPrisma.project.findFirst.mockResolvedValue({ ...ownedProject, userId: 'user_malformed' } as never);
    providerReturning('this is not a component array');

    const res = await generate(req({ prompt: 'a valid prompt here' }), ctx('p1'));
    expect(res.status).toBe(502);
    expect(mockPrisma.project.updateMany).not.toHaveBeenCalled();
    expect(mockPrisma.aiUsage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ success: false, error: expect.stringContaining('invalid output') }),
      })
    );
  });

  it('rejects invalid component output (unknown type) and persists nothing', async () => {
    signedIn('user_badtype');
    mockPrisma.project.findFirst.mockResolvedValue({ ...ownedProject, userId: 'user_badtype' } as never);
    providerReturning([{ id: 'x', type: 'banner', props: {}, styles: {} }]);

    const res = await generate(req({ prompt: 'a valid prompt here' }), ctx('p1'));
    expect(res.status).toBe(502);
    expect(mockPrisma.project.updateMany).not.toHaveBeenCalled();
  });

  it('returns the validated document, persists it, and records usage on success', async () => {
    signedIn('user_ok');
    mockPrisma.project.findFirst.mockResolvedValue({ ...ownedProject, userId: 'user_ok' } as never);
    mockPrisma.project.updateMany.mockResolvedValue({ count: 1 } as never);
    mockPrisma.aiUsage.create.mockResolvedValue({} as never);
    providerReturning(validGenerated);

    const res = await generate(req({ prompt: 'a landing page for a yoga studio' }), ctx('p1'));
    expect(res.status).toBe(200);
    const body = await res.json();

    // Stable builder response shape
    expect(body.success).toBe(true);
    expect(Array.isArray(body.components)).toBe(true);
    expect(body.components).toHaveLength(1);
    expect(body.components[0]).toMatchObject({ id: 'hero-1', type: 'hero' });
    expect(typeof body.model).toBe('string');

    // Persisted exactly the validated document, scoped to the owner
    expect(mockPrisma.project.updateMany).toHaveBeenCalledWith({
      where: { id: 'p1', userId: 'user_ok' },
      data: { components: validGenerated },
    });

    // Usage accounting with token + latency metadata
    expect(mockPrisma.aiUsage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user_ok',
          projectId: 'p1',
          provider: 'mock',
          model: 'mock-1',
          success: true,
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
          latencyMs: expect.any(Number),
        }),
      })
    );
  });
});
