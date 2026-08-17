#!/usr/bin/env node
/**
 * Live authenticated E2E — drives the real workflow over HTTP against a
 * running server with real credentials:
 *
 *   Clerk user+session (backend API) -> dashboard -> create project -> save
 *   -> reopen -> publish -> public /p/[slug] (no session) -> AI generate ->
 *   AiUsage row verified in the database.
 *
 * Prerequisites (all server-side, never printed):
 *   - server running at BASE_URL with real Clerk keys and DATABASE_URL
 *     (scripts/serve-dev.sh handles the Railway dev DB host swap)
 *   - CLERK_SECRET_KEY in this process env (to mint the test user/session)
 *   - DATABASE_URL reachable from here (for the AiUsage assertion)
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 node scripts/e2e-live.mjs
 *
 * Read-mostly: creates one test project + usage rows in the dev database and
 * one throwaway Clerk user (deleted afterwards on a best-effort basis).
 * Exit code 0 = every step passed.
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const CLERK_API = 'https://api.clerk.com/v1';
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || '';

const ALLOWED_TYPES = ['header', 'hero', 'features', 'testimonials', 'pricing', 'cta', 'footer'];
const MARKER = `E2E marker ${Date.now()}`;

let failures = 0;
const pass = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`FAIL  ${msg}`);
};

async function clerkApi(path, method = 'GET', body) {
  const res = await fetch(`${CLERK_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json, text };
}

async function api(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(BASE_URL + path, {
    method,
    redirect: 'manual',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* HTML */
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function main() {
  console.log(`Live authenticated E2E — target: ${BASE_URL}\n`);

  if (!CLERK_SECRET_KEY) {
    fail('CLERK_SECRET_KEY is not set — cannot mint a test session');
    return;
  }

  // 1. Clerk: create throwaway user + session + token (backend API)
  let clerkUserId = null;
  let cookie = '';
  {
    const email = `e2e-${Date.now()}@example.com`;
    const password = `E2e!${Math.random().toString(36).slice(2)}${Date.now()}x`;
    const created = await clerkApi('/users', 'POST', {
      email_address: [email],
      password,
      skip_password_checks: true,
    });
    if (created.status !== 200 || !created.json?.id) {
      fail(`Clerk user creation failed (${created.status})`);
      return;
    }
    clerkUserId = created.json.id;

    const session = await clerkApi('/sessions', 'POST', { user_id: clerkUserId });
    if (session.status !== 200 || !session.json?.id) {
      fail(`Clerk session creation failed (${session.status})`);
      return;
    }

    const token = await clerkApi(`/sessions/${session.json.id}/tokens`, 'POST', {});
    const jwt = token.json?.jwt || token.json?.token || null;
    if (!jwt) {
      fail(`Clerk session token failed (${token.status})`);
      return;
    }
    cookie = `__session=${jwt}`;
    pass('Clerk test user + session created (backend API)');
  }

  try {
    // 2. Authenticated dashboard (provisions the app User row on first sight)
    {
      const res = await api('/', { cookie });
      if (res.status === 200) {
        pass('GET / with session returns the dashboard (200)');
      } else {
        fail(`GET / with session returned ${res.status}, expected 200`);
        return;
      }
    }

    // 3. Create project
    let projectId = '';
    let slug = '';
    {
      const res = await api('/api/projects', {
        method: 'POST',
        cookie,
        body: { title: 'E2E Live Test' },
      });
      if (res.status === 201 && res.json?.project?.id) {
        projectId = res.json.project.id;
        slug = res.json.project.slug;
        pass(`project created (${slug})`);
      } else {
        fail(`create project returned ${res.status}`);
        return;
      }
    }

    // 4. Save components
    const components = [
      {
        id: 'hero-1',
        type: 'hero',
        props: { title: MARKER, subtitle: 'saved by e2e', ctaText: 'Go', ctaLink: '#', image: '' },
        styles: { backgroundColor: '#4f46e5', color: '#ffffff' },
      },
    ];
    {
      const res = await api(`/api/projects/${projectId}`, {
        method: 'PUT',
        cookie,
        body: { components },
      });
      if (res.status === 200) {
        pass('components saved');
      } else {
        fail(`save components returned ${res.status}`);
        return;
      }
    }

    // 5. Reopen — persisted document round-trips
    {
      const res = await api(`/api/projects/${projectId}`, { cookie });
      const stored = res.json?.project?.components?.[0]?.props?.title;
      if (res.status === 200 && stored === MARKER) {
        pass('reopened project returns the saved components');
      } else {
        fail(`reopen mismatch (status ${res.status})`);
        return;
      }
    }

    // 6. Publish
    let publicUrl = '';
    {
      const res = await api(`/api/projects/${projectId}/publish`, { method: 'POST', cookie });
      if (res.status === 200 && res.json?.url === `/p/${slug}`) {
        publicUrl = res.json.url;
        pass(`published, real URL ${publicUrl}`);
      } else {
        fail(`publish returned ${res.status}`);
        return;
      }
    }

    // 7. Public page — no session at all
    {
      const res = await api(publicUrl);
      if (res.status === 200 && res.text.includes(MARKER)) {
        pass('public /p/[slug] serves the published content without auth');
      } else {
        fail(`public page check failed (status ${res.status})`);
        return;
      }
    }

    // 8. AI generation (provider chosen by the server's AI_PROVIDER)
    {
      const res = await api(`/api/projects/${projectId}/generate`, {
        method: 'POST',
        cookie,
        body: { prompt: 'A landing page for a neighborhood bakery with online ordering' },
      });
      const generated = res.json?.components;
      const shapeOk =
        Array.isArray(generated) &&
        generated.length > 0 &&
        generated.every(
          (c) =>
            typeof c?.id === 'string' &&
            ALLOWED_TYPES.includes(c?.type) &&
            typeof c?.props === 'object' &&
            typeof c?.styles === 'object'
        );
      if (res.status === 200 && shapeOk) {
        pass(`AI generation returned ${generated.length} validated components (model ${res.json.model})`);
      } else {
        fail(`generate returned ${res.status} (shape ok: ${shapeOk})`);
        return;
      }
    }

    // 9. AiUsage persisted in the database
    {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      try {
        const usage = await prisma.aiUsage.findFirst({
          where: { projectId },
          orderBy: { createdAt: 'desc' },
        });
        if (usage && usage.success === true) {
          pass(
            `AiUsage row verified in DB (provider=${usage.provider} model=${usage.model} latencyMs=${usage.latencyMs} totalTokens=${usage.totalTokens})`
          );
        } else {
          fail('AiUsage row missing or marked unsuccessful');
        }
      } finally {
        await prisma.$disconnect();
      }
    }
  } finally {
    // Best-effort cleanup of the throwaway Clerk user only. Project and
    // AiUsage rows stay in the dev database for inspection.
    if (clerkUserId) {
      const del = await clerkApi(`/users/${clerkUserId}`, 'DELETE');
      if (del.status === 200) {
        pass('Clerk test user deleted');
      } else {
        console.log(`WARN  Clerk test user ${clerkUserId} not deleted (${del.status})`);
      }
    }
  }
}

try {
  await main();
} catch (error) {
  fail(`e2e aborted: ${error instanceof Error ? error.message : String(error)}`);
}

console.log(`\nResult: ${failures} failure(s)`);
process.exit(failures > 0 ? 1 : 0);
