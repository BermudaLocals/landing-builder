import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    project: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { GET as listProjects, POST as createProject } from '@/api/projects/route';
import {
  GET as getProject,
  PUT as updateProject,
  DELETE as deleteProject,
} from '@/api/projects/[id]/route';

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma, true);

const userRow = { id: 'user_1', clerkId: 'clerk_1', email: 'a@b.c', name: null };

function signedIn() {
  mockAuth.mockResolvedValue({ userId: 'clerk_1' } as never);
  mockPrisma.user.findUnique.mockResolvedValue(userRow as never);
}

function req(url: string, method = 'GET', body?: unknown) {
  return new NextRequest(`http://localhost:3000${url}`, {
    method,
    ...(body !== undefined
      ? { body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }
      : {}),
  });
}

const ctx = (id: string) => ({ params: { id } });

const validComponent = { id: 'hero-1', type: 'hero', props: { title: 'Hi' }, styles: {} };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/projects', () => {
  it('rejects unauthenticated requests', async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);
    const res = await listProjects();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('lists only the current user\'s projects', async () => {
    signedIn();
    mockPrisma.project.findMany.mockResolvedValue([] as never);
    const res = await listProjects();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.projects).toEqual([]);
    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user_1' } })
    );
  });
});

describe('POST /api/projects', () => {
  it('rejects unauthenticated requests', async () => {
    mockAuth.mockResolvedValue({ userId: null } as never);
    const res = await createProject(req('/api/projects', 'POST', {}));
    expect(res.status).toBe(401);
  });

  it('rejects invalid components and titles', async () => {
    signedIn();
    expect((await createProject(req('/api/projects', 'POST', { components: 'x' }))).status).toBe(400);
    expect((await createProject(req('/api/projects', 'POST', { title: 42 }))).status).toBe(400);
  });

  it('creates a project owned by the current user with a unique slug', async () => {
    signedIn();
    mockPrisma.project.findUnique.mockResolvedValue(null as never); // slug free
    (mockPrisma.project.create as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      async (args: { data: Record<string, unknown> }) => ({ id: 'proj_1', ...args.data })
    );

    const res = await createProject(
      req('/api/projects', 'POST', { title: 'My Site', components: [validComponent] })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.project.slug).toMatch(/^my-site-[0-9a-f]{6}$/);

    const createArgs = mockPrisma.project.create.mock.calls[0][0] as { data: { userId: string } };
    expect(createArgs.data.userId).toBe('user_1');
  });
});

describe('GET /api/projects/[id]', () => {
  it('returns 404 for projects owned by someone else', async () => {
    signedIn();
    mockPrisma.project.findFirst.mockResolvedValue(null as never);
    const res = await getProject(req('/api/projects/p1'), ctx('p1'));
    expect(res.status).toBe(404);
    expect(mockPrisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', userId: 'user_1' } })
    );
  });

  it('returns the project when owned', async () => {
    signedIn();
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1', title: 'Mine' } as never);
    const res = await getProject(req('/api/projects/p1'), ctx('p1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.project.title).toBe('Mine');
  });
});

describe('PUT /api/projects/[id]', () => {
  it('validates input', async () => {
    signedIn();
    expect((await updateProject(req('/api/projects/p1', 'PUT', {}), ctx('p1'))).status).toBe(400);
    expect(
      (await updateProject(req('/api/projects/p1', 'PUT', { components: [{ bad: true }] }), ctx('p1'))).status
    ).toBe(400);
  });

  it('returns 404 when the project is not owned', async () => {
    signedIn();
    mockPrisma.project.updateMany.mockResolvedValue({ count: 0 } as never);
    const res = await updateProject(req('/api/projects/p1', 'PUT', { title: 'New' }), ctx('p1'));
    expect(res.status).toBe(404);
  });

  it('updates an owned project with ownership-scoped query', async () => {
    signedIn();
    mockPrisma.project.updateMany.mockResolvedValue({ count: 1 } as never);
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'p1', title: 'New' } as never);
    const res = await updateProject(req('/api/projects/p1', 'PUT', { title: 'New' }), ctx('p1'));
    expect(res.status).toBe(200);
    expect(mockPrisma.project.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', userId: 'user_1' } })
    );
  });
});

describe('DELETE /api/projects/[id]', () => {
  it('returns 404 when the project is not owned', async () => {
    signedIn();
    mockPrisma.project.deleteMany.mockResolvedValue({ count: 0 } as never);
    const res = await deleteProject(req('/api/projects/p1', 'DELETE'), ctx('p1'));
    expect(res.status).toBe(404);
  });

  it('deletes an owned project', async () => {
    signedIn();
    mockPrisma.project.deleteMany.mockResolvedValue({ count: 1 } as never);
    const res = await deleteProject(req('/api/projects/p1', 'DELETE'), ctx('p1'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
  });
});
