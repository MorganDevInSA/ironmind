---
name: ironmind-cicd
description: Correct CI/CD, deployment, environment, and MCP tooling patterns for IRONMIND. Use when configuring Vercel, Firebase CLI operations, GitHub Actions workflows, environment variables, npm scripts, git hooks, rollback procedures, or any infrastructure/platform change. Prevents manual dashboard drift, env leakage, broken deploys, and rules desync.
---

# IRONMIND CI/CD & Platform Patterns

The platform layer obeys the same discipline as the app layer: **configuration in code, secrets in environments, rules in git, deploys through CI, rollbacks as a primitive**.

## Canonical References

Before touching infra, read:

| File                                                                                             | Purpose                                                                                                             |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **`.cursor/plans/DEVOPS_CONTROL_CENTER.md`**                                                     | Live task list with exact commands — source of truth for what's done, what's pending, and how to trigger any action |
| **`README_CICD.md`** (repo root)                                                                 | Narrative explanation of the pipeline architecture — "why" behind each choice                                       |
| **`.cursor/mcp.json`**                                                                           | MCP server config (Vercel / Firebase / Context7) — committed, not local                                             |
| **`firebase.json`** · **`firestore.rules`** · **`firestore.indexes.json`** · **`storage.rules`** | Firebase source of truth — edited here, deployed by CI                                                              |
| **`.firebaserc`**                                                                                | Firebase project ID (`ironmindmp`) — must not be `YOUR_PROJECT_ID_HERE`                                             |

---

## Environment Model

Three environments, strictly separated:

```
Local (dev)              →   Preview (per PR)         →   Production (main branch)
npm run dev                  vercel deploy                vercel deploy --prod
Firebase emulators           Vercel preview URL           ironmind.vercel.app
.env.local                   .env (preview)               .env (production)
```

**Rules:**

- Never commit `.env*` files — `.gitignore` line 34 (`.env*`) covers all variants
- Never edit env vars in the Vercel dashboard as a "quick fix" — go through `vercel env add`
- Never hand-edit Firestore rules in the Firebase console — edit `firestore.rules` and let CI deploy
- `.env.vercel` is pulled via `vercel env pull .env.vercel` — never edit, never commit

---

## CLI Inventory (must be installed)

| CLI          | Version minimum   | How to install                   |
| ------------ | ----------------- | -------------------------------- |
| Node.js      | 22 (per `.nvmrc`) | nvm / system package manager     |
| npm          | ships with Node   | —                                |
| Vercel CLI   | 52+               | `npm i -g vercel@latest`         |
| Firebase CLI | 15+               | `npm i -g firebase-tools@latest` |

**User-owned npm prefix is mandatory.** System `npm i -g` may fail on `EACCES` if prefix is `/usr/local`. The fix lives in `~/.npmrc`:

```
prefix=/home/morgan/.npm-global
```

and `~/.bashrc` / `~/.profile` must export `PATH="$HOME/.npm-global/bin:$PATH"`.

---

## Vercel CLI Patterns

### First-time link

```bash
vercel link --yes --project ironmind     # links .vercel/ to morgans-projects-bc4d5795/ironmind
vercel env pull .env.vercel              # pulls dev env for local diffing
```

### Everyday commands

```bash
vercel                      # deploy current branch to a preview URL
vercel --prod               # promote current state to production (normally CI-triggered)
vercel logs <deployment>    # runtime logs for a specific deployment
vercel env add KEY ENV      # add a new env var (ENV = development | preview | production)
vercel env pull .env.local  # sync remote env vars to local
vercel rollback             # rollback to previous production deployment
vercel promote <url>        # promote a specific preview URL to production (zero rebuild)
```

### Rules

- **`.vercel/` is git-ignored** (line 37 of `.gitignore`). Never commit it.
- **Prefer `vercel.ts` over `vercel.json`.** Typed platform config, reviewable in PR, composable with TS helpers.
- Every new env var must be added to all three environments (`development`, `preview`, `production`) unless there's a documented reason not to.

---

## Firebase CLI Patterns

### First-time auth

```bash
firebase login               # OAuth in browser (interactive — user must do this)
firebase use ironmindmp      # select active project
firebase projects:list       # verify
```

### Rules & index deploy

Never deploy the full project — always scope:

```bash
firebase deploy --only firestore:rules --project ironmindmp
firebase deploy --only firestore:indexes --project ironmindmp
firebase deploy --only storage:rules --project ironmindmp
firebase deploy --only firestore:rules,firestore:indexes,storage:rules --project ironmindmp
```

**`--non-interactive`** is required inside CI. CI uses a service account JSON with `Firebase Rules Admin` + `Cloud Datastore Index Admin` roles — nothing broader.

### Emulators (local development)

```bash
npm run emulators           # wraps: firebase emulators:start
# Ports:  firestore 8080 · storage 9199 · UI http://localhost:4000
```

Point the app at emulators only when testing rules / destructive operations — don't mix emulator data with real auth sessions.

### Reading / writing prod data

- Queries against production Firestore should go through the **Firebase MCP**, not ad-hoc CLI.
- Never `firestore:delete` anything in production without an explicit backup step.

---

## MCP Integration

`.cursor/mcp.json` configures three MCP servers. All are committed so every collaborator inherits them:

```json
{
  "mcpServers": {
    "vercel": { "url": "https://mcp.vercel.com" },
    "firebase": { "command": "npx", "args": ["-y", "firebase-tools@latest", "mcp"] },
    "context7": { "command": "npx", "args": ["-y", "@upstash/context7-mcp"] }
  }
}
```

**When to use which:**

| Need                                                                  | MCP              |
| --------------------------------------------------------------------- | ---------------- |
| Inspect a failed Vercel build, fetch runtime logs, list deployments   | **Vercel MCP**   |
| Query Firestore, check rules, list Auth users, review Storage         | **Firebase MCP** |
| Fetch current API docs for Next.js / Firebase / React Query / any dep | **Context7 MCP** |

**Activation:** after editing `.cursor/mcp.json`, reload MCP in Cursor (Settings → MCP → reload). Vercel prompts OAuth once. Firebase reads your `firebase login` state from the local CLI — if `firebase login:list` shows zero accounts, the MCP will fail with "no project context" until you log in.

**Never** paste secrets into an MCP prompt — the MCP has API access already. Treat MCPs as an authenticated tool, not a text channel.

---

## npm Script Contract

`package.json` scripts are the **only** entry points CI and developers should use. Never document a raw `npx ...` command outside these scripts.

| Script           | Runs                                                                        | When                      |
| ---------------- | --------------------------------------------------------------------------- | ------------------------- |
| `dev`            | `next dev`                                                                  | local development         |
| `build`          | `next build`                                                                | CI + prod                 |
| `start`          | `next start`                                                                | rarely — Vercel runs this |
| `lint`           | `eslint . --max-warnings=0`                                                 | CI + pre-commit           |
| `typecheck`      | `tsc --noEmit`                                                              | CI + local verification   |
| `format`         | `prettier --check .`                                                        | CI                        |
| `format:fix`     | `prettier --write .`                                                        | local cleanup             |
| `ci`             | `npm run lint && npm run typecheck && npm run build`                        | matches CI locally        |
| `emulators`      | `firebase emulators:start`                                                  | local Firebase testing    |
| `deploy:rules`   | `firebase deploy --only firestore:rules,storage:rules --project ironmindmp` | rules push (normally CI)  |
| `deploy:indexes` | `firebase deploy --only firestore:indexes --project ironmindmp`             | index push (normally CI)  |

Before marking any substantive work complete, run `npm run ci` locally — this mirrors the GitHub Actions `verify` job exactly.

---

## GitHub Actions Layout

Two workflows live in `.github/workflows/`:

### `ci.yml` — runs on every PR and push to main

Stages: `install` → `lint` → `typecheck` → `build`. Cancels superseded runs via `concurrency: ci-${{ github.ref }}`. Uses `actions/setup-node@v4` with `cache: npm` for deterministic, fast installs.

**Env vars injected at build step** from GitHub secrets (mirrors of Vercel production):

- `NEXT_PUBLIC_FIREBASE_*` (6 keys)
- `NEXT_PUBLIC_ENABLE_PHOTO_UPLOAD`

### `firebase-rules.yml` — runs on push to main when rules/indexes files change

Path-filtered: only triggers on edits to `firestore.rules`, `firestore.indexes.json`, `storage.rules`, or `firebase.json`. Uses a service account JSON from `FIREBASE_SERVICE_ACCOUNT` secret (scoped to Rules Admin + Index Admin).

**Never** add a workflow that deploys the app to Vercel — Vercel's GitHub App handles that automatically when `main` advances.

---

## Git Hook Contract

`simple-git-hooks` runs `lint-staged` on every commit. Config lives in `package.json`:

```json
{
  "simple-git-hooks": {
    "pre-commit": "npx lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx,js,mjs}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

Install once per checkout: `npx simple-git-hooks`. Never skip hooks with `git commit --no-verify` to bypass lint — fix the lint instead.

---

## Secrets Hygiene

**Three locations, one source of truth per environment:**

| Value lives in                                    | Authoritative?                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `.env.local` (local dev)                          | No — pulled from Vercel (`vercel env pull`) or hand-filled from `.env.example` |
| Vercel Project → Settings → Environment Variables | **Yes, per env**                                                               |
| GitHub Secrets (repo)                             | No — mirror of Vercel production, used only at CI build step                   |

**Verification:**

```bash
git ls-files | grep -E '\.env'    # must output nothing
git check-ignore -v .env.local     # must confirm .gitignore:34
git check-ignore -v .vercel        # must confirm .gitignore:37
```

**`NEXT_PUBLIC_*` contract:** anything with this prefix is bundled into the browser JavaScript. Never prefix a server-only secret this way. Firebase web API keys are `NEXT_PUBLIC_*` by design — they're scoped by auth domain, not a rotation concern.

---

## Rollback Procedures

Rollback is a first-class operation — never an emergency scramble.

| Scenario             | Command                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Bad app deploy       | `vercel promote <previous-deployment-url>` (instant, zero rebuild)                        |
| Bad Firestore rules  | `git revert <commit>` → merge → `firebase-rules.yml` re-deploys                           |
| Bad platform config  | `git revert <commit>` → merge → Vercel redeploys                                          |
| Bad index            | Add replacement index to `firestore.indexes.json`, remove offender, merge (indexes drain) |
| Firebase auth outage | `isMockMode` flag in `src/lib/firebase/config.ts` degrades UI gracefully                  |

Never delete a Vercel deployment — they're immutable tagged artifacts, retained for fast rollback.

---

## Observability Hooks

| Layer                     | Tool                      | Entry point                                  |
| ------------------------- | ------------------------- | -------------------------------------------- |
| Real-user Core Web Vitals | Vercel Speed Insights     | `<SpeedInsights />` in `src/app/layout.tsx`  |
| Page analytics            | Vercel Analytics          | `<Analytics />` in `src/app/layout.tsx`      |
| Error capture             | Sentry (when installed)   | `npx @sentry/wizard@latest -i nextjs`        |
| Uptime                    | UptimeRobot / BetterStack | `GET /api/health` returns `{ ok: true, ts }` |

**Log hygiene rule:** every `catch` block in services uses the `ServiceError` format from the data-layer skill. `ServiceError` explicitly **omits** request tokens, Firebase credentials, user PII. Never `console.log(error)` raw in production paths — always wrap.

---

## Scaling Defaults

- **Vercel Fluid Compute** — on by default, reuses function instances across concurrent requests
- **Firestore offline persistence** — enabled in `src/lib/firebase/config.ts` (IndexedDB)
- **Image delivery** — `next/image` with `firebasestorage.googleapis.com` whitelisted in `next.config.mjs`
- **Cost alerts** — Firebase Blaze plan with budget alert at $10/mo baseline (raise as users grow)
- **Indexes** — every composite query needs a pre-declared index in `firestore.indexes.json`

---

## Decision Framework

Before touching infra, answer:

1. **Is this change auditable?** — If it's a dashboard click, find the file equivalent (`vercel.ts`, `firebase.json`, etc.) and commit there instead.
2. **Does this affect all three environments?** — If so, change all three (`development`, `preview`, `production`), don't just hot-patch prod.
3. **Can CI do this instead of me?** — If yes, add a workflow or script; don't run it locally.
4. **Does this leak a secret?** — Check the file/log/URL path for anything that could contain a token or service-account JSON.
5. **Is there a rollback path?** — If the change is irreversible (e.g. deleting an index), document it in the PR description.
6. **Does DEVOPS_CONTROL_CENTER.md have an entry?** — If this is a planned task, tick it. If it's a new insight, add it.

---

## Common Pitfalls

| Mistake                                                         | Fix                                                                                                                   |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `firebase deploy` fails with "no project active"                | Run `firebase use ironmindmp`                                                                                         |
| `firebase deploy` targets wrong project                         | Check `.firebaserc` — must be `ironmindmp`, never `YOUR_PROJECT_ID_HERE`                                              |
| `npm i -g` fails with `EACCES` on `/usr/local/lib/node_modules` | Set user-owned prefix in `~/.npmrc` and restart shell                                                                 |
| Vercel build succeeds locally but fails in CI                   | Check `NEXT_PUBLIC_*` env vars are set in GitHub Secrets                                                              |
| MCP shows zero tools after reload                               | Vercel: sign in via OAuth; Firebase: run `firebase login` in terminal                                                 |
| `.env.local` committed accidentally                             | It's in `.gitignore:34` — verify with `git check-ignore`; if leaked, rotate any affected values and `git filter-repo` |
| Rules work locally, broken in prod                              | Rules workflow didn't run — check `.github/workflows/firebase-rules.yml` trigger paths                                |
| Duplicate Vercel projects (`ironmind`, `ironmind-lxmy`, etc.)   | `vercel projects rm <name> --yes` for each stray                                                                      |

---

## When to Use This Skill vs Others

| Situation                                                                       | Skill                                          |
| ------------------------------------------------------------------------------- | ---------------------------------------------- |
| Writing a Firestore service                                                     | `ironmind-firebase-patterns`                   |
| Building a controller / mutation                                                | `ironmind-data-layer`                          |
| Deploying rules, configuring Vercel, editing CI, MCP issues, env vars, rollback | **`ironmind-cicd`** (this file)                |
| Styling, tokens, components                                                     | `ironmind-styling` / `ironmind-visual-persona` |
| TS errors, type patterns                                                        | `ironmind-typescript-patterns`                 |

Never duplicate data-layer or styling guidance here — this skill owns **platform and delivery**, nothing else.
