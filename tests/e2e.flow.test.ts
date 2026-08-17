import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// In-memory database fake. Exercises the real route handlers end to end:
// create -> save -> reopen -> publish -> public URL -> rename -> delete,
// plus cross-user isolation.
const state = vi.hoisted(() => ({
  users: new Map<string, Record<string, unknown>>(),
  projects: new Map<string, Record<string, unknown>>(),
  nextId: { n: 0 },
}));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(async () => ({
    emailAddresses: [{ emailAddress: 'e2e@test.dev' }],
    firstName: 'E2E',
    lastName: 'User',
  })),
}));

vi.mock('@/lib/prisma', () => {
  const matches = (row: Record<string, unknown>, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) => row[key] === value);

  const findOne = (where: Record<string, unknown>) => {
    for (const project of [...state.projects.values()]) {
      if (matches(project, where)) return project;
    }
    return null;
  };

  const prisma = {
    user: {
      findUnique: vi.fn(async ({ where }: { where: { clerkId: string } }) => {
        for (const user of state.users.values()) {
          if (user.clerkId === where.clerkId) return user;
        }
        return null;
      }),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const user = { id: `user_${++state.nextId.n}`, ...data };
        state.users.set(user.id as string, user);
        return user;
      }),
    },
    project: {
      findUnique: vi.fn(async ({ where }: { where: Record<string, unknown> }) => findOne(where)),
      findFirst: vi.fn(async ({ where }: { where: Record<string, unknown> }) => findOne(where)),
      findMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) =>
        [...state.projects.values()].filter((project) => matches(project, where))
      ),
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        const project = {
          id: `proj_${++state.nextId.n}`,
          description: null,
          styles: null,
          seo: null,
          published: false,
          publishedUrl: null,
          publishedAt: null,
          publishedHtml: null,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.projects.set(project.id as string, project);
        return project;
      }),
      updateMany: vi.fn(
        async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
          let count = 0;
          for (const project of [...state.projects.values()]) {
            if (matches(project, where)) {
              Object.assign(project, data);
              count += 1;
            }
          }
          return { count };
        }
      ),
      deleteMany: vi.fn(async ({ where }: { where: Record<string, unknown> }) => {
        let count = 0;
        for (const project of [...state.projects.values()]) {
          if (matches(project, where)) {
            state.projects.delete(project.id as string);
            count += 1;
          }
        }
        return { count };
      }),
    },
  };
  return { prisma };
});

import { auth } from '@clerk/nextjs/server';
import { POST as createProject, GET as listProjects } from '@/api/projects/route';
import {
  GET as getProject,
  PUT as updateProject,
  DELETE as deleteProject,
} from '@/api/projects/[id]/route';
import { POST as publishProject } from '@/api/projects/[id]/publish/route';
import { GET as publicPage } from '@/p/[slug]/route';

const mockAuth = vi.mocked(auth);

function asUser(clerkId: string) {
  mockAuth.mockResolvedValue({ userId: clerkId } as never);
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
const slugCtx = (slug: string) => ({ params: { slug } });

beforeEach(() => {
  state.users.clear();
  state.projects.clear();
  state.nextId.n = 0;
  vi.clearAllMocks();
});

describe('end-to-end workflow (mocked database)', () => {
  it('create -> save -> reopen -> publish -> public URL -> rename -> delete', async () => {
    asUser('clerk_e2e');

    // 1. Create
    const created = await (
      await createProject(req('/api/projects', 'POST', { title: 'My Landing Page' }))
    ).json();
    expect(created.success).toBe(true);
    const projectId = created.project.id as string;
    const slug = created.project.slug as string;
    expect(slug).toMatch(/^my-landing-page-[0-9a-f]{6}$/);

    // 2. Save components from the builder
    const components = [
      {
        id: 'hero-1',
        type: 'hero',
        props: { title: 'Buy Now <script>alert(1)</script>', ctaLink: 'javascript:alert(2)' },
        styles: { backgroundColor: '#fff' },
      },
    ];
    const saved = await updateProject(
      req(`/api/projects/${projectId}`, 'PUT', { components }),
      ctx(projectId)
    );
    expect(saved.status).toBe(200);

    // 3. Reopen (builder load path)
    const reopened = await (await getProject(req(`/api/projects/${projectId}`), ctx(projectId))).json();
    expect(reopened.project.components).toHaveLength(1);

    // 4. Publish
    const published = await (
      await publishProject(req(`/api/projects/${projectId}/publish`, 'POST'), ctx(projectId))
    ).json();
    expect(published.success).toBe(true);
    expect(published.url).toBe(`/p/${slug}`);

    // 5. Public URL — no session at all
    mockAuth.mockResolvedValue({ userId: null } as never);
    const page = await publicPage(req(`/p/${slug}`), slugCtx(slug));
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('Buy Now');
    // Injection attempts are neutralized in the served page
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>alert');
    expect(html).not.toContain('javascript:alert');

    // 6. Rename
    asUser('clerk_e2e');
    const renamed = await updateProject(
      req(`/api/projects/${projectId}`, 'PUT', { title: 'Renamed Page' }),
      ctx(projectId)
    );
    expect(renamed.status).toBe(200);

    // 7. Delete — afterwards it is gone for the owner and the public
    const deleted = await deleteProject(req(`/api/projects/${projectId}`, 'DELETE'), ctx(projectId));
    expect(deleted.status).toBe(200);
    expect((await getProject(req(`/api/projects/${projectId}`), ctx(projectId))).status).toBe(404);
    expect((await publicPage(req(`/p/${slug}`), slugCtx(slug))).status).toBe(404);
  });

  it('isolates projects between users', async () => {
    asUser('clerk_alice');
    const created = await (
      await createProject(req('/api/projects', 'POST', { title: 'Alice Page' }))
    ).json();
    const projectId = created.project.id as string;

    asUser('clerk_bob');
    // Bob cannot see Alice's project...
    expect((await getProject(req(`/api/projects/${projectId}`), ctx(projectId))).status).toBe(404);
    // ...cannot modify it...
    expect(
      (await updateProject(req(`/api/projects/${projectId}`, 'PUT', { title: 'Hijacked' }), ctx(projectId))).status
    ).toBe(404);
    // ...cannot delete it...
    expect(
      (await deleteProject(req(`/api/projects/${projectId}`, 'DELETE'), ctx(projectId))).status
    ).toBe(404);
    // ...cannot publish it...
    expect(
      (await publishProject(req(`/api/projects/${projectId}/publish`, 'POST'), ctx(projectId))).status
    ).toBe(404);
    // ...and his own list is empty.
    const bobList = await (await listProjects()).json();
    expect(bobList.projects).toHaveLength(0);
  });
});
