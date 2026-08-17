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
  },
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { POST as publishProject } from '@/api/projects/[id]/publish/route';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma, true);

const userRow = { id: 'user_1', clerkId: 'clerk_1', email: 'a@b.c', name: null };

function signedIn() {
  mockAuth.mockResolvedValue({ userId: 'clerk_1' } as never);
  mockPrisma.user.findUnique.mockResolvedValue(userRow as never);
}

const req = () => new NextRequest('http://localhost:3000/api/projects/p1/publish', { method: 'POST' });
const ctx = (id: string) => ({ params: { id } });

const ownedProject = {
  id: 'p1',
  userId: 'user_1',
  slug: 'my-page-abc123',
  title: 'My Page',
  components: [
    { id: 'hero-1', type: 'hero', props: { title: 'Hello <script>alert(1)</script>' }, styles: {} },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/projects/[id]/publish', () => {
  it('rejects unauthenticated requests', async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);
    const res = await publishProject(req(), ctx('p1'));
    expect(res.status).toBe(401);
  });

  it('returns 404 for projects owned by someone else', async () => {
    signedIn();
    mockPrisma.project.findFirst.mockResolvedValue(null as never);
    const res = await publishProject(req(), ctx('p1'));
    expect(res.status).toBe(404);
  });

  it('rejects invalid stored component data', async () => {
    signedIn();
    mockPrisma.project.findFirst.mockResolvedValue({ ...ownedProject, components: 'garbage' } as never);
    const res = await publishProject(req(), ctx('p1'));
    expect(res.status).toBe(422);
  });

  it('publishes an escaped snapshot and returns the real public path', async () => {
    signedIn();
    mockPrisma.project.findFirst.mockResolvedValue(ownedProject as never);
    mockPrisma.project.updateMany.mockResolvedValue({ count: 1 } as never);

    const res = await publishProject(req(), ctx('p1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.url).toBe('/p/my-page-abc123');
    expect(body.url.startsWith('https://')).toBe(false); // no more fake demo domain

    const updateArgs = mockPrisma.project.updateMany.mock.calls[0][0] as {
      where: { id: string; userId: string };
      data: { published: boolean; publishedAt: Date; publishedHtml: string; publishedUrl: string };
    };
    expect(updateArgs.where).toEqual({ id: 'p1', userId: 'user_1' });
    expect(updateArgs.data.published).toBe(true);
    expect(updateArgs.data.publishedAt).toBeInstanceOf(Date);
    expect(updateArgs.data.publishedUrl).toBe('/p/my-page-abc123');
    // Snapshot must be escaped: the injected script is neutralized.
    expect(updateArgs.data.publishedHtml).toContain('&lt;script&gt;');
    expect(updateArgs.data.publishedHtml).not.toContain('<script>alert');
  });

  it('republishing keeps the same slug and URL', async () => {
    signedIn();
    mockPrisma.project.findFirst.mockResolvedValue(ownedProject as never);
    mockPrisma.project.updateMany.mockResolvedValue({ count: 1 } as never);

    const first = await (await publishProject(req(), ctx('p1'))).json();
    const second = await (await publishProject(req(), ctx('p1'))).json();
    expect(first.url).toBe(second.url);
    expect(first.slug).toBe(second.slug);
  });

  it('rate limits repeated publishes', async () => {
    signedIn();
    mockPrisma.project.findFirst.mockResolvedValue(ownedProject as never);
    mockPrisma.project.updateMany.mockResolvedValue({ count: 1 } as never);

    let saw429 = false;
    for (let i = 0; i < 15; i++) {
      const res = await publishProject(req(), ctx('p1'));
      if (res.status === 429) {
        saw429 = true;
        const body = await res.json();
        expect(body.success).toBe(false);
        break;
      }
    }
    expect(saw429).toBe(true);
  });
});
