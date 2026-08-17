import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    project: { findFirst: vi.fn() },
  },
}));

import { prisma } from '@/lib/prisma';
import { GET as publicPage } from '@/p/[slug]/route';

const mockPrisma = vi.mocked(prisma, true);

const req = (slug: string) => new NextRequest(`http://localhost:3000/p/${slug}`);
const ctx = (slug: string) => ({ params: { slug } });

describe('GET /p/[slug] (public, no auth)', () => {
  it('serves the published snapshot as HTML without requiring a session', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({
      publishedHtml: '<!DOCTYPE html><html><body>Hello world</body></html>',
    } as never);

    const res = await publicPage(req('my-page-abc123'), ctx('my-page-abc123'));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    expect(await res.text()).toContain('Hello world');

    // Looked up by slug AND published flag only — no user context.
    expect(mockPrisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { slug: 'my-page-abc123', published: true },
      })
    );
  });

  it('returns 404 for unknown or unpublished slugs', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null as never);
    const res = await publicPage(req('nope'), ctx('nope'));
    expect(res.status).toBe(404);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('returns 404 when the project has no snapshot yet', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ publishedHtml: null } as never);
    const res = await publicPage(req('stale'), ctx('stale'));
    expect(res.status).toBe(404);
  });
});
