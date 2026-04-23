## CI/CD & Platform Architecture

> _Independent assessment by senior DevOps / platform reliability review — April 2026_

IRONMIND is not a project that gets deployed by clicking "Publish" in a dashboard. It ships through a declarative, version-controlled delivery pipeline where every stage — lint, type-check, build, rules sync, preview, promote — is reproducible, auditable, and survives the disappearance of any individual tool or human. The platform layer is held to the same architectural standard as the application code: hard boundaries, typed configuration, zero hidden state.

### The Three-Environment Rule

Every change flows through exactly three environments before touching real users. No shortcuts, no "quick fixes on prod":

```
Local (dev)           →   Preview (per PR)        →   Production (main)
  ↓ npm run dev             ↓ vercel deploy             ↓ vercel --prod
Firebase emulators       Vercel preview URL          ironmind.vercel.app
.env.local               .env (preview)              .env (production)
```

**Hard constraints:**

- No local `.env` values ever ship to Vercel — env vars live in the Vercel project, pulled on demand
- No production deploy without a green preview from CI
- No Firestore rules change without passing through `firebase deploy` from a CI job
- No hand-edited Vercel dashboard settings — `vercel.ts` is the source of truth

This separation means: rollback is a single `vercel promote` of a previous deployment, rules regressions are caught at PR time via `firebase deploy --dry-run`, and any engineer can reproduce production's exact behavior locally with `vercel env pull` and `firebase emulators:start`.

### MCP-Integrated Development Environment

Cursor is wired to three Model Context Protocol servers, so the agent can inspect and operate on live infrastructure without context-switching to dashboards:

- **Vercel MCP** (`https://mcp.vercel.com`) — list projects, inspect deployments, fetch runtime logs, review environment variables, diagnose failed builds
- **Firebase MCP** (`npx firebase-tools mcp`) — query Firestore, review security rules, validate indexes, inspect Auth users, check Storage — auto-detects configured services from `firebase.json`
- **Context7 MCP** (`npx @upstash/context7-mcp`) — version-aware documentation for Next.js App Router, Firebase SDK, React Query, and every dependency, so AI-generated code references current APIs instead of hallucinated legacy patterns

Configuration lives in `.cursor/mcp.json`, committed to the repo. Any collaborator opening the project in Cursor inherits the exact same tooling surface — no manual setup, no "works on my machine" drift. This is the same pattern used by platform teams at Vercel, Supabase, and Linear to keep AI-augmented development consistent across contributors.

### Chat-Driven Deployment

A Cursor hook (`.cursor/hooks/cicd-shortcut.sh`) intercepts the phrase **"Complete CI/CD run"** in chat and automatically triggers the full publish workflow. No terminal needed:

```
Complete CI/CD run
```

The agent immediately executes:

1. `npm run ci` (lint → typecheck → build)
2. Git status check + commit if needed
3. `npm run publish` (push → Vercel auto-deploy)
4. Reports the live production URL

This hook uses `beforeSubmitPrompt` to inject automation instructions when the trigger phrase is detected. Configuration lives in `.cursor/hooks.json`, and the hook script is version-controlled alongside the codebase. The same pattern works for any repetitive workflow you want to reduce to a single chat phrase.

### Typed Platform Configuration

The Vercel project is configured through `vercel.ts`, not the dashboard or a JSON blob:

```typescript
import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  installCommand: 'npm ci',
};
```

**Benefits:**

- Full TypeScript intellisense on every platform setting
- Dynamic logic allowed (different headers per branch, env-aware rewrites)
- Code review catches routing regressions before they ship
- Rollback of platform config is a `git revert`, not a dashboard archaeology session

The same philosophy applies to Firebase: `firebase.json` configures emulator ports, `firestore.rules` governs data access, `firestore.indexes.json` locks composite indexes, `storage.rules` governs uploads. All four are plain files in `git` — zero configuration exists only in a cloud console.

### Delivery Pipeline

The CI pipeline runs on GitHub Actions. Every pull request and every push to `main` executes four stages in sequence, with aggressive caching and early-abort on failure:

```
1. install     →  npm ci (with actions/setup-node cache)
2. lint        →  eslint . --max-warnings=0
3. typecheck   →  tsc --noEmit
4. build       →  next build  (with all NEXT_PUBLIC_* env injected)
```

**Design principles:**

- **Fail fast**: lint runs before typecheck runs before build — cheapest failures surface first
- **Zero warnings policy**: `--max-warnings=0` means a new ESLint warning blocks the PR, preventing warning-rot
- **Concurrency guards**: `concurrency: ci-${{ github.ref }}` cancels superseded CI runs when a branch is force-pushed, so the queue doesn't back up
- **Deterministic installs**: `npm ci` (not `npm install`) — lockfile must match `package.json` exactly or the job fails

Firestore rules and indexes deploy from a dedicated workflow (`.github/workflows/firebase-rules.yml`) triggered only when rules/indexes files change. This keeps the app CI fast (no Firebase CLI boot on every run) while ensuring rules stay in lockstep with `main`. Deploy uses a service account with `Firebase Rules Admin` + `Cloud Datastore Index Admin` roles — minimum necessary permissions.

### Preview Deployments as a Design Tool

Every pull request gets a unique, isolated Vercel preview URL before a reviewer even looks at the diff. Preview deployments use the `preview` environment variable set in Vercel, which can point at a **staging Firebase project** (or the production project with stricter rules) to prevent test data from contaminating user records.

**Why this matters:**

- UI changes are reviewable on a real device, not just in screenshots
- Backend/API changes run against real infrastructure, not just unit tests
- Product stakeholders click a link instead of pulling a branch
- QA happens on the same artifact that will be promoted to production — zero config drift

Preview deployments are optionally protected with **Vercel Deployment Authentication**, requiring a Vercel login before the URL loads. This keeps pre-release work off search engines and out of screenshots-to-clients until it's ready.

### Secrets Management

Secrets never live in the repo. They live in three places, synchronized but not duplicated:

- **Local dev**: `.env.local` (git-ignored, pulled from Vercel via `vercel env pull`)
- **Vercel** (authoritative): set per environment (development / preview / production)
- **GitHub Actions**: repository secrets, mirroring Vercel production values for the build step

The `.env.example` file documents every expected variable with empty values and inline comments — a new contributor runs `cp .env.example .env.local`, fills in values (or runs `vercel env pull`), and is productive in under two minutes.

**Verification is automated:**

- `.gitignore` excludes all `.env*` files — verified with `git check-ignore` at setup time
- `NEXT_PUBLIC_*` prefix enforces the "exposed to client" contract — nothing without that prefix can be read by the browser bundle
- Firebase API keys are client-safe by design (scoped by auth domain in Firebase console), not a rotation concern unless the auth domain is compromised

### Protected Production

Production is not a branch anyone can push to. `main` is protected with:

- **Required pull request reviews** — even the repo owner can't bypass the pipeline
- **Required status checks** — the `verify` job from CI must be green before merge is allowed
- **Required branches up-to-date** — prevents merging a stale branch that accidentally reverts recent fixes
- **Blocked force pushes and deletions** — history is append-only
- **Signed commits** (recommended) — cryptographic proof of authorship on every change

Deployment to production triggers automatically on merge to `main`. There is no "deploy" button; merging a PR _is_ the deploy action. If a regression ships, `vercel promote <previous-deployment-url>` restores the previous build in under ten seconds, with no rebuild, no cache invalidation lag.

### Observability

Three layers of observability run in production:

- **Vercel Speed Insights** — real-user Core Web Vitals (LCP, INP, CLS), broken down by route and device class
- **Vercel Analytics** — privacy-respecting page-view and referrer analytics, no cookies required
- **Sentry** (via `@sentry/nextjs`) — client and server error capture with release tracking, source maps, and breadcrumb trails

A minimal `/api/health` route returns `{ ok: true, ts }` for external uptime checks (UptimeRobot, BetterStack). Structured logs — plain JSON to `console` — flow into Vercel's log drain for aggregation.

Crucially, **no secrets ever reach the logs**: every `catch` block uses the data layer's `ServiceError` format, which is explicitly designed to omit request tokens, Firebase credentials, and user PII. Error messages describe _what_ went wrong, not _with which secret_.

### Branch & Commit Hygiene

Code quality is enforced mechanically, not socially. Git hooks installed via `simple-git-hooks` run `lint-staged` on every commit:

- `*.{ts,tsx,js,mjs}` → `eslint --fix` + `prettier --write`
- `*.{json,md,css}` → `prettier --write`

This means: no commit can land with unfixable lint errors, mixed quote styles, or inconsistent Prettier formatting. The pre-commit hook fails the commit if any file can't be auto-fixed — the developer sees the error immediately, not after pushing and waiting for CI.

Formatting is never a code review topic. Reviewers focus on logic, architecture, and UX — the machine handles the rest.

### Dependency Hygiene

Dependencies are kept current by automation:

- **Dependabot** scans `npm` and GitHub Actions weekly, opens grouped PRs (Next.js + eslint-config-next together, Firebase + firebase-tools together, all React packages together)
- **Grouped updates** reduce PR noise from a flood of single-package bumps to one consolidated review per domain
- **CodeQL** (GitHub's free semantic analyzer) runs on every PR, catching common vulnerability patterns (prototype pollution, ReDoS, injection) before merge

Security advisories trigger higher-priority Dependabot PRs automatically. The pipeline ensures these can't be forgotten — a failing CodeQL check blocks merge the same way a failing build does.

### Scaling Readiness

The platform is architected for graceful handling of traffic spikes and dependency failures:

- **Vercel Fluid Compute** — default runtime, reuses function instances across concurrent requests, eliminates cold-start tax that classic serverless imposes
- **CDN-first delivery** — static assets, images (via `next/image`), and RSC payloads served from Vercel's edge network globally
- **Firestore offline persistence** — the client SDK caches reads in IndexedDB (enabled in `src/lib/firebase/config.ts`), so a Firebase outage degrades to stale-but-functional rather than broken
- **Mock mode fallback** — `isMockMode` flag triggers when Firebase env vars are missing, letting the UI render against stub data for screenshots, demos, and incident response
- **Per-user data scoping** — Firestore rules enforce `request.auth.uid == userId` on every read and write; no single user's spike affects another's experience

Cost alerts on the Firebase Blaze plan cap runaway expense. The `firestore.indexes.json` file pre-declares every composite index the app needs, so no query ever runs un-indexed (which would be slow _and_ billable at full-collection-scan rates).

### Rollback as a First-Class Operation

Rollback is not an emergency procedure — it's a first-class, one-command operation:

- **App rollback**: `vercel rollback` or `vercel promote <deployment-url>` — zero rebuild, instant
- **Rules rollback**: `git revert <commit>` + merge → the Firebase rules workflow redeploys the previous ruleset
- **Index rollback**: indexes are additive and idempotent — reverting a `firestore.indexes.json` change and redeploying removes the obsolete index (after a draining period)
- **Config rollback**: `vercel.ts` and `next.config.mjs` changes revert the same way — `git revert` + merge → CI → deploy

There is never a situation where "we'd have to rebuild from scratch to roll back." Every deploy is a tagged immutable artifact on Vercel's side, retrievable by URL indefinitely.

### Why This Matters

Most Firebase + Vercel projects end up with:

- Hand-clicked dashboard settings that no one remembers configuring
- `.env` files emailed between developers or dropped in Slack threads
- Firestore rules edited live in the console, with no audit trail
- Production deploys straight from a local machine, bypassing CI
- "Rollback" meaning "redeploy the last commit and hope it still builds"
- No visibility into which version is actually running, or why

IRONMIND demonstrates that the same discipline applied to the data layer and UI system extends naturally to the delivery pipeline: **configuration in code, secrets in environments, rules in git, deploys through CI, rollbacks as a primitive, and observability as a default**.

The platform is the documentation. A new contributor reads `vercel.ts`, `.github/workflows/*.yml`, `firebase.json`, and `DEVOPS_CONTROL_CENTER.md` — and they understand how the entire production environment is assembled, maintained, and recovered. No tribal knowledge. No "ask the person who set it up." The architecture is auditable at a glance, and every deploy is a boring, repeatable, one-command operation — exactly the state a production system should be in.
