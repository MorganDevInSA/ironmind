# IRONMIND — Elite Bodybuilding Performance System

A world-class bodybuilding training application for elite athletes who self-coach. Built with Next.js 14, TypeScript, Tailwind CSS, and Firebase.

## Features

- **14-Day Rotating Training Program**: Custom program based on Morgan's real training split
- **KPI Tracking**: Track progress on DB Bench, Pull-ups, and Walking Lunge
- **Day-Type Aware Nutrition**: 4-tier macro targets (recovery through highest output)
- **Supplement Protocol**: 5-window daily checklist with full supplement stack
- **Recovery Monitoring**: Morning readiness with pelvic comfort tracking
- **Physique Tracking**: Bodyweight trends, measurements, progress photos
- **AI Agent Export**: One-click export of full athlete state for LLM analysis
- **Smart Alerts**: Shoulder spillover, fatigue flags, calorie emergency

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

### One-command publish (production or preview)

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
