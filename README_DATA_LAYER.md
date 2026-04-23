## Data Layer Architecture

> _Independent assessment by senior data architecture review — April 2026_

IRONMIND's data layer is not a collection of API calls scattered across components. It is a disciplined three-tier architecture with hard boundaries, enforced separation of concerns, and a cache-first philosophy that eliminates redundant network calls and enables instant UI updates.

### The Three-Layer Rule

Every data operation flows through exactly three layers. No shortcuts, no exceptions:

```
Pages / Components
      ↓  (hooks only)
Controllers  src/controllers/use-*.ts   (TanStack Query hooks)
      ↓  (function calls)
Services     src/services/*.service.ts  (domain logic + Firebase calls)
      ↓  (SDK wrappers)
Firebase SDK src/lib/firebase/          (typed helpers)
```

**Hard constraints:**

- Pages never import from `@/services` or `firebase/*` directly
- Controllers expose only TanStack Query hooks (`useQuery`, `useMutation`)
- Services are plain async functions with no React dependencies
- Firebase helpers are single-purpose, fully typed wrappers

This separation enables **service-layer testing without mounting React**, **controller logic reuse across pages**, and **zero prop-drilling** for server state. It also makes the codebase immediately legible to teams used to backend MVC patterns — services are your models, controllers are your cache orchestrators, pages are your views.

### TanStack Query as the Caching Substrate

IRONMIND uses TanStack Query (React Query) not as a data-fetching library, but as an **observable cache with invalidation semantics**. Every controller hook wraps a service call with cache keys, stale times, and optimistic update handlers:

**Cache keys are hierarchical and composable:**

```typescript
queryKeys(userId).training.recentWorkouts(30); // [userId, 'training', 'recent-workouts', 30]
queryKeys(userId).physique.weightTrend(60); // [userId, 'physique', 'weight-trend', 60]
queryKeys(userId).alerts.active(); // [userId, 'alerts', 'active']
```

**Stale times are domain-specific:**

- Profile data: 5 minutes (rarely changes mid-session)
- Active alerts: 30 seconds (recalculated frequently)
- Workout logs: 2 minutes (user is actively editing)
- Export summaries: 10 seconds (expensive aggregation)

**Optimistic updates for instant UX:**
When the user completes a set, the workout controller immediately updates the cache with the new value, renders the checkmark, then syncs to Firestore in the background. If the write fails, the cache rolls back and the UI reverts — but 99% of the time, the user experiences zero latency.

### Standardized Error Handling

Every service function is wrapped in `withService(domain, operation, fn)`, which catches all errors and converts them into a structured `ServiceError` with:

- `domain`: which service module (e.g., "training", "nutrition")
- `operation`: what the function was trying to do (e.g., "fetch recent workouts")
- `code`: standardized error type (`NOT_FOUND`, `PERMISSION_DENIED`, `NETWORK_ERROR`, etc.)
- `cause`: original error for debugging

Controllers attach `onMutationError` to every mutation, which surfaces `ServiceError` messages via **Sonner** toasts (and logs in development). This eliminates silent failures and "undefined is not a function" mysteries — every error is traceable to a specific service + operation.

### Cache-First Export Generation

The export feature demonstrates the architecture's power. When generating a 50KB markdown summary of the user's full training state, the system:

1. Receives a `queryClient` reference from the controller
2. Attempts to read 13 data sets from cache using their query keys
3. Only fetches missing data from Firebase
4. Aggregates and formats the cached + fresh data into markdown

On the second export within the stale-time window, **zero network calls** occur — the entire summary is assembled from cache. This pattern extends to dashboard widgets, alert calculations, and any derived data view.

**Physique check-ins in export:** The markdown table built by **`formatCheckInsTable`** (`src/lib/export/generate-summary.ts`) lists a **fixed** set of measurement columns plus weight and notes. The **`/physique`** page **History** table can show additional sites (e.g. shoulders, calves) and **Δ** rows that are **not** persisted — extend the export formatter when coaches need full parity with the on-screen History layout (`Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md`).

### Firebase Abstraction Layer

IRONMIND never calls Firebase SDK methods directly from services. All SDK operations flow through typed helpers in `src/lib/firebase/`:

**Firestore operations:**

- `getDocument<T>(path, docId, converter?)` — fetch single doc with auto-deserialization
- `queryDocuments<T>(path, constraints[], converter?)` — filtered queries with type safety
- `setDocument<T>`, `updateDocument<T>`, `addDocument<T>` — writes with automatic `undefined` stripping
- `deleteDocument(path, docId)` — self-explanatory
- `runFirestoreTransaction(fn)` — multi-document reads + writes with automatic retry on contention
- `createWriteBatch()` — batched writes (up to 500 ops per commit)
- `getCollectionCount(path, constraints?)` — aggregate count without loading every document

**Query discipline:** list and trend services use `where` + `orderBy` + `limit` so hot paths stay O(window), not O(entire history). `collectionGroup` values in `firestore.indexes.json` match the **last path segment** of each subcollection (e.g. `nutrition`, not the TypeScript helper name `nutritionDays`).

**Client API contract:** No Next.js route handlers for domain data today — services + Firestore + rules are the surface. **`CURRENT_DATA_SCHEMA_VERSION`** bump process lives in **`Documentation/ARCHITECTURE.md`** §7.5.

**Dashboard bundle:** `getDashboardBundle` in `dashboard.service.ts` + `useDashboardData` load profile, program, **a single calendar day’s** nutrition/recovery/supplements (the bundle’s `calendarDate`, typically **today**), latest recovery fallback, weekly volume, and alerts in **one** TanStack query (`queryKeys(userId).dashboard.bundle(calendarDate)`). Mutations call `invalidateDashboardBundle` so the shell refetches coherently without eight separate hook subscriptions.

**`/dashboard` trend strip:** The page also composes **`useNutritionDay`**, **`useRecoveryEntry`**, and **`useSupplementLog`** for **`selectedTrendDate`** so browsing dates in the strip updates schedule and cards using the **same per-day query keys** as Nutrition / Recovery / Supplements pages — do not assume the bundle alone powers every dashboard metric.

**Alerts vs bundle:** The layout **top bar** uses **`useActiveAlerts`** (its own query key). `invalidateDashboardBundle` also invalidates **`queryKeys(userId).alerts.all`** so shell alerts stay in sync with the same writes that refresh the dashboard bundle (see `invalidate-dashboard.ts`).

**Workout set writes:** `applyWorkoutSetChange` (`training.service.ts`) runs a Firestore **transaction** and compares optional `updatedAt` from the client read with the server document so rapid multi-tab edits surface a `CONFLICT` `ServiceError` instead of silently losing a newer save.

**Import outcomes:** `ImportResult.completion` is `success` | `partial` | `failed` | `blocked` (principal review contract) alongside the legacy `success` boolean. Each run creates **`importJobs`** (`jobId` on the result); on step failures after writes began, **`rollbackImportArtifacts`** in `import-compensation.ts` reverses pushed state using **`captureImportSnapshots`**. **`import-firestore-batch.ts`** batches independent writes (profile + protocol + landmarks; nutrition plan + day + journal; first-only program/phase fast paths) while compensating rollback remains the cross-step safety net.

**First-login seed:** `seedUserData` returns **`SeedUserDataResult`** (`seeded`, `jobId?`) and writes **`seedJobs`** with the same compensating rollback pattern.

**Weekly volume rollup:** Persisted docs under **`weeklyVolumeRollups/{weekStart}`** speed **`getWeeklyVolumeSummary`**; **`deleteCurrentWeekVolumeRollup`** is invoked after workout mutations and post-import invalidation so rollups stay consistent with workouts.

**Pending progress photos:** `listOrphanPendingProgressPhotos` / `deletePendingProgressPhotos` in `physique.service.ts` (plus `listPendingProgressPhotoPaths` / `deleteStoragePaths` in storage helpers) support cleanup of `users/{uid}/photos/pending/`.

**Benefits:**

- Swap Firebase for Supabase/Postgres with service-layer changes only
- Enforce consistent error handling (all helpers throw `ServiceError`)
- Centralized `stripUndefinedDeep` to prevent Firestore write failures
- Converters enforce `Date → string (ISO)` at the boundary — no `Timestamp` objects leak into app logic

**Storage operations:**

- `uploadFile(path, file, metadata?)` — returns download URL
- `getDownloadURL(path)` — fetches existing file URL
- `deleteFile(path)` — cleanup

Helpers are thin wrappers; add unit/integration tests when a runner is adopted.

### Local Firebase emulators

When `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` or `USE_FIREBASE_EMULATORS=true` (and `NODE_ENV` is not `production`), `src/lib/firebase/config.ts` connects **Firestore** to `NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST` / `NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT` (defaults `127.0.0.1` / `8080`) and **Auth** to `NEXT_PUBLIC_AUTH_EMULATOR_URL` (default `http://127.0.0.1:9099`). Use `npm run emulators` (install the **Firebase CLI** / `firebase-tools` globally or via `npx`, plus **Java** for the Firestore emulator). Current `firebase-tools` releases expect **Node.js ≥ 20** on the machine that runs the CLI.

### Architectural Invariants (Enforced by Lint)

The codebase includes automated audits that fail builds if violated:

1. **No raw Firebase imports in pages/components** — grep for `from 'firebase/` outside `src/lib/firebase/`
2. **No direct service calls in pages** — grep for `import.*from '@/services'` in `src/app/` or `src/components/` (excluding `use-import.ts`, which is explicitly documented)
3. **No hardcoded accent colors** — grep for `#DC2626` or `220, 38, 38` outside `:root` blocks
4. **All query keys use the factory** — no inline `[userId, 'something']` strings

### Query Invalidation Strategy

Mutations invalidate related queries using **prefix matching** on query keys:

- Saving a workout → `queryClient.invalidateQueries({ queryKey: [userId, 'training'] })` plus `invalidateDashboardBundle` (or `{ queryKey: [userId, 'dashboard'] })` so the composite dashboard query refetches.
  - Invalidates `training.recentWorkouts()`, `training.workout(id)`, etc.
  - Dashboard shell refetches via the **dashboard bundle** key, not eight separate subscriptions.
- Updating profile → `queryClient.invalidateQueries({ queryKey: [userId, 'profile'] })`
  - Top-bar readiness, weight indicator, and settings page all refresh

**Surgical invalidation** for high-frequency updates:

- Toggling a supplement → invalidates `supplements.log(date)` and `supplements.compliance(30)` only
- Completing a set → invalidates the specific workout, not all recent workouts

### Data Model Conventions

**Dates are always strings (ISO 8601):**

```typescript
{ date: "2026-04-23", createdAt: "2026-04-23T18:30:00.000Z" }
```

Never `Date` objects, never Firestore `Timestamp`. Converters handle serialization at the Firebase boundary. App logic operates on strings, uses `date-fns` for manipulation, and sorts lexicographically.

**IDs are separate from data:**

```typescript
interface Workout {
  id: string; // Firestore doc ID
  userId: string;
  date: string;
  exercises: Exercise[]; // nested array, not subcollection
}
```

Firestore collections store documents with auto-generated IDs. The service layer attaches the ID to the returned object. Mutations accept `{ id, ...data }` and destructure before writing.

**Nested vs. subcollections:**

- **Nested arrays**: exercises in workouts, meals in nutrition days, supplements in protocols
- **Subcollections**: user-scoped collections under `/users/{userId}/workouts`, `/users/{userId}/phases`
- **Rationale**: Subcollections scale to 10k+ documents. Nested arrays avoid extra queries but are capped at Firestore's 1MB doc limit.

### Why This Matters

Most Firebase apps end up with:

- Components calling `collection().where().get()` inline
- Copy-pasted error handling (`try/catch` with `console.error`)
- Race conditions from duplicate fetches
- No offline support because there's no cache layer
- Impossible to test without a real Firestore instance

IRONMIND demonstrates that a solo developer can implement the same data patterns used by teams at Stripe, Notion, and Linear: **services for logic, controllers for cache orchestration, queries for state management, and zero tolerance for architectural shortcuts**.

The result is a codebase where adding a new feature means:

1. Write a service function (tested in isolation)
2. Wrap it in a controller hook (tested with mock QueryClient)
3. Call the hook in a page (just works)

No state management debates, no prop drilling, no "where does this data come from?" archaeology. The architecture is the documentation.
