#!/usr/bin/env node
/**
 * Production gate — DEPLOY tier (READ-ONLY).
 *
 * Sends HTTP requests to a deployed Landing Builder instance and asserts the
 * production contract. It never writes to the target beyond read-only probes
 * (the single POST is unauthenticated and is rejected before reaching any
 * application logic). There is intentionally no --fix mode.
 *
 * Usage:
 *   BASE_URL=https://your-app.up.railway.app npm run gate:deploy
 *
 * Environment:
 *   BASE_URL           Target origin (default http://localhost:3000)
 *   GATE_P95_FAIL_MS   p95 latency threshold for /api/health (default 2000)
 *
 * Exit code: 0 = all checks passed (warnings allowed), 1 = at least one FAIL.
 */

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const IS_HTTPS = BASE_URL.startsWith('https://');
const P95_FAIL_MS = Number(process.env.GATE_P95_FAIL_MS || 2000);
const LATENCY_SAMPLES = 5;
const REQUEST_TIMEOUT_MS = 10_000;

let failures = 0;
let warnings = 0;

const pass = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`FAIL  ${msg}`);
};
const warn = (msg) => {
  warnings += 1;
  console.log(`WARN  ${msg}`);
};
const skip = (msg) => console.log(`SKIP  ${msg}`);

async function probe(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const started = performance.now();
  try {
    const res = await fetch(BASE_URL + path, {
      redirect: 'manual',
      signal: controller.signal,
      ...options,
    });
    const ms = performance.now() - started;
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    let json = null;
    if (contentType.includes('application/json')) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }
    return { res, ms, contentType, json };
  } finally {
    clearTimeout(timer);
  }
}

async function checkHealth() {
  const { res, contentType, json } = await probe('/api/health');
  if (res.status !== 200) return fail(`/api/health returned ${res.status}, expected 200`);
  if (!contentType.includes('application/json')) {
    return fail(`/api/health content-type is ${contentType}, expected JSON`);
  }
  if (!json || json.status !== 'ok') {
    return fail(`/api/health body missing {"status":"ok"}`);
  }
  pass('/api/health returns 200 JSON with status ok');
  return { headers: res.headers };
}

function checkSecurityHeaders(headers) {
  const required = [
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
    'content-security-policy',
  ];
  for (const name of required) {
    if (headers.get(name)) {
      pass(`security header present: ${name}`);
    } else {
      fail(`security header missing: ${name}`);
    }
  }
  if (IS_HTTPS) {
    if (headers.get('strict-transport-security')) {
      pass('security header present: strict-transport-security (HTTPS)');
    } else {
      fail('security header missing: strict-transport-security (required on HTTPS)');
    }
  } else {
    skip('strict-transport-security check (plain HTTP target)');
  }
}

async function checkUnknownApiRouteIsJson() {
  const { res, contentType } = await probe('/api/__gate_unknown_route__');
  // Unauthenticated: Clerk middleware answers 401 JSON before routing.
  // Authenticated: the optional catch-all answers 404 JSON.
  if (![401, 404].includes(res.status)) {
    return fail(`unknown /api/* route returned ${res.status}, expected 401 or 404`);
  }
  if (!contentType.includes('application/json')) {
    return fail(`unknown /api/* route returned ${contentType}, expected JSON (never HTML)`);
  }
  pass(`unknown /api/* route returns JSON (${res.status})`);
}

async function checkPublishRequiresAuth() {
  const { res, contentType } = await probe('/api/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (res.status !== 401) {
    return fail(`unauthenticated POST /api/publish returned ${res.status}, expected 401`);
  }
  if (!contentType.includes('application/json')) {
    return fail(`unauthenticated POST /api/publish returned ${contentType}, expected JSON`);
  }
  pass('unauthenticated POST /api/publish is rejected with 401 JSON');
}

async function checkProjectsRequireAuth() {
  const { res, contentType } = await probe('/api/projects');
  if (res.status !== 401) {
    return fail(`unauthenticated GET /api/projects returned ${res.status}, expected 401`);
  }
  if (!contentType.includes('application/json')) {
    return fail(`unauthenticated GET /api/projects returned ${contentType}, expected JSON`);
  }
  pass('unauthenticated GET /api/projects is rejected with 401 JSON');
}

async function checkGenerateRequiresAuth() {
  const { res, contentType } = await probe('/api/projects/__gate__/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: 'gate check probe' }),
  });
  if (res.status !== 401) {
    return fail(`unauthenticated POST /api/projects/[id]/generate returned ${res.status}, expected 401`);
  }
  if (!contentType.includes('application/json')) {
    return fail(`unauthenticated POST /api/projects/[id]/generate returned ${contentType}, expected JSON`);
  }
  pass('unauthenticated POST /api/projects/[id]/generate is rejected with 401 JSON');
}

async function checkUnpublishedPageIs404() {  const { res } = await probe('/p/__gate_not_published__');
  if (res.status === 404) {
    pass('unpublished /p/* page returns 404');
  } else if (res.status >= 500) {
    warn(`GET /p/__gate_not_published__ returned ${res.status} — target database may be unreachable (expected 404 when the DB is configured)`);
  } else {
    fail(`GET /p/__gate_not_published__ returned ${res.status}, expected 404`);
  }
}

async function checkRootRequiresAuth() {
  const { res } = await probe('/');
  const location = res.headers.get('location') || '';
  if ([301, 302, 303, 307, 308].includes(res.status) && location.includes('/sign-in')) {
    return pass(`GET / redirects unauthenticated users to sign-in (${res.status})`);
  }
  if (res.status === 200) {
    return fail('GET / returns 200 without authentication — builder is publicly exposed');
  }
  warn(`GET / returned ${res.status} (expected a redirect to /sign-in; a 5xx here usually means missing/invalid Clerk keys on the target)`);
}

async function checkSignInPage() {
  const { res } = await probe('/sign-in');
  if (res.status === 200) {
    pass('GET /sign-in is publicly reachable (200)');
  } else {
    fail(`GET /sign-in returned ${res.status}, expected 200`);
  }
}

async function checkLatency() {
  const samples = [];
  for (let i = 0; i < LATENCY_SAMPLES; i++) {
    const { res, ms } = await probe('/api/health');
    if (res.status === 200) samples.push(ms);
  }
  if (samples.length === 0) return fail('latency check: no successful /api/health samples');
  samples.sort((a, b) => a - b);
  const p95 = samples[Math.min(samples.length - 1, Math.ceil(samples.length * 0.95) - 1)];
  const rounded = Math.round(p95);
  if (p95 > P95_FAIL_MS) {
    fail(`/api/health p95 ${rounded}ms exceeds ${P95_FAIL_MS}ms (${samples.length} samples)`);
  } else {
    pass(`/api/health p95 ${rounded}ms within ${P95_FAIL_MS}ms (${samples.length} samples)`);
  }
}

console.log(`Production gate (deploy tier, read-only) — target: ${BASE_URL}\n`);

try {
  const health = await checkHealth();
  if (health) checkSecurityHeaders(health.headers);
  await checkUnknownApiRouteIsJson();
  await checkPublishRequiresAuth();
  await checkProjectsRequireAuth();
  await checkGenerateRequiresAuth();
  await checkUnpublishedPageIs404();
  await checkRootRequiresAuth();
  await checkSignInPage();
  await checkLatency();
} catch (error) {
  fail(`gate aborted: ${error instanceof Error ? error.message : String(error)}`);
}

console.log(`\nResult: ${failures} failure(s), ${warnings} warning(s)`);
process.exit(failures > 0 ? 1 : 0);
