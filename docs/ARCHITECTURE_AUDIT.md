# Architecture Audit — Landing Builder → AI Business Launchpad

> **Phase 3A provider architecture (update):** generation is provider-agnostic — one shared OpenAI-compatible adapter factory serves **Kimi** (`KIMI_API_KEY`, default `moonshot-v1-8k`), **NVIDIA NIM** (`NVIDIA_API_KEY`, default `meta/llama-3.1-8b-instruct`), **OpenAI** (optional, `OPENAI_API_KEY`), and **mock** (default). `AI_PROVIDER` resolution is strict: unknown values and missing credentials are explicit configuration errors (500), never a silent fallback. All provider output still passes `validateComponents()` before builder/DB/publish. Interface renamed to `generateStructuredComponents()`. 21 provider contract tests added (75 total). All gates green. Earlier notes remain the historical record.

> **Phase 3A outcome (update):** first AI generation loop live — `AiUsage` model (+ offline migration), env-configurable provider abstraction (`AI_PROVIDER`: mock default / OpenAI via fetch, zero new deps), `POST /api/projects/[id]/generate` (auth + ownership + prompt validation + 5/min rate limit + provider output forced through `validateComponents` before persist + usage accounting), builder "Generate with AI" dialog, 9 new contract tests (54 total), gate extended with the generate-401 check. All gates green. Earlier notes remain the historical record.

> **Phase 2B outcome (update):** the product loop now exists — Prisma persistence (User/Project with `publishedAt`/`publishedHtml` snapshot fields, offline-generated initial migration in `prisma/migrations/`), ownership-scoped project CRUD (`/api/projects`, `/api/projects/[id]`), dashboard at `/`, builder at `/builder/[id]` with save/load, real publishing (`POST /api/projects/[id]/publish` → public `/p/[slug]`, collision-safe slugs, republish keeps URL), `/sign-up`, `/api/publish` repurposed as an honest HTML/CSS export endpoint, and 45 vitest contract tests (ownership, CRUD, validation, escaping, publish auth, slug, public render, mocked e2e flow) — all gates green. Phase 1 note below remains the historical record.

> **Phase 1 outcome (update, same day):** all Phase 1 blockers identified below have been fixed — `tsconfig.json`, `postcss.config.js`, `.eslintrc.json`, `package-lock.json`, `public/`, `TemplateGallery.tsx`, and `ExportDialog.tsx` were created; `PropertyPanel.tsx`, imports/exports, Tailwind tokens, `next.config.js`, and the Dockerfile were repaired. `npm ci`, `prisma validate`, `prisma generate`, `tsc --noEmit`, `next lint`, and `next build` all pass. Details in the Phase 1 final report; the findings below remain the historical record of the pre-fix state.

Date: 2026-08-16
Scope: read-only audit of the repository on branch `ai-business-launchpad` (HEAD `ec8e589`).
No source files were modified, deleted, or added (the working tree is verified `git clean` after the audit). A temporary `tsconfig.json` was used to enumerate compile errors and was removed afterwards.

> **Note on the master specification:** no spec document exists inside this repository (no `docs/`, no markdown other than `README.md`). "What needs to be built" below is inferred from the stated goal ("AI Business Launchpad") and the branch name. Share the spec to turn Section 8 into a precise gap list.

---

## 1. Executive summary

The repository is a **Next.js 14 App Router prototype of a drag-and-drop landing-page builder** with Clerk authentication and an unused Prisma/PostgreSQL schema. It is **not in a working state**: the production build fails, Railway deployment would fail in three independent ways, the publish API is a mock that deploys nothing, and the database is never touched by any code. There are **no tests, no lint config, no tsconfig, no lockfile**.

The bones are reusable (Next 14 + TS + Clerk + Prisma + Tailwind/Radix + react-dnd), but the first milestone of any Launchpad work must be a **fix-to-green** pass, not new features.

## 2. Repository inventory

Tracked files (complete list):

| Area | Files |
|---|---|
| App shell | `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `app/sign-in/[[...sign-in]]/page.tsx` |
| Builder | `app/components/LandingPageBuilder.tsx`, `Canvas.tsx`, `ComponentPalette.tsx`, `ComponentRenderer.tsx`, `PropertyPanel.tsx` |
| API | `app/api/publish/route.ts` (only route) |
| Auth | `middleware.ts` (Clerk v4 `authMiddleware`) |
| DB | `prisma/schema.prisma` (User, Project, Template) |
| Config | `package.json`, `next.config.js`, `tailwind.config.js`, `.env.example`, `.gitignore` |
| Deploy | `Dockerfile`, `railway.json` |
| Docs | `README.md` |

**Missing that the code references:** `app/components/TemplateGallery.tsx`, `app/components/ExportDialog.tsx` (imported in `LandingPageBuilder.tsx:9-10`; never existed in git history).

**Missing standard project files:** `tsconfig.json`, `package-lock.json`, `postcss.config.js`, `.eslintrc*`, `public/`, tests, CI config.

## 3. Framework and architecture

- **Framework:** Next.js 14 (resolves to 14.2.35), React 18, TypeScript (strict), App Router.
- **Auth:** Clerk v4 (`@clerk/nextjs` ^4.29.5) — `ClerkProvider` in root layout, `authMiddleware` in `middleware.ts`, catch-all sign-in page, server-side `auth()` guard in `app/page.tsx`.
- **Editor:** client-side React state only. `LandingPageBuilder` holds `components: Component[]` in `useState`; children are `ComponentPalette` (drag source), `Canvas` (drop target via react-dnd), `ComponentRenderer` (per-type JSX), `PropertyPanel` (content/style editing). Component model: `{ id, type, props, styles }` — 7 types: header, hero, features, testimonials, pricing, cta, footer.
- **Publishing:** single route `POST /api/publish` that string-interpolates components into static HTML and returns a **mock URL** (`https://landing-<timestamp>.launchpad-demo.com`). Nothing is stored or deployed.
- **Data:** Prisma schema (PostgreSQL) defines `User` (clerkId mapping), `Project` (components/styles/seo as JSON, slug, published flag), `Template` — **but no code imports `@prisma/client`**. There is no `lib/prisma.ts`, no CRUD, no save/load. Builder state is lost on refresh.
- **Styling:** Tailwind 3 with shadcn-style HSL CSS variables in `globals.css`; Radix primitives, CVA, lucide-react installed (only lucide is actually used).
- **Deploy:** multi-stage `Dockerfile` (node:20-alpine) driven by `railway.json` (DOCKERFILE builder, 1 replica).

## 4. Verification (commands actually run)

Dependencies were installed with `npm install --no-package-lock` (565 packages, success; resolved `next@14.2.35`, `prisma@5.22.0`). `node_modules/` was left in place (gitignored).

| Command | Result |
|---|---|
| `npm run build` (repo as-is) | **FAIL** — `Module not found: Can't resolve '@/components/LandingPageBuilder'` at `./app/page.tsx` |
| `npx tsc --noEmit` (temp tsconfig, `@/* → ./*`) | **FAIL** — 3 parse errors at `app/components/PropertyPanel.tsx:172` |
| `npm run build` (temp tsconfig, `@/* → ./app/*`) | **FAIL** — `Can't resolve './TemplateGallery'`, `Can't resolve './ExportDialog'`, SWC syntax error in `PropertyPanel.tsx` |
| `CI=true npx next lint` | **Not runnable** — no ESLint config; `next lint` enters interactive setup prompt |
| `npx prisma validate` | **PASS** — schema valid; client generated on install |
| lucide-react type surface (2,769 exports) | `Header` **does not exist** — `ComponentPalette.tsx:5` imports a non-existent icon |
| Tests | **None exist** — no test script, runner, or test files |

Notes from build output: `next.config.js` `experimental.serverActions: true` is rejected by Next 14 ("Expected object, received boolean") — warning only, non-fatal.

## 5. Findings by area

### 5.1 `package.json`
- Scripts: `dev`, `build`, `start`, `lint`, `postinstall: prisma generate`. No `test`, no `typecheck`.
- `tailwindcss`, `autoprefixer`, `postcss` are duplicated in `dependencies` **and** `devDependencies`.
- No lockfile → dependency drift is uncontrolled (already: `next ^14.0.0` → 14.2.35). This also **breaks the Dockerfile**, which uses `npm ci`.
- No AI/LLM SDK, no Stripe/billing, no rate-limit/Redis client — despite commit messages claiming "Neon DB, Upstash Redis" (neither appears anywhere in code).

### 5.2 Prisma schema
- Valid, sensible starter: `User.clerkId` unique mapping, `Project` with JSON component blob + publish fields, `Template` catalog. Indexes on `userId`, `slug`.
- Zero references from application code. No migrations directory (project used `db push` per README).
- Risk: `components Json` blob has no schema versioning field — future format changes will strand old rows.

### 5.3 Authentication
- Correctly wired for Clerk v4: provider, middleware, guard, sign-in UI. Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`.
- Issues:
  - `/` is listed public in middleware but `app/page.tsx` force-redirects to `/sign-in` — inconsistent intent.
  - `/sign-up` is whitelisted but **no sign-up page exists** → 404 if Clerk links to it.
  - Clerk v4 `authMiddleware` is deprecated upstream; a v5 upgrade (different API: `clerkMiddleware()`) is a planned migration, not a blocker.

### 5.4 Landing-page editor
- State model and panel layout are a reasonable seed; 7 component types with default props/styles.
- Broken/incomplete:
  - `PropertyPanel.tsx:171-174` is **corrupted source** (`type="text""/value"}` followed by stray input) — hard syntax error.
  - `Component` interface in `LandingPageBuilder.tsx:15` is **not exported**, but `Canvas.tsx:6`, `ComponentRenderer.tsx:3`, `PropertyPanel.tsx:4` all `import { Component }` — type error.
  - `app/page.tsx:3` uses a **named import** `{ LandingPageBuilder }` for a **default export** — type error.
  - `ComponentPalette.tsx:5` imports non-existent `Header` from lucide-react.
  - `TemplateGallery` / `ExportDialog` imports point to files that don't exist.
  - Drag-and-drop is half-built: the canvas `drop` handler is a no-op (`Canvas.tsx:24-28`); adding works only via click; reordering is explicitly "coming soon".
  - `ComponentRenderer` covers only 4 of 7 types; pricing/cta/footer fall through to a placeholder.

### 5.5 Publishing
- `app/api/publish/route.ts` is a **demo stub**: builds an HTML string, returns a fictitious `*.launchpad-demo.com` URL. No storage, no deploy, no DB write. `window.open(data.url)` in the builder opens a domain that does not exist.
- User-controlled props are interpolated into HTML **without escaping** (XSS in the generated artifact; single-user scope today, but the pattern must not survive).
- Client `publishPage` (`LandingPageBuilder.tsx:74-85`) has no error handling and no `Content-Type` header (works, but sloppy).

### 5.6 Railway / Docker
`railway.json` delegates to the Dockerfile, which fails at three independent points:
1. `npm ci` requires `package-lock.json` — **absent**.
2. The `deps` stage copies only `package*.json`, then `npm ci` runs `postinstall: prisma generate`, which needs `prisma/schema.prisma` — **not copied yet**.
3. `COPY --from=builder /app/public ./public` — **`public/` does not exist**.

Also: full `node_modules` is copied into the runner image (no Next standalone output) — bloated but not fatal. No healthcheck configured; no DB migration step at startup.

### 5.7 Styling pipeline
- **No `postcss.config.js`** → Tailwind directives in `globals.css` are never compiled → the app renders unstyled even after the build is fixed.
- Once PostCSS is added, `globals.css:54` (`@apply border-border`) will **fail the Tailwind build**, because `tailwind.config.js` never defines `border` (also missing: `input`, `ring`, `card`, `popover`, `destructive` colors, and the `borderRadius` scale referenced by `--radius`).

## 6. What works now

Verified working:
- Prisma schema validates; client generates.
- Dependency set installs cleanly on Node 20.

Present and architecturally sound, but unreachable until the build is fixed (not runtime-verified):
- Clerk auth chain (provider → middleware → guard → sign-in page).
- Builder UI state flow (add/select/update/delete components, property panel, default props/styles).
- 7-type component model and renderer pattern.
- Publish API skeleton with auth check.
- Docker/Railway multi-stage intent.

**Nothing is runnable end-to-end today**: `next build` fails, so there is no deployable artifact.

## 7. Reusable toward the AI Business Launchpad

- Next.js 14 App Router + TypeScript base; `app/` layout conventions.
- Clerk auth (keep; schedule v5 upgrade).
- Prisma + PostgreSQL with a usable `User`/`Project` seed — extend, don't replace.
- Component document model (`type/props/styles` JSON) — a good persistence shape for generated pages.
- Tailwind + Radix + CVA + lucide UI foundation; shadcn-style token structure in `globals.css`.
- react-dnd scaffolding for the editor.
- Railway target + multi-stage Dockerfile (after fixes).

## 8. What needs to be built

Inferred (pending the master spec):

**Baseline (blocking):**
1. Fix the build (Section 9, items B1–B8) — nothing else can proceed until green.
2. Tooling: lockfile, ESLint config, `typecheck` script, PostCSS config, Tailwind token fixes.

**Product:**
3. Persistence layer: `lib/prisma.ts`, project CRUD API, save/load in the builder, user sync (Clerk → `User` row), dashboard with project list.
4. Real publishing: either render `Project.components` at a public route (e.g. `/p/[slug]`, cheapest and fully in-platform) or deploy generated static HTML to a hosting API (Vercel/Netlify/Cloudflare/S3+CDN). Update `middleware.ts` public routes accordingly.
5. AI generation layer: LLM provider SDK + prompt pipeline + streaming UI for generating business/page content into the component model (no AI dependency exists today).
6. Launchpad domain entities per spec (business idea/niche, offer, brand kit, content assets, launch checklist…) — new Prisma models + migrations.
7. Template gallery backed by the `Template` model (or delete the model and the UI button).
8. Billing/limits if the spec requires (Stripe + plan gates; the "Upstash Redis" rate limiting mentioned in commits does not exist).
9. Tests (unit for the model/serializers, e2e for auth → build → publish) and CI.

## 9. Exact files that would need changing

**To make the build green (B1–B8):**
- **B1** Create `tsconfig.json` — with `"paths": { "@/*": ["./app/*"] }` to match the actual layout (or `@/* → ./*` and move components to repo root).
- **B2** `app/components/PropertyPanel.tsx` — repair corrupted JSX at lines 171-174 (duplicate stray `<input type="text""/value"}`).
- **B3** Create `app/components/TemplateGallery.tsx` and `app/components/ExportDialog.tsx` (or remove their imports and the Templates/Export buttons in `LandingPageBuilder.tsx:9-10,156-171`).
- **B4** `app/page.tsx:3` — change to default import (`import LandingPageBuilder from ...`).
- **B5** `app/components/LandingPageBuilder.tsx` — export the `Component` interface.
- **B6** `app/components/ComponentPalette.tsx:5` — replace `Header` with an existing lucide icon (e.g. `PanelTop`).
- **B7** Create `postcss.config.js` (`tailwindcss` + `autoprefixer`); extend `tailwind.config.js` with the missing `border`/`input`/`ring`/`card`/`popover`/`destructive` colors.
- **B8** `next.config.js` — remove `experimental.serverActions`.

**Deploy fixes:**
- Generate and commit `package-lock.json`; dedupe tailwind/postcss/autoprefixer in `package.json`.
- `Dockerfile` — copy `prisma/` before `npm ci`; add `public/` (or drop that COPY); optionally switch to Next standalone output.
- `.eslintrc.json` — `{ "extends": "next/core-web-vitals" }`.

**Feature work (new/extended):**
- `lib/prisma.ts`, `app/api/projects/**` (CRUD), `app/dashboard/**`, `app/p/[slug]/**` (public render) or new publish target integration.
- `app/api/publish/route.ts` — persist + real deploy + HTML escaping.
- `middleware.ts` — public routes for published pages; add `app/sign-up/[[...sign-up]]/page.tsx` or drop the whitelist entry.
- `prisma/schema.prisma` — launchpad entities + migrations directory; add a `version` field to the components JSON.
- `.env.example` — AI provider keys, any billing keys.

## 10. Recommended build order

1. **Fix-to-green** (B1–B8) → `npm run build` passes. Everything else waits on this.
2. **Tooling baseline**: lockfile, ESLint, `typecheck` script, Dockerfile/Railway fixes → deployable "hello" state.
3. **Persistence**: Prisma client + user sync + project save/load + dashboard.
4. **Real publishing** via `/p/[slug]` public rendering (simplest real publish; external deploy targets later).
5. **AI generation MVP**: one end-to-end flow (prompt → generated page JSON in the existing component model → editable in builder → publishable).
6. **Launchpad domain features** per the master spec (brand kit, offer, checklist, assets).
7. **Billing/limits**, template marketplace, external deploy targets.
8. **Hardening**: tests, CI, Clerk v5 upgrade, escaping/sanitization, schema versioning.

## 11. Risks

- **Build is broken in 8+ places** and each fix can reveal the next layer (webpack stage → type stage). The full set found so far is enumerated, but only B1–B8's completion will prove it.
- **Documentation is untrustworthy**: README advertises features that don't exist (code export, custom domains, template gallery, responsive preview); commit messages claim Neon/Upstash integrations that are absent.
- **No lockfile** → every install resolves differently; reproducing failures is luck.
- **Master spec absent from repo** — scope for Sections 8/12 is inferred; wrong assumptions here invalidate the plan, not the audit findings.
- **Railway/Docker untested** — three known failure points, possibly more (no healthcheck, no migration step).
- **JSON blob persistence** without versioning will complicate migrations once AI-generated formats evolve.
- **Clerk v4 EOL path** — v5 migration is mechanical but touches middleware, layout, and every `auth()` call.
- **Repo location** (`C:\Windows\System32\landing-builder`) is unusual for a Windows dev environment — permission and tooling quirks possible; stale `.next` cache was observed during the audit.

## 12. Estimated complexity

| Work item | Complexity | Rough effort |
|---|---|---|
| B1–B8 fix-to-green | Low | 0.5–1 day |
| Tooling + Docker/Railway fixes | Low | 0.5 day |
| Persistence + dashboard | Medium | 2–4 days |
| Real publishing (`/p/[slug]`) | Low–Medium | 1–2 days |
| AI generation MVP | Medium | 3–5 days |
| Full Launchpad per spec (entities, brand kit, billing, limits) | High | 2–4 weeks, pending spec |

Overall: the codebase is a **prototype, ~15–20% of the way** to the described product. The fastest path is salvage-and-extend, not rewrite — but only after the fix-to-green pass.

---

### Appendix — audit method

Commands run (read-only effect on tracked files): `npm install --no-package-lock`, `npm run build` (3 variants, one with a temporary tsconfig that was removed), `npx tsc --noEmit`, `CI=true npx next lint`, `npx prisma validate`, inspection of `node_modules/lucide-react` type exports, `git log`/`git ls-tree`/`git show --stat`. Final `git status`: clean. `node_modules/` remains installed (gitignored) for subsequent work.
