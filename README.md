# IRONMIND — Elite Bodybuilding Performance System

**IRONMIND** is a hypertrophy-first performance system for serious bodybuilders: a rotating program, KPI strength tracking, day-type nutrition, supplement timing, recovery signals, physique trends, volume versus MEV/MAV/MRV landmarks, and **one-click markdown export** so you (or your coach) can reason over full athlete state in an LLM thread.

Built with **Next.js 14** (App Router), **TypeScript** (strict), **Tailwind CSS**, **TanStack Query**, and **Firebase** (Auth, Firestore, Storage).

## Why it matters

Most gym apps optimize for generic logging or social loops. IRONMIND optimizes for **decision quality**: tying training load, nutrition, recovery, and supplements into one coherent model, then surfacing **computed alerts** (fatigue, spillover risk, adherence gaps) instead of leaving interpretation to memory and spreadsheets.

## Who it is for

- **Self-coached advanced athletes** who want contest-prep-grade structure without losing ownership of the plan.
- **Coaches and technical partners** who can generate or import structured seed data (JSON) and iterate with the athlete using exports and notes.
- **Builders** evaluating a reference implementation of a production-grade **Pages → Controllers → Services → Firebase** architecture on Vercel.

## Features

- **14-Day Rotating Training Program**: Custom program based on Morgan's real training split
- **KPI Tracking**: Track progress on DB Bench, Pull-ups, and Walking Lunge
- **Day-Type Aware Nutrition**: 4-tier macro targets (recovery through highest output)
- **Supplement Protocol**: 5-window daily checklist with full supplement stack
- **Recovery Monitoring**: Morning readiness with pelvic comfort tracking
- **Physique Tracking**: Bodyweight trends, measurements, progress photos
- **AI Agent Export**: One-click export of full athlete state for LLM analysis
- **Smart Alerts**: Shoulder spillover, fatigue flags, calorie emergency

## How IRONMIND differs (positioning)

| Typical fitness tracker        | IRONMIND                                                                        |
| ------------------------------ | ------------------------------------------------------------------------------- |
| Rep and set logging            | **Program + KPIs + volume landmarks** per muscle group                          |
| Static calorie targets         | **Day-type-aware macros** aligned to training demand                            |
| Disconnected “stacks” in notes | **Timed supplement protocol** with daily windows                                |
| No export story                | **Full markdown athlete report** for continuity in external AI coaching threads |
| UI talks straight to APIs      | **Hard-layered data flow** (enforced boundaries, documented cache strategy)     |

This is not a mass-market “step counter.” It is a **precision instrument** for people who already speak the language of phases, weak points, and recoverable volume.

## Visuals

Screenshots and marketing renders live outside this README for now. For brand treatment and raster paths, see [Documentation/LOGO-BRIEF.md](./Documentation/LOGO-BRIEF.md) and `public/brand/`.

## Business and platform value

- **Operational leverage**: One athlete, one source of truth—training, nutrition, recovery, physique, and supplements—reduces back-and-forth and “lost context” versus chat plus spreadsheets.
- **Scale-ready engineering**: Multi-tenant-safe data model (`users/{uid}/…`), typed domain layer, CI gates, and documented delivery patterns suitable for agencies or product teams forking the codebase.
- **License**: **MIT** — suitable for portfolio use, internal deployment, or as the core of a commercial offering you host and brand.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v3
- **State Management**: Zustand (UI) + TanStack Query v5 (server state)
- **Forms**: React Hook Form + Zod
- **Backend**: Firebase 12 (Auth, Firestore, Storage)
- **Charts**: Recharts
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Rajdhani (UI) + JetBrains Mono (data)

## Architecture

IRONMIND implements production-grade patterns across its data and UI layers, demonstrating enterprise-level architectural discipline typically found in funded startups with dedicated engineering teams.

### Three-Layer Data Architecture

```
Pages -> Controllers -> TanStack Cache -> Services -> Firebase
```

- **Services** (`src/services/`): Domain logic + Firebase operations, fully testable in isolation
- **Controllers** (`src/controllers/`): TanStack Query hooks with cache-first data access
- **Hard boundaries**: Pages never import services directly, enforced by automated audits

**→ [Read the full Data Layer Architecture documentation](./README_DATA_LAYER.md)**

Covers: cache invalidation strategy, optimistic updates, structured error handling, query key design, Firebase abstraction layer, and why this matters for scalability.

### Design-Engineered UI System

- **60+ CSS design tokens** enabling runtime theme switching without component changes
- **Interactive panel states** with asymmetric hover transitions (200ms border, 300ms glow)
- **iOS-style spinners** derived from `var(--accent)` via `color-mix()`
- **Knight Rider LED indicators** with staggered 60ms pulse animations
- **Accordion animations** using CSS `grid-template-rows` (no JavaScript measurement)

**→ [Read the full UI/UX Architecture documentation](./README_UIUX.md)**

Covers: design token system, responsive architecture, motion design, accessibility implementation, and component composition strategy.

### CI/CD & Platform Infrastructure

- **Typed configuration** via `vercel.ts`, `firebase.json`, `.github/workflows/`
- **Three-environment separation**: local (emulators) → preview (per PR) → production (main)
- **MCP integration**: Vercel + Firebase + Context7 in `.cursor/mcp.json` for agent-driven infra ops
- **Automated delivery**: GitHub Actions CI (lint + typecheck + build), Dependabot, pre-commit hooks
- **One-command publish**: `npm run publish` — local verification → push → auto-deploy

**→ [Read the full CI/CD & Platform documentation](./README_CICD.md)**

Covers: environment model, MCP tooling, typed platform config, delivery pipeline, secrets hygiene, rollback procedures, observability, and scaling readiness.

## Quickstart

```bash
# 1. Clone and install
git clone git@github.com:MorganDevInSA/ironmind.git
cd ironmind
npm ci

# 2. Set up environment (choose one)
cp .env.example .env.local      # then fill in Firebase values
# OR (if Vercel CLI is installed and linked):
vercel env pull .env.local

# 3. Start dev server
npm run dev

# 4. Open http://localhost:3000
```

On first login, the app auto-seeds with demo data. See "Seed Data" section below for details.

## Deploy & Publish

IRONMIND uses GitHub-triggered Vercel deployments with local verification before push. The entire flow is automated.

### Chat shortcut (recommended)

In Cursor chat, simply type:

```
Complete CI/CD run
```

A hook automatically triggers the full sequence: CI verification → commit if needed → push → deploy → report URL. Zero terminal commands needed.

### One-command publish (terminal alternative)

```bash
npm run publish
```

This command:

1. Verifies git is clean (commits or stash first)
2. Runs `npm run ci` locally (lint → typecheck → build) — aborts on failure
3. Pushes current branch to GitHub
4. Prints the live URL (production if on `main`, preview URL otherwise)

Vercel auto-deploys within ~60 seconds. No manual CLI deploy needed — the GitHub push triggers it.

### CI Pipeline

Every push to `main` and every pull request triggers `.github/workflows/ci.yml`:

- Install (Node 22, npm ci with cache)
- Lint (ESLint with `--max-warnings=0`)
- Typecheck (`tsc --noEmit`)
- Build (`next build` with Firebase env vars from GitHub Secrets)

Pre-commit hooks (via `simple-git-hooks` + `lint-staged`) auto-fix lint + prettier on staged files before commit.

### Rollback

```bash
vercel rollback                          # rollback to previous production deployment
vercel promote <deployment-url>          # promote a specific preview to production
```

### Firebase Rules & Indexes

Committed in `firestore.rules`, `firestore.indexes.json`, `storage.rules` at repo root. CI workflow (`.github/workflows/firebase-rules.yml`, pending setup) auto-deploys on push to `main` when these files change.

Manual deploy (trusted machine only):

```bash
npm run deploy:rules      # firestore + storage rules
npm run deploy:indexes    # firestore indexes
```

## Seed Data

On first login, the app automatically seeds Firestore with Morgan's real data:

- Athlete profile (age, goals, injury constraints)
- 14-day rotating program with all exercises
- Supplement protocol with 5 timing windows
- Volume landmarks (MV/MEV/MAV/MRV)
- Initial coaching notes

## Project Structure

```
src/
  app/              # Next.js App Router pages
  components/       # React components
  controllers/      # TanStack Query hooks
  lib/              # Utilities, types, constants
  services/         # Firebase service layer
  stores/           # Zustand stores
  styles/           # Global styles
```

## Roadmap and deeper docs

There is no single public roadmap file; direction is captured in dated implementation and principal reviews under [Documentation/README.md](./Documentation/README.md) (for example architecture, data-layer hardening, and demo data guides). Start with [Documentation/ARCHITECTURE.md](./Documentation/ARCHITECTURE.md) for canonical product intent and stack authority.

**GTM / sales long-form:** [Technical](./Documentation/SALES-TECHNICAL.md) · [User value](./Documentation/SALES-USER-VALUE.md) · [Corporate](./Documentation/SALES-CORPORATE-VALUE.md)

## Contributing and contact

Issues and PRs are welcome for bug fixes and clearly scoped improvements. Before larger changes, read [Documentation/ARCHITECTURE.md](./Documentation/ARCHITECTURE.md) and the root `README_*` pillars so proposals match enforced layering and quality gates. For repository access, use the clone URL in [Quickstart](#quickstart) below.

## License

MIT

---

## Local Development Tools

### Firebase Emulators

Test Firestore/Storage rules and operations locally without touching production:

```bash
npm run emulators
# UI: http://localhost:4000
# Firestore: localhost:8080
# Storage: localhost:9199
```

### Full CI Chain Locally

Before pushing, verify the full pipeline passes:

```bash
npm run ci        # lint + typecheck + build (what CI runs)
```

### Code Quality Scripts

```bash
npm run lint          # ESLint (--max-warnings=0)
npm run typecheck     # TypeScript (tsc --noEmit)
npm run format        # Check Prettier formatting
npm run format:fix    # Auto-fix Prettier formatting
```
