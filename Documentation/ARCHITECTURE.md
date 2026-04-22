# IRONMIND — Architecture Reference

This document is the **canonical technical overview** for implementing and extending IRONMIND: product intent, runtime stack, folder layout, data flow, Firebase model, caching, UX rules, and **every local skill / rule / doc** agents and developers must follow.

**Audience:** architects, contributors, and AI coding agents operating in Cursor.

---

## 1. Product summary

**IRONMIND** is an elite bodybuilding performance application: rotating training programs, KPI tracking, day-type-aware nutrition, supplement protocols, recovery and physique logging, volume-vs-landmarks analytics, computed **smart alerts**, and a **markdown export** of full athlete state for LLM analysis. Coaching notes are retained as journal data but entered from the **Export** workflow rather than a standalone Coaching page.

The app is built for **multiple independent athletes** (each Firebase Auth user sees only their own data under `users/{uid}/…`). The codebase uses Firebase-backed persistence and a strict **layered architecture** so UI never talks to Firebase directly.

---

## 2. Runtime stack (authoritative)

Versions below are taken from `package.json` at repo root. If `README.md` disagrees (e.g. Next or Tailwind major), **trust `package.json`**.

| Layer | Technology |
|--------|------------|
| Framework | **Next.js 14** (App Router), React 18 |
| Language | **TypeScript** (strict) |
| Styling | **Tailwind CSS 3.x**, global tokens in `src/app/globals.css` |
| Server / cache | **TanStack Query v5** (`@tanstack/react-query`) |
| Client UI state | **Zustand** |
| Backend | **Firebase** — Auth, Firestore, Storage (`firebase` SDK 12.x) |
| Forms | React Hook Form + **Zod** |
| Charts | **Recharts** |
| Motion | **Framer Motion** |
| Icons | **Lucide React** |
| Toasts | **Sonner** |
| Date | **date-fns** |

**Next.js note:** `AGENTS.md` points agents at `node_modules/next/dist/docs/` because this project’s Next may differ from training cutoffs — read project-local docs before assuming APIs.

---

## 3. Repository layout (high level)

```
ironmind/
├── .cursor/
│   ├── rules/IRONMIND.md          # Enforced agent rules (always applied)
│   ├── skills/                    # Cursor skills (see §15)
│   └── personas/SENIOR-ARCHITECT.md
├── Documentation/
│   ├── README.md                  # Index of docs in this folder
│   ├── ARCHITECTURE.md            # This file
│   ├── STYLE-GUIDE.md             # Current visual implementation guide
│   ├── LOGO-BRIEF.md              # Logo prompts + `public/brand/` asset map
│   └── Data/                      # Archived snippets (see Data/README.md)
├── public/
│   ├── brand/                     # Raster logos — URLs via `brandAssets` (see §13.6)
│   ├── manifest.json
│   └── …
├── src/
│   ├── app/                       # Next.js App Router (pages, layouts, globals)
│   ├── components/                # Shared UI (layout, auth, providers)
│   ├── controllers/               # use*.ts — TanStack Query hooks only
│   ├── services/                  # *.service.ts — domain + Firestore access
│   ├── lib/
│   │   ├── firebase/              # SDK init, converters, helpers
│   │   ├── types/                 # Domain TypeScript models
│   │   ├── constants/             # query keys, stale times, brand assets, domain constants
│   │   ├── seed/                  # Initial data + seedUserData()
│   │   ├── export/                # Markdown summary generation
│   │   └── utils/                 # dates, formatting, cn(), cycle math, etc.
│   └── stores/                    # Zustand (auth, UI)
├── tailwind.config.js
├── package.json
└── README.md
```

---

## 4. Layered architecture (non-negotiable)

This is the **core contract** of the codebase. It is repeated in `.cursor/rules/IRONMIND.md` and `.cursor/skills/ironmind-data-layer/SKILL.md`.

```mermaid
flowchart LR
  subgraph ui [UI]
    P[Pages / Components]
  end
  subgraph cache [Cache]
    C[Controllers use-*.ts]
  end
  subgraph domain [Domain]
    S[services *.service.ts]
  end
  subgraph infra [Infrastructure]
    F[lib/firebase]
  end
  P --> C
  C --> S
  S --> F
```

| Layer | Location | Responsibility |
|-------|-----------|----------------|
| **Pages / components** | `src/app/**`, `src/components/**` | Rendering, UX, wiring **controller hooks** only |
| **Controllers** | `src/controllers/use-*.ts` | `useQuery` / `useMutation`, cache keys, invalidation, `enabled: !!userId` |
| **Services** | `src/services/*.service.ts` | Domain operations; call **`@/lib/firebase`** helpers only |
| **Firebase helpers** | `src/lib/firebase/*` | Converters, `getDocument`, `queryDocuments`, `collections` paths |

**Violations to avoid**

- No `import` from `@/services/*` or `@/lib/firebase/*` inside route `page.tsx` / leaf components except where the project already uses an exception (prefer fixing toward the rule).
- Services must not embed React or TanStack Query.
- **All date fields crossing the Firestore boundary are ISO `string`s** after read (converter turns `Timestamp` → ISO string).

**Export pipeline:** `src/lib/export/generate-summary.ts` aggregates by calling **services** (not controllers), suitable for reuse from server-like entry points or hooks that trigger async export.

**Import pipeline:** `src/services/import.service.ts` parses onboarding JSON packs and writes via services; onboarding UI lives under `src/app/(onboarding)/`. This module is **not** re-exported from `src/services/index.ts` but is a first-class domain entry point.

---

## 5. Next.js App Router structure

### 5.1 Root

- `src/app/layout.tsx` — Root layout: `globals.css`, `QueryProvider`, Sonner `Toaster`, `dark` class on `<html>`.
- `src/app/page.tsx` — Redirects `/` → `/dashboard`.

### 5.2 Route groups

| Group | Purpose |
|-------|---------|
| `(auth)` | Login / register — unauthenticated flows |
| `(onboarding)` | JSON upload / seed path for new users |
| `(app)` | Authenticated shell: sidebar, top bar, mobile nav, `AuthGuard` |

### 5.3 Authenticated shell (`src/app/(app)/layout.tsx`)

- **`AuthGuard`** — Subscribes to Firebase auth; unauthenticated users sent to `/login`; unseeded users redirected to `/onboarding` (with offline/graceful handling).
- **Layout** — Desktop `Sidebar`, `TopBar`, optional-collapsed sidebar margin via `useUIStore`, `MobileNav` fixed bottom on small screens.

### 5.4 Page inventory (implemented routes)

Paths below map to `page.tsx` files — **any new `Link` must target one of these** (see IRONMIND routing rule):

| Route | Feature area |
|-------|----------------|
| `/dashboard` | Day overview, schedule widgets |
| `/training`, `/training/programs`, `/training/exercises`, `/training/history`, `/training/workout` | Program + session execution |
| `/nutrition` | Day-type macros, meals |
| `/supplements` | Protocol + daily log |
| `/recovery` | Readiness scoring and trends |
| `/physique` | Weight, measurements, photos |
| `/settings` | Profile / app settings |
| `/export` | LLM-oriented markdown export |
| `/more` | Mobile “more” hub |
| `/onboarding` | Coach JSON import + seed |
| `/login`, `/register` | Auth |

---

## 6. Client state vs server state

### 6.1 Zustand (`src/stores/`)

- **`auth-store`** — Current Firebase user snapshot, `isAuthenticated`, persisted slice for user identity.
- **`ui-store`** — Shell UX + theme preferences (`crimson`, `hot-pink`, `custom` with `customAccent`), persisted in local storage; not Firestore server data.

Use Zustand for **transient UI and auth identity**, not for Firestore document mirrors (those belong in TanStack Query).

### 6.2 TanStack Query (`src/controllers/` + `QueryProvider`)

- **`QueryProvider`** (`src/components/providers/query-provider.tsx`) sets default `gcTime`, merges **`refetchConfig`** from `src/lib/constants/stale-times.ts` (no window-focus refetch by default).
- Each domain exposes hooks such as `useTraining`, `useNutrition`, etc., exported from `src/controllers/index.ts`.

### 6.3 Query keys and staleness

- **Keys:** `src/lib/constants/query-keys.ts` — **`queryKeys(userId)`** factory so every TanStack Query key is **user-scoped** (no cache bleed between accounts). Extend the factory when adding features; never use a global static key array for user data.
- **Stale times:** `src/lib/constants/stale-times.ts` — per-entity tuning (e.g. profile `Infinity`, workouts minutes-level).

---

## 7. Firebase model

### 7.1 Initialization (`src/lib/firebase/config.ts`)

- Reads **`NEXT_PUBLIC_FIREBASE_*`** env vars; if missing, app runs with **no Firebase** (`db`/`auth`/`storage` null) — guards must handle this in dev.
- **IndexedDB persistence** enabled in browser where supported.

### 7.2 Collections helper

All paths go through **`collections`** — never hand-roll `'users/...'` strings (enforced by rules):

| Helper | Path pattern |
|--------|----------------|
| `collections.users` | `users` |
| `collections.profiles(uid)` | `users/{uid}/profile` (document `data`) |
| `collections.programs(uid)` | `users/{uid}/programs` |
| `collections.workouts(uid)` | `users/{uid}/workouts` |
| `collections.nutritionDays(uid)` | `users/{uid}/nutrition` |
| `collections.supplementLogs(uid)` | `users/{uid}/supplements` |
| `collections.supplementProtocol(uid)` | `users/{uid}/protocol` |
| `collections.recoveryEntries(uid)` | `users/{uid}/recovery` |
| `collections.checkIns(uid)` | `users/{uid}/checkins` |
| `collections.phases(uid)` | `users/{uid}/phases` |
| `collections.journalEntries(uid)` | `users/{uid}/journal` |
| `collections.volumeLandmarks(uid)` | `users/{uid}/landmarks` |

### 7.3 Firestore helpers (`src/lib/firebase/firestore.ts`)

- **`createConverter<T>()`** — Serializes dates to Timestamp on write; reads Timestamps as **ISO strings**.
- Correct **function names:** `getDocument`, `getAllDocuments`, `queryDocuments` — **not** ambiguous names like `getDocuments` (see IRONMIND rules).
- Query constraint arrays typed as **`QueryConstraint[]`** from `firebase/firestore`.

### 7.4 Storage & auth

- **`src/lib/firebase/storage.ts`** — Upload helpers for physique photos etc. (optional feature flags in app code when Storage is unavailable).
- **`src/lib/firebase/auth.ts`** — Email/password + **OAuth** (`signInWithPopup`): Google; Facebook and Microsoft helpers exist and may be hidden in UI until provider console setup is complete.

---

## 8. Domain modules (services ↔ controllers ↔ UI)

Exported services (`src/services/index.ts`): profile, training, nutrition, recovery, physique, supplements, coaching, volume, alerts, storage.

| Domain | Service | Representative controller hooks | Primary UI |
|--------|---------|---------------------------------|------------|
| Profile | `profile.service.ts` | `use-profile` | Settings, dashboard header |
| Training | `training.service.ts` | `use-training` | Training pages, workout |
| Nutrition | `nutrition.service.ts` | `use-nutrition` | Nutrition |
| Recovery | `recovery.service.ts` | `use-recovery` | Recovery |
| Physique | `physique.service.ts` | `use-physique` | Physique |
| Supplements | `supplements.service.ts` | `use-supplements` | Supplements |
| Coaching | `coaching.service.ts` | `use-coaching` | Export note composer (journal-backed); no dedicated `/coaching` route |
| Volume | `volume.service.ts` | `use-volume`, `use-dashboard` | Dashboard charts, landmarks |
| Alerts | `alerts.service.ts` | `use-alerts` | Dashboard / notifications |
| Export | (summary in `lib/export`) | `use-export` | Export page |

---

## 9. Types (`src/lib/types/index.ts`)

Single umbrella module for domain entities: `AthleteProfile`, `Program`, `Workout`, `NutritionDay`, `SmartAlert`, etc.

**SmartAlert.type** allowed values are fixed in types — must stay in sync with `alerts.service.ts` (see IRONMIND rule).

---

## 10. Seed data and onboarding

### 10.1 Automatic seed (`src/lib/seed/index.ts`)

`seedUserData(userId)` runs once when the user has no seed flag:

1. Profile (`mortonProfile`)
2. Program + active program (`mortonProgram`)
3. Supplement protocol
4. Phase + active phase
5. Volume landmarks
6. Nutrition placeholder for **today** via `saveNutritionDay`
7. Initial journal notes (used by export when coaching notes are included)
8. **`markUserSeeded`**

**Rule:** Any new `src/lib/seed/*.ts` file must be imported into `seed/index.ts`, invoked inside `seedUserData()`, and log **`✓`** lines on success (IRONMIND.md).

### 10.2 Coach JSON import (`import.service.ts` + onboarding UI)

Structured JSON files (e.g. `athlete_profile.json`, `training_program.json`, …) are validated, merged into `ParsedCoachData`, then persisted through the same services as seed data.

Current onboarding flow is **6 steps**:

1. Overview
2. Theme selection (`crimson`, `hot-pink`, `custom`)
3. Coach prompt
4. Questionnaire
5. Data generation + analysis guidance
6. Import

---

## 11. Alerts architecture (`src/services/alerts.service.ts`)

`getActiveAlerts(userId)` aggregates rule checks (shoulder spillover, day-13 fatigue, calorie emergency, progression, recovery, supplement compliance, etc.).

**Invariant:** Every `check*` function must be referenced from `getActiveAlerts()` — no orphaned checks (IRONMIND.md).

---

## 12. Export architecture (`src/lib/export/`)

`generateSummary(userId, ExportOptions)` pulls parallel data via services and emits a single **markdown** report for external LLM consumption. Options select sections (profile, program, workouts, nutrition, …) and history depth.

`/export` also contains a **persisted note composer** that writes journal entries via `useCreateJournalEntry`; these entries are included in output when `includeCoachingNotes` is enabled.

---

## 13. UI system (tokens, layout, accessibility of rules)

### 13.1 Canonical sources (priority order)

1. **CSS variables** in `src/app/globals.css`
2. **Tailwind theme** in `tailwind.config.js` (`bg-bg-2`, `text-text-0`, `crimson`, etc.)
3. Raw bracket colors **only** when no token exists

### 13.2 Agent rules affecting UI

From `.cursor/rules/IRONMIND.md`:

- **Numeric data** uses `font-mono tabular-nums`
- **Crimson accent** is scarce — CTAs, active nav, PRs, key badges (not body copy)
- **Glass panels** — `.glass-panel` / `.glass-panel-strong` patterns; panel border width driven by CSS variables (e.g. `--panel-border-width`)
- **Interactive panels** — `.glass-panel` hover/focus-within transitions to accent border + glow
- **Accordion** — Expandable content uses `.accordion-wrapper` + `.accordion-inner` (CSS grid-row animation)
- **Page titles** — h1 elements use `text-[color:var(--accent)]` for branded identity
- **iOS spinner** — `.spinner` class is iOS-style conic gradient; prefer over `.skeleton` for loading
- **LED indicators** — Knight Rider-style readiness/weight bars in top bar with themed pulse
- **Mobile nav** — active indicator is `absolute`; parent `Link` must be `relative`

### 13.3 `Documentation/STYLE-GUIDE.md`

`STYLE-GUIDE.md` now tracks the live visual baseline (tokens, selected-state rules, onboarding theme behavior). If any table drifts, implementation still defers to **`globals.css`**, **`tailwind.config.js`**, and the **ironmind-styling** / **ironmind-visual-persona** skills.

### 13.4 Dashboard layout & exercise list readability

- **Overview shell:** The authenticated dashboard wraps its primary content in **`.dashboard-overview`** (`globals.css`). It is **horizontally centered** (`max-width` + auto margins) with **rounded corners** (`1.25rem`) and a subtle warm-dark translucent fill. `.dashboard-overview` uses the same panel border system as `.glass-panel`: subtle resting border (6% accent), accent glow on hover/focus-within, 1px border width.
- **Ordered exercises:** Row indices use **`.exercise-index-badge`** — **dark tile + primary text + thin crimson border**. Avoid **grey-on-saturated-red** number chips (low contrast); follow **`IRONMIND.md`** and the **ironmind-styling** skill.

### 13.5 App chrome (header, sidebar, mobile nav)

Persistent layout chrome uses the same **warm dark** token hierarchy as the rest of the app — not flat `#2e2e2e`-style cool grey bars.

- **Tokens** (`globals.css` `:root`): `--chrome-bg` (sidebar & mobile nav, matches `--bg-1`), `--chrome-bg-topbar` (sticky header — **same value as `--chrome-bg`** so header and sidebar share one shade), `--chrome-bg-toggle` (sidebar rail control, matches `--bg-0`).
- **Components:** `top-bar.tsx`, `sidebar.tsx`, `mobile-nav.tsx` — backgrounds via `bg-[color:var(--chrome-…)]`; idle/hover chrome text via `var(--text-1)` / `var(--text-0)` (see **`.cursor/rules/IRONMIND.md`**).
- **LED indicators:** The top bar's Knight Rider-style LED readiness and weight bars replace the old numeric readiness display and profile section. Two synced pulse-animated bars with hover tooltips, themed via accent CSS variables.

### 13.6 Brand imagery (logos)

- **On disk:** All raster logo PNGs live under **`public/brand/`** (male, female, combined mark, Apple touch icon, optional alternate crops).
- **In code:** **`src/lib/constants/brand-assets.ts`** exports **`brandAssets`** — the only supported way to reference those URLs (`brandAssets.logoMale`, `logoFemale`, `logoCombined`, `appleTouchIcon`, alternates).
- **Components:** **`IronmindLogo`** (`src/components/brand/ironmind-logo.tsx`) picks male vs female PNG by UI theme (hot-pink → female). **`/login`** uses the **combined** mark directly via `brandAssets.logoCombined`.
- **Full asset list and prompts:** **`Documentation/LOGO-BRIEF.md`**.

### 13.7 Shared selected-state styling

- **Utility class:** `.is-selected` in `src/app/globals.css`.
- **Purpose:** Keep selected buttons, tabs, and cards synchronized with one theme-driven glow/border treatment.
- **Applied in:** dashboard cycle-day tabs + selected session card, nutrition day-type selector, recovery log/trends tab switcher, and selected demo profile tiles during onboarding.

---

## 14. Quality gates and workflows

| Gate | Command / action |
|------|-------------------|
| Typecheck | `npx tsc --noEmit` — **zero errors** policy |
| Lint | `npm run lint` |
| Architecture | No page → service/firebase shortcuts |
| Routing | All `href`s resolve to existing `page.tsx` |
| Seed | Seed files wired and logged |
| Alerts | All checks wired into `getActiveAlerts` |

---

## 15. Required reading for implementers (skills & docs)

Use this table when planning work — **read the relevant skill before coding**.

| Skill / doc | Path | Use when |
|-------------|------|----------|
| **IRONMIND rules** | `.cursor/rules/IRONMIND.md` | **Always** — design tokens, routing, Firebase names, alerts, seed, CSS import order |
| **Data layer** | `.cursor/skills/ironmind-data-layer/SKILL.md` | New features, controllers, services, mutations, cache keys |
| **Firebase patterns** | `.cursor/skills/ironmind-firebase-patterns/SKILL.md` | Firestore queries, converters, auth, constraints |
| **TypeScript patterns** | `.cursor/skills/ironmind-typescript-patterns/SKILL.md` | Types, imports, strict patterns |
| **Styling** | `.cursor/skills/ironmind-styling/SKILL.md` | Buttons, cards, panels, typography |
| **Visual persona** | `.cursor/skills/ironmind-visual-persona/SKILL.md` | Brand, crimson discipline, forbidden colors |
| **Animations** | `.cursor/skills/ironmind-animations/SKILL.md` | Motion, loading, hover |
| **Senior architect persona** | `.cursor/personas/SENIOR-ARCHITECT.md` | System-level decisions, review mindset |
| **Next.js agent note** | `AGENTS.md` | Next.js behavior differences — consult `node_modules/next/dist/docs/` |
| **This architecture doc** | `Documentation/ARCHITECTURE.md` | Orientation, boundaries, Firestore map |
| **Implementation review (2026-04-21)** | `Documentation/IMPLEMENTATION-REVIEW-2026-04-21.md` | Request-to-delivery trace for current UI/UX retrofit |
| **Documentation index** | `Documentation/README.md` | Which doc to read for what |
| **Logo brief & assets** | `Documentation/LOGO-BRIEF.md` | Brand prompts, `public/brand/` files, `brandAssets` |

---

## 16. Environment variables

Required for full Firebase operation (see `README.md`):

Feature flags (when present; see `.env.local` examples in repo):

- `NEXT_PUBLIC_ENABLE_PHOTO_UPLOAD` — set to `true` only when Firebase Storage is provisioned.

Core Firebase:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Without these, Firebase initialization is skipped (`isMockMode`-style behavior in config).

---

## 17. How to add a new feature (checklist)

1. **Domain type** — Add/adjust interfaces in `src/lib/types/index.ts`.
2. **Firestore** — If new collections are needed, extend `collections` in `config.ts` and document security rules (deployment concern).
3. **Service** — Add functions in `src/services/<domain>.service.ts` with explicit return types.
4. **Controller** — Add `useQuery`/`useMutation` hooks in `src/controllers/use-<domain>.ts`; register keys in `query-keys.ts` and `stale-times.ts`.
5. **UI** — Add route under `src/app/(app)/.../page.tsx`; use controller hooks only; implement loading / error / empty states (IRONMIND completeness).
6. **Seed / import** — If default data is required, update `lib/seed` **and** `seedUserData()`.
7. **Alerts** — If new alert types, extend `SmartAlert` union **and** `getActiveAlerts` wiring.
8. **Verify** — `tsc --noEmit`, lint, manual 375px layout.

---

## 18. Glossary (domain)

| Term | Meaning |
|------|---------|
| **Cycle day** | Position in the N-day rotating program (e.g. 14-day) |
| **Day type** | Recovery / moderate / high / highest — drives macro templates |
| **Landmarks** | MV / MEV / MAV / MRV volume bands per muscle |
| **KPI** | Key lifts tracked across the cycle (e.g. DB bench, pull-ups) |

---

*Document version follows the repository; when in doubt, verify against source files cited above.*
