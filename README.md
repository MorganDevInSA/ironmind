# IRONMIND — Elite Bodybuilding Performance System

A world-class bodybuilding training application for elite athletes who self-coach. Built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, and Firebase.

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

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand (UI) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Charts**: Recharts
- **Fonts**: Inter + Space Grotesk

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

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up Firebase environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deploy To Vercel

### One-time setup

1. Push this repo to GitHub.
2. Go to [Vercel](https://vercel.com/new) and import the GitHub repository.
3. In Vercel project settings, add the same Firebase env vars used in `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
4. Deploy. Vercel will run `npm install` and `npm run build` automatically.

### Optional CLI deploy

```bash
npm i -g vercel
vercel
vercel --prod
```

## PWA / Add To Home Screen

This project now includes:

- `public/manifest.json` for install metadata
- `public/sw.js` service worker for app-shell style offline caching
- `src/components/pwa/register-service-worker.tsx` auto registration in production

On mobile, open the deployed site in Chrome or Safari and use **Add to Home Screen**.

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

## Deploying Firebase Security Rules

Before going to production, deploy Firestore and Storage security rules:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (only needed once)
# Update .firebaserc with your project ID first
firebase use default

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage

# Deploy indexes (recommended)
firebase deploy --only firestore:indexes
```

**Local emulator testing:**

```bash
firebase emulators:start
# UI available at http://localhost:4000
# Firestore: localhost:8080
# Storage: localhost:9199
```

Update `.env.local` to point to emulators during development if needed.
