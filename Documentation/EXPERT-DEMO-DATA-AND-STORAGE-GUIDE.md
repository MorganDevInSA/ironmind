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

| Helper                                 | Path pattern                      | Typical content                                         |
| -------------------------------------- | --------------------------------- | ------------------------------------------------------- |
| `collections.users`                    | `users`                           | Top-level user doc (`isSeeded`, `dataSchemaVersion`, …) |
| `collections.profiles(uid)`            | `users/{uid}/profile`             | Doc `data` — athlete profile                            |
| `collections.programs(uid)`            | `users/{uid}/programs`            | Training programs                                       |
| `collections.workouts(uid)`            | `users/{uid}/workouts`            | Completed / planned workouts                            |
| `collections.nutritionDays(uid)`       | `users/{uid}/nutrition`           | One doc per calendar `date`                             |
| `collections.nutritionPlan(uid)`       | `users/{uid}/nutritionPlan`       | Doc `current` — plan seed                               |
| `collections.recoveryEntries(uid)`     | `users/{uid}/recovery`            | Recovery logs                                           |
| `collections.checkIns(uid)`            | `users/{uid}/checkins`            | Physique check-ins                                      |
| `collections.phases(uid)`              | `users/{uid}/phases`              | Coaching phases                                         |
| `collections.journalEntries(uid)`      | `users/{uid}/journal`             | Journal                                                 |
| `collections.volumeLandmarks(uid)`     | `users/{uid}/landmarks`           | Doc `data` — volume landmarks                           |
| `collections.supplementProtocol(uid)`  | `users/{uid}/protocol`            | Doc `current`                                           |
| `collections.supplementLogs(uid)`      | `users/{uid}/supplements`         | Per-day supplement logs                                 |
| `collections.weeklyVolumeRollups(uid)` | `users/{uid}/weeklyVolumeRollups` | Aggregates (usually leave to app, not hand-edited)      |
| `collections.importJobs(uid)`          | `users/{uid}/importJobs`          | Import audit                                            |
| `collections.seedJobs(uid)`            | `users/{uid}/seedJobs`            | First-login seed audit                                  |

**Security:** `firestore.rules` — authenticated users may read/write only under their own `users/{userId}/...`. Experts tuning **client-side** seed/import still produce data **as that user** once the app runs; there is no separate “admin bypass” in-repo.

---

## 3. Baseline persona data (static TypeScript modules)

**Location:** `src/lib/seed/`

| File pattern                                                                                                         | Role                                                                     |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `profile.ts`, `program.ts`, `nutrition.ts`, `supplements.ts`, `phase.ts`, `volume-landmarks.ts`, `coaching-notes.ts` | **Morton** (default first-login seed)                                    |
| `sheri-*.ts`, `alex-*.ts`, `jordan-*.ts`                                                                             | Alternate **demo personas** (Sheri, Alex, Jordan)                        |
| `nutrition.ts`                                                                                                       | Exports **`NutritionPlanSeed`** used by seed + demo historical generator |

**Orchestration:**

- **First login (production path):** `seedUserData` in **`src/lib/seed/index.ts`** — runs **once** when the user is not seeded; uses **Morton** constants; creates **`seedJobs`** and uses compensating rollback on failure (same artifact idea as import).
- **Demo / dev personas (overwrite):** `seedMortonData`, `seedSheriData`, `seedAlexData`, `seedJordanData` in **`index.ts`** — **overwrite** existing domain data for that `userId`, then call **`seedDemoHistoricalData`** (see below). Wired from **`src/components/onboarding/DemoProfileModal.tsx`**.

**Project rule (from IRONMIND):** Any new `src/lib/seed/*.ts` module must be **imported and invoked** from `seed/index.ts` (and follow existing logging patterns where applicable).

---

## 4. Synthetic historical demo data (workouts, nutrition, recovery, …)

**Primary file:** `src/lib/seed/demo-historical.ts`

- Exports **`seedDemoHistoricalData(ctx)`** — builds a **multi-week** synthetic history from a **persona id** (`morton` | `sheri` | `alex` | `jordan`), profile, program, nutrition plan, supplement protocol, and `programId`.
- **`personaTuning`** at the top of the file: knobs for **adherence**, sleep, HRV, stress, weight drift, meal portions, etc. This is the right place to tune “how strict this athlete’s demo looks” without rewriting the whole generator.
- **`DEMO_HISTORY_DAYS`** (exported constant, default **84** ≈ **12 weeks**) and **`getDemoHistoryStartDateString(days?)`**: demo overwrite seeds in **`src/lib/seed/index.ts`** pass the day count into `seedDemoHistoricalData` and set each program’s `startDate` from **`getDemoHistoryStartDateString()`** so the **last synthetic day** lines up with **today** and the training calendar + historical logs share one anchored window.
- Uses **services only** (`createWorkout`, `saveNutritionDay`, `saveRecoveryEntry`, …) so Firestore converters and timestamps stay consistent.

**When you change tuning:** Re-seed via the UI demo flow (or call the `seed*Data` function in a dev harness) so documents are rewritten — editing TS alone does not mutate existing Firestore docs.

---

## 5. Coach JSON import (external pack format)

**Parsing and validation:** `src/services/import.service.ts`

- Filenames must match the expected set (e.g. `athlete_profile.json`, `training_program.json`, …).
- **`FILE_VALIDATORS`** — minimal structural checks per file. If you extend the coach pack format, update validators and **`ParsedCoachData`** / types together.
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
2. **Edit the smallest surface:** Static constants in `src/lib/seed/*.ts` and/or **`personaTuning`** in `demo-historical.ts`.
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

---

---

## 12. Default demo ecosystem (when expanding without a custom brief)

Use these defaults unless product explicitly requests otherwise:

| Decision        | Default                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demo user count | **Four** roster personas: **Morton**, **Sheri**, **Alex**, **Jordan** (wired in **`DemoProfileModal.tsx`** and **`seed/index.ts`**)                   |
| Time depth      | **`DEMO_HISTORY_DAYS` (84)** — twelve weeks of daily nutrition, recovery, supplements; weekly check-ins; persona-specific coaching journal milestones |
| Delivery        | **Seed modules + `seedDemoHistoricalData`** — not raw scripts; **data only** (no Storage photo fixtures unless you add an explicit upload path)       |
| Roster mix      | **Mixed**: masters male gain, female fat-loss journey, intermediate male hypertrophy, beginner female consistency                                     |
| Realism         | **Serious amateur / coached** — intentional misses, mid-block deload week, Sheri stress-week bump, imperfect adherence in **`personaTuning`**         |
| Schema          | **Preserve** existing types and validators; new fields require **`src/lib/types/index.ts`** + serializers + any import validators                     |

**Operational note:** Doubling history length **doubles** per-demo Firestore writes on overwrite; keep `DEMO_HISTORY_DAYS` bounded and adjust only with performance awareness.

---

_Last aligned with repo layout as of the document’s introduction; if paths drift, trust `src/lib/firebase/config.ts` and this repo’s `ARCHITECTURE.md` over this file._
