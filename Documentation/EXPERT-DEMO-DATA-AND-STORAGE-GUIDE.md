# Expert guide: fitness analysis, demo data, and storage touchpoints (IRONMIND)

**Audience:** Domain experts (coaching, nutrition, periodization) and engineers who generate or tune **demo personas**, **synthetic history**, or **coach-import JSON** — without breaking Firestore, Storage, or the app’s data contracts.

**Scope:** Where data lives, which files to edit, how writes reach storage, and what to avoid. This is not a product UX spec.

---

## 1. Two different “storages”

| Layer                   | Technology                                      | What you change                                                              |
| ----------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------- |
| **Structured app data** | **Cloud Firestore** (via TypeScript + services) | Persona objects, demo timelines, nutrition/recovery/workout shapes           |
| **Binary media**        | **Firebase Cloud Storage** (images, etc.)       | Rare for demo _generation_; paths and rules matter if you add photo fixtures |

Do **not** conflate them: JSON seed blobs and Firestore documents are **not** Storage files unless you explicitly upload bytes.

---

## 2. Firestore layout (canonical paths)

All collection path strings must come from **`src/lib/firebase/config.ts`** → `collections` (never hand-roll `users/...` strings in app code).

| Helper                                 | Path pattern                      | Typical content                                                                                                                    |
| -------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `collections.users`                    | `users`                           | Top-level user doc (`isSeeded`, `dataSchemaVersion`, …)                                                                            |
| `collections.profiles(uid)`            | `users/{uid}/profile`             | Doc `data` — athlete profile                                                                                                       |
| `collections.programs(uid)`            | `users/{uid}/programs`            | Training programs                                                                                                                  |
| `collections.workouts(uid)`            | `users/{uid}/workouts`            | Completed / planned workouts                                                                                                       |
| `collections.nutritionDays(uid)`       | `users/{uid}/nutrition`           | One doc per calendar `date`                                                                                                        |
| `collections.nutritionPlan(uid)`       | `users/{uid}/nutritionPlan`       | Doc `current` — plan seed                                                                                                          |
| `collections.recoveryEntries(uid)`     | `users/{uid}/recovery`            | Recovery logs                                                                                                                      |
| `collections.checkIns(uid)`            | `users/{uid}/checkins`            | Physique check-ins — dated seeds use **doc id = `YYYY-MM-DD`**; demo overwrite **deletes the whole subcollection** first (see §4a) |
| `collections.phases(uid)`              | `users/{uid}/phases`              | Coaching phases                                                                                                                    |
| `collections.journalEntries(uid)`      | `users/{uid}/journal`             | Journal                                                                                                                            |
| `collections.volumeLandmarks(uid)`     | `users/{uid}/landmarks`           | Doc `data` — volume landmarks                                                                                                      |
| `collections.supplementProtocol(uid)`  | `users/{uid}/protocol`            | Doc `current`                                                                                                                      |
| `collections.supplementLogs(uid)`      | `users/{uid}/supplements`         | Per-day supplement logs                                                                                                            |
| `collections.weeklyVolumeRollups(uid)` | `users/{uid}/weeklyVolumeRollups` | Aggregates (usually leave to app, not hand-edited)                                                                                 |
| `collections.importJobs(uid)`          | `users/{uid}/importJobs`          | Import audit                                                                                                                       |
| `collections.seedJobs(uid)`            | `users/{uid}/seedJobs`            | First-login seed audit                                                                                                             |

**Security:** `firestore.rules` — authenticated users may read/write only under their own `users/{userId}/...`. Experts tuning **client-side** seed/import still produce data **as that user** once the app runs; there is no separate “admin bypass” in-repo.

**Check-in hygiene:** Any document in `checkins` with a **non–date-shaped** id (e.g. from `addDocument`) survives normal `saveCheckIn(userId, date, …)` writes because those target **date-keyed** ids only. Demo overwrite therefore calls **`deleteAllCheckIns(userId)`** in **`src/services/physique.service.ts`** at the start of **`seedDemoHistoricalData`** so charts cannot mix stale rows with new demo data.

---

## 3. Baseline persona data (static TypeScript modules)

**Location:** `src/lib/seed/`

| File pattern                                                                                                         | Role                                                                     |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `profile.ts`, `program.ts`, `nutrition.ts`, `supplements.ts`, `phase.ts`, `volume-landmarks.ts`, `coaching-notes.ts` | **Morton** (default first-login seed)                                    |
| `cheri-*.ts`, `alex-*.ts`, `jordan-*.ts`, `fez-*.ts`, `maria-*.ts`                                                   | Alternate **demo personas** (Cheri, Alex, Jordan, Fez, Maria)            |
| `nutrition.ts`                                                                                                       | Exports **`NutritionPlanSeed`** used by seed + demo historical generator |

**Orchestration:**

- **First login (production path):** `seedUserData` in **`src/lib/seed/index.ts`** — runs **once** when the user is not seeded; uses **Morton** constants; creates **`seedJobs`** and uses compensating rollback on failure (same artifact idea as import).
- **Demo / dev personas (overwrite):** `seedMortonData`, `seedCheriData`, `seedAlexData`, `seedJordanData`, `seedFezData`, `seedMariaData` in **`index.ts`** — **overwrite** existing domain data for that `userId`, then call **`seedDemoHistoricalData`** (see below). Wired from **`src/components/onboarding/DemoProfileModal.tsx`**.

**Project rule (from IRONMIND):** Any new `src/lib/seed/*.ts` module must be **imported and invoked** from `seed/index.ts` (and follow existing logging patterns where applicable).

**Demo UI — accent theme on load:** After a successful `seed*Data`, **`DemoProfileModal`** calls **`getDemoThemeForProfileId`** from **`src/lib/seed/demo-theme.ts`** (same preset map as **§13**) and applies `setTheme`. **`DemoThemeSync`** (`src/components/theme/demo-theme-sync.tsx`) re-applies the preset when the active profile’s `clientName` matches a demo athlete (e.g. after full page refresh).

**Physique check-ins — partial writes:** `saveCheckIn` in **`src/services/physique.service.ts`** **deep-merges** `measurements` onto any existing check-in for that date before `setDocument(..., { merge: true })`, so partial UI saves do not wipe other circumference fields. Incoming circumferences are passed through **`sanitizeMeasurementsInput`** (`src/lib/utils/measurement-bounds.ts`, **`CM_BOUNDS`**) so implausible values (typos, autofill garbage) **do not overwrite** stored keys — including **shoulders** and **calves** when those fields are submitted. **Charts** use **`measurementForChart`** so out-of-range legacy rows are **omitted** from trend lines instead of stretching the Y-axis. **Demo overwrite** replaces the entire check-in subcollection, then writes **only** the hand-authored rows from **`src/lib/seed/demo-data/physique/`** (tape keys as authored per persona file — typically waist through thighs plus **shoulders**; extend literals if you add calves), within plausible bounds.

**Physique History (in-app UI):** On **`src/app/(app)/physique/page.tsx`**, the **History** section lists check-ins **newest first** and renders the **first 10** loaded rows in a **horizontally scrollable** `.data-table` with a **sticky** date column. Each tape column follows **`PHYSIQUE_HISTORY_METRICS`** (waist → calves): **absolute cm** on the first line and **Δ cm vs the next older check-in** on the second (only when both rows contain that site). **Scale** shows **kg** and **Δ kg** vs the next older row the same way. This is **derived in the UI** — Firestore remains point-in-time values per date.

**Physique charts (read path):** Dashboard and Physique pages **sort** check-ins by ISO `date` and use **`dateKey` (`YYYY-MM-DD`)** as the Recharts series key with short tick labels — avoids ambiguous `dd/MM` collisions across years. Chart series may use a **subset** of sites (`MEASUREMENT_CHART_SERIES`) even when additional sites are stored or shown in History.

---

## 4. Demo historical data (`seedDemoHistoricalData`)

**Primary file:** `src/lib/seed/demo-historical.ts` — orchestrates the **84-day** window (default), calls **`deleteAllCheckIns`**, writes physique from static data, then generates daily telemetry via services.

### 4a. Physique — hard-coded weekly rows (demo selection only)

| Location                                                                  | Role                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/seed/demo-data/physique/types.ts`                                | `DemoPhysiqueWeek` (bodyweight + `Measurements`), `DemoPersonaId`                                                                                                                                                      |
| `src/lib/seed/demo-data/physique/{morton,cheri,alex,jordan,fez,maria}.ts` | **Twelve** rows each, oldest → newest; file header describes that persona’s coaching arc; last row **bodyweight** matches that seed profile’s **`currentWeight`**; tape includes **`rightThigh`** and **`shoulders`**. |
| `src/lib/seed/demo-data/physique/index.ts`                                | **`DEMO_PHYSIQUE_WEEKLY_BY_PERSONA`**, **`getDemoPhysiqueWeeks(personaId)`** — module doc states **only** `seedDemoHistoricalData` may consume this for production-shaped demos.                                       |

**Mapping:** `seedDemoHistoricalData` collects **weekly** calendar dates (`i % 7 === 0` over the window), then for each week index `i` takes row `min(i, 11)` from that persona’s array and **`saveCheckIn(userId, date, buildStaticDemoCheckIn(...))`**. No runtime generator for scale/tape — edit the literals and re-load a demo profile.

**Presentation layer:** Coach notes are **twelve distinct lines per persona** (oldest → newest week). Intermediate weeks apply **deterministic** small jitter to scale/tape from the literals (FNV-style hash on `personaId` + week + field) so History does not read like a perfect spreadsheet; the **last** check-in of the window uses **raw** row values so **`currentWeight`** / tape still match the active seed profile.

### 4b. Synthetic daily telemetry (still generated in `demo-historical.ts`)

- **`personaTuning`:** adherence, sleep, HRV, stress, meal portions, workout probability, etc. — tune “how messy” daily logs look without touching physique literals.
- **`DEMO_HISTORY_DAYS`** (default **84** ≈ **12 weeks**) and **`getDemoHistoryStartDateString(days?)`:** demo seeds in **`src/lib/seed/index.ts`** pass the day count and align each program’s **`startDate`** with the history window so **today** is the last day of the anchored window.
- **Writes:** **`createWorkout`**, **`saveNutritionDay`**, **`saveRecoveryEntry`**, **`saveSupplementLog`**, **`createJournalEntry`**, etc., so converters and timestamps stay consistent.

**When you change data:** Re-seed via the **demo profile** UI (or a dev call to `seed*Data`) — editing TypeScript alone does not mutate Firestore.

---

## 5. Coach JSON import (external pack format)

**Parsing and validation:** `src/services/import.service.ts`

- Filenames must match the expected set (e.g. `athlete_profile.json`, `training_program.json`, …).
- **`FILE_VALIDATORS`** — minimal structural checks per file. If you extend the coach pack format, update validators and **`ParsedCoachData`** / types together.
- **`startDate` on `training_program.json` and `phase.json`:** When the JSON includes a valid **`YYYY-MM-DD`**, import **preserves** it as the Firestore program/phase anchor; otherwise the import run uses **today** (`calendarDateOr` in `import.service.ts`). Athletes can still change program Week 1 start in-app (`Program.startDate`).
- Writes go through **import + batch helpers** and **`importJobs`**; do not bypass for “quick tests” unless you accept broken rollback semantics.

**Compensation artifacts:** If you add new write steps to import, extend **`ImportArtifact`** in `src/services/import-compensation.ts` and implement rollback branches.

---

## 6. Type system (do not drift from this)

**Umbrella types:** `src/lib/types/index.ts`

- Shapes for **`Program`**, **`Workout`**, **`NutritionDay`**, **`RecoveryEntry`**, **`Phase`**, **`SupplementProtocol`**, **`AthleteProfile`**, **`SmartAlert`**, etc.
- If you add fields for analytics, extend types **and** any serializers/converters that persist them.

**Alert types:** `SmartAlert.type` values must stay in sync with `src/services/alerts.service.ts` (enforced by project rules).

---

## 7. Firebase Storage (photos, not “seed JSON”)

**Rules:** `storage.rules` — users may read/write only under `users/{userId}/**` when authenticated as that user.

**App pattern:** Progress photos use a **pending → commit** flow (see **`Documentation/ARCHITECTURE.md`**, Storage / physique sections):

- Pending prefix under the user’s Storage tree, then commit to final path via helpers in `src/lib/firebase/storage.ts` and `src/services/physique.service.ts`.

**For demo experts:** Unless you are generating **binary image fixtures**, you usually **do not** edit Storage. If you do, keep paths under `users/{uid}/...`, respect the pending/final contract, and never widen rules without a security review.

---

## 8. Indexes and queries (if your demo needs new reads)

**File:** `firestore.indexes.json` at repo root.

- **`collectionGroup`** index IDs must match the **last path segment** of the physical collection (e.g. `nutrition`, not an internal TypeScript alias). Wrong indexes cause production query failures after deploy.

After changing queries: run **`npm run deploy:indexes`** when your workflow allows (see `README_DATA_LAYER.md` / `ARCHITECTURE.md`).

---

## 9. What **not** to do

1. **Do not** write raw Firestore from pages or random scripts outside **`src/lib/firebase/`** and **services** — the app architecture forbids it and you will bypass `stripUndefinedDeep`, converters, and error handling.
2. **Do not** hand-roll `users/...` path strings — use **`collections.*`** from `config.ts`.
3. **Do not** persist **`undefined`** in objects destined for Firestore (writes will fail or strip unpredictably) — follow existing service patterns.
4. **Do not** create **multiple `isActive: true`** programs or phases for the same user without using **`setActiveProgram` / `setActivePhase`** (transactional). If you are repairing legacy bad data, use **`repairMultipleActivePrograms`** / **`repairMultipleActivePhases`** in training/coaching services (on-demand helpers).
5. **Do not** assume **`seedUserData`** runs again after first success — it early-returns if `isUserSeeded`. Use demo seed functions or reset the user’s seeded flag only in **dev/emulator** contexts you control.
6. **Do not** grow **journal** or **history** queries without bounds — `src/services/coaching.service.ts` documents scan limits and date windows; unbounded reads hurt cost and UX.
7. **Do not** bump **`CURRENT_DATA_SCHEMA_VERSION`** without reading **`Documentation/ARCHITECTURE.md`** section on schema evolution (and updating migration notes).

---

## 10. Suggested workflow for experts

1. **Clarify goal:** Baseline first-login (Morton) vs demo persona overwrite vs coach JSON pack vs historical depth/tone.
2. **Edit the smallest surface:** Static profile/program modules in `src/lib/seed/*.ts`; **physique scale/tape** in `src/lib/seed/demo-data/physique/*.ts`; **daily demo noise** via **`personaTuning`** / helpers in **`demo-historical.ts`**.
3. **Align types:** `src/lib/types/index.ts` (and validators in `import.service.ts` if import format changes).
4. **Re-seed:** Use onboarding demo modal or controlled calls to `seed*Data` / import flow against **emulator or disposable test users** (`NEXT_PUBLIC_USE_FIREBASE_EMULATORS` — see `README_DATA_LAYER.md`).
5. **Verify in app:** Dashboard bundle, training week, nutrition day, recovery trends — not only raw Firestore console.

---

## 11. Further reading

| Document                                            | Use                                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `Documentation/ARCHITECTURE.md`                     | Full stack, import pipeline, alert cache, schema versioning, Storage lifecycle |
| `Documentation/PRINCIPAL-REVIEW-DATA-2026-04-23.md` | Data-layer hardening status, bounded reads, rollback semantics                 |
| `README_DATA_LAYER.md`                              | Pages → controllers → services → Firebase rule                                 |

**Export parity:** Markdown export **`formatCheckInsTable`** in **`src/lib/export/generate-summary.ts`** prints a **fixed column set** (waist–thigh plus weight and notes) and does **not** yet mirror every History column (e.g. shoulders, calves) or **Δ** columns. Extend that table when coaches need full parity inside LLM exports.

---

## 12. Default demo ecosystem (when expanding without a custom brief)

Use these defaults unless product explicitly requests otherwise:

| Decision        | Default                                                                                                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo user count | **Six** roster personas: **Morton**, **Cheri**, **Alex**, **Jordan**, **Fez**, **Maria** (wired in **`DemoProfileModal.tsx`** and **`seed/index.ts`**)                                                           |
| Time depth      | **`DEMO_HISTORY_DAYS` (84)** — twelve weeks of daily nutrition, recovery, supplements; **twelve** weekly physique points from **`DEMO_PHYSIQUE_WEEKLY_BY_PERSONA`**; persona-specific journal milestones         |
| Delivery        | **`seedDemoHistoricalData`** + static **`demo-data/physique/`** + **`personaTuning`** generator — not ad-hoc Firestore scripts; **data only** (no Storage photo fixtures unless you add an explicit upload path) |
| Roster mix      | **Mixed**: masters gain, fat-loss beginner, intermediate hypertrophy, home beginner, vegan athlete bulk, home/pool mom recomp                                                                                    |
| Realism         | **Physique:** hand-authored weekly trends per persona file; **daily logs:** serious amateur variance — deload week, Cheri/Maria stress bumps, imperfect adherence in **`personaTuning`**                         |
| Schema          | **Preserve** existing types and validators; new fields require **`src/lib/types/index.ts`** + serializers + any import validators                                                                                |

**Operational note:** Doubling history length **doubles** per-demo Firestore writes on overwrite; keep `DEMO_HISTORY_DAYS` bounded and adjust only with performance awareness.

---

## 13. Demo profile → UI theme (`AppTheme`)

**Source of truth:** **`src/lib/seed/demo-theme.ts`** — exports **`DEMO_THEME_BY_PROFILE_ID`**, **`getDemoThemeForProfileId`**, **`getDemoThemeForClientName`** (lowercased `clientName` → preset). Re-exported from **`src/lib/seed/index.ts`** for app imports.

**Where it applies:** **`DemoProfileModal`** calls **`getDemoThemeForProfileId(selected)`** after a successful `seed*Data` and sets **`useUIStore.setTheme`**. **`DemoThemeSync`** (`src/components/theme/demo-theme-sync.tsx`, mounted from **`src/app/layout.tsx`**) re-applies the same mapping when the signed-in profile’s **`clientName`** is a demo athlete so refresh/navigation does not revert to crimson alone.

Presets are defined on **`html[data-theme='…']`** in **`src/app/globals.css`**.

| Profile id | `AppTheme` | Rationale (short)                                      |
| ---------- | ---------- | ------------------------------------------------------ |
| `morton`   | `crimson`  | Default IRONMIND iron / masters intensity              |
| `cheri`    | `hot-pink` | Distinct feminine energy for the cut-phase narrative   |
| `alex`     | `emerald`  | Hypertrophy / KPI “progress in the green”              |
| `jordan`   | `forge`    | Warm orange — beginner momentum, home-gym grit         |
| `fez`      | `cobalt`   | Cool blue — ocean / cardio athlete, early AM gym focus |
| `maria`    | `violet`   | Calm purple — home / pool / custody cadence            |

Adding a seventh demo persona requires a **new** `AppTheme` preset in `globals.css` + `ui-store.ts`, or reusing an existing theme and accepting a duplicate.

---

_Last aligned with repo: hard-coded demo physique (`src/lib/seed/demo-data/physique/`), `deleteAllCheckIns` + `seedDemoHistoricalData`, `demo-theme.ts` + `DemoThemeSync`, chart `dateKey` sorting, and Physique **History** as a scrollable table with Δ vs next older row. If paths drift, trust `src/lib/firebase/config.ts` and `ARCHITECTURE.md` over this file._
