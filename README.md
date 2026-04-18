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

### Service / Controller / Cache Pattern

```
Pages -> Controllers -> TanStack Cache -> Services -> Firebase
```

- **Services** (`src/services/`): Plain TypeScript modules, single point of contact with Firebase
- **Controllers** (`src/controllers/`): TanStack Query hooks with cache-first data access
- **Cache Strategy**: Per-domain stale times, optimistic updates, composite hooks

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
