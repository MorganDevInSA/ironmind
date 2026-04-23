---
name: ironmind-data-layer
description: Enforce the IRONMIND three-layer data architecture (Pages → Controllers → Services → Firebase). Use when adding new features, writing new pages, creating services or controllers, implementing mutations, or building any data-driven UI. Prevents architecture violations, missing wiring, dead services, and incomplete features.
---

# IRONMIND Data Layer Architecture

**Principal hardening checklist:** [`Documentation/PRINCIPAL-REVIEW-DATA-2026-04-23.md`](../../Documentation/PRINCIPAL-REVIEW-DATA-2026-04-23.md) — keep implementation status in sync when changing transactions, indexes, import semantics, or dashboard reads.

## The Three Layers — Never Skip

```
Pages / Components
      ↓  (hooks only)
Controllers  src/controllers/use-*.ts   (TanStack Query)
      ↓  (function calls)
Services     src/services/*.service.ts  (domain logic)
      ↓  (helpers only)
Firebase     src/lib/firebase/          (SDK wrappers)
```

**Hard rules:**

- Pages call **controllers only** — never services, never Firebase directly
- Controllers call **services only** — never Firebase directly
- Services call **`src/lib/firebase/` helpers only** — never raw Firebase SDK

---

## Controller Template

Every new feature domain needs a controller hook following this pattern:

```ts
// src/controllers/use-[domain].ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import { staleTimes } from '@/lib/constants/stale-times';
import { useAuthStore } from '@/stores';
import { getDomainData, saveDomainData } from '@/services/[domain].service';
import { onMutationError } from '@/controllers/_shared/on-error';

export function useDomainData() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  return useQuery({
    queryKey: queryKeys.domain.detail(userId),
    queryFn: () => getDomainData(userId),
    enabled: !!userId,
    staleTime: staleTimes.domain,
  });
}

export function useSaveDomainData() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  return useMutation({
    mutationFn: (data: DomainData) => saveDomainData(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domain.all(userId) });
    },
    onError: onMutationError,
  });
}
```

---

## Query Key Factory Rules

All query keys live in **`src/lib/constants/query-keys.ts`**. IRONMIND namespaces by **domain**, not duplicate `uid` inside every segment (auth-gated reads still pass `userId` into service calls).

Illustrative excerpt — match **actual** factories when editing:

```ts
export const queryKeys = {
  recovery: {
    all: ['recovery'] as const,
    entry: (date: string) => [...queryKeys.recovery.all, 'entry', date] as const,
    trend: (days: number) => [...queryKeys.recovery.all, 'trend', days] as const,
    latest: () => [...queryKeys.recovery.all, 'latest'] as const,
  },
  physique: {
    all: ['physique'] as const,
    checkIns: () => [...queryKeys.physique.all, 'check-ins'] as const,
    // ...
  },
  // profile, training, nutrition, supplements, coaching, volume, alerts, export …
} as const;
```

When invalidating after a mutation:

- Invalidate the **specific** document key (e.g. `queryKeys.recovery.entry(date)`).
- Invalidate any **derived** lists (`queryKeys.recovery.latest()`, trend queries) when the mutation changes “most recent” or aggregates.
- `invalidateQueries({ queryKey: queryKeys.recovery.all })` matches every key **starting with** `['recovery']` (TanStack Query prefix semantics).

---

## Composite dashboard reads

**`useDashboardData`** (`src/controllers/use-dashboard.ts`) uses a **single** `useQuery` over `getDashboardBundle` (`dashboard.service.ts`): profile, active program, **calendar-day** nutrition/recovery/supplements for the bundle’s `calendarDate` argument (call site uses **today**), **`latestRecovery`** when that day has no entry, weekly volume, and alerts — one cache key `queryKeys(userId).dashboard.bundle(todayStr)`. **`invalidateDashboardBundle`** (`invalidate-dashboard.ts`) invalidates that key **and** `queryKeys(userId).alerts.all` so **`useActiveAlerts`** (layout top bar) stays aligned with bundle-driving mutations. You can also use `{ queryKey: queryKeys(userId).dashboard.all }` for dashboard-only invalidation when appropriate. New “always show latest X” dashboard metrics should extend the bundle (or add a dedicated `queryKeys.*.latest()` + service) rather than ad-hoc `useQuery` in pages.

**`/dashboard` and the trend day strip:** The page uses the bundle for **profile**, **active program**, **weekly volume**, and loading gate. For the **selected calendar date** in the trend strip (`selectedTrendDate`), it **also** composes **`useNutritionDay(userId, date)`**, **`useRecoveryEntry(userId, date)`**, and **`useSupplementLog(userId, date)`** so schedule + macro/recovery/supplement cards track the strip (same services/controllers as domain pages). **`useRecentWorkouts` / `useWorkouts`** supply the trend window for charts and the selected day’s workout row. Do not fold arbitrary per-date UI into the bundle query key unless product requires a single cache entry — prefer these existing per-day keys so mutations invalidate the right documents.

**Top bar alert dismiss is client-only:** `TopBar` may **hide** individual alerts for the current browser session (e.g. `sessionStorage` keyed by user) without writing Firestore. That does **not** require invalidating `useActiveAlerts` or the dashboard bundle — the server-derived list is unchanged until underlying data fixes the condition.

**Volume rollup:** `getWeeklyVolumeSummary` reads/writes **`weeklyVolumeRollups/{weekStart}`** (`volume.service.ts`). After **workout** writes, controllers call **`deleteCurrentWeekVolumeRollup`** (via `use-training`) so the next summary recomputes; **`invalidatePostImportDomains`** also clears the current week rollup.

**Import / seed jobs:** Coach import uses **`importJobs`** + **`import-compensation.ts`** (snapshots + LIFO rollback) and **`import-firestore-batch.ts`** for Firestore **`writeBatch`** groupings (profile + protocol + landmarks; nutrition plan + day + journal; first-only program/phase fast paths). First-login **`seedUserData`** uses **`seedJobs`** and the same rollback helpers; return type **`SeedUserDataResult`**. Extend those flows with new artifacts if you add post-write steps.

**Multi-active repair:** **`repairMultipleActivePrograms`** / **`repairMultipleActivePhases`** in training/coaching — idempotent, **not** auto-run; wire from support or Settings when needed. **`getActiveAlerts`** has an input catalog table at the top of **`alerts.service.ts`** — update when adding alert branches. Derived-field ownership and journal scan limits: **ARCHITECTURE** §8.

---

## Stale Time Configuration

Single source of truth: **`src/lib/constants/stale-times.ts`**. Use the tier that matches how often the user or background logic updates that resource (recovery morning log vs profile edits). When adding a new query, pick an existing bucket or add a named constant there — do not inline magic numbers in hooks without documenting why.

---

## Service Template

```ts
// src/services/[domain].service.ts
import type { DomainType } from '@/lib/types';
import {
  getDocument,
  setDocument,
  addDocument,
  queryDocuments,
  getAllDocuments,
  createConverter,
  where,
  orderBy,
  limit,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import type { QueryConstraint } from 'firebase/firestore';

const converter = createConverter<DomainType>();

export async function getDomainData(userId: string): Promise<DomainType | null> {
  return getDocument<DomainType>(collections.domain(userId), 'data', converter);
}

export async function saveDomainData(userId: string, data: Partial<DomainType>): Promise<void> {
  await setDocument<DomainType>(collections.domain(userId), 'data', data as DomainType, converter);
}

export async function listDomainItems(userId: string, limitCount = 30): Promise<DomainType[]> {
  const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc'), limit(limitCount)];
  return queryDocuments<DomainType>(collections.domain(userId), constraints, converter);
}
```

---

## Seed Orchestrator Checklist

**First-login baseline (`seedUserData`):** New **Morton** domains must be imported in [`src/lib/seed/index.ts`](../../src/lib/seed/index.ts), invoked inside `seedUserData()` with the existing rollback/`seedJobs` pattern, and logged on success (`✓` prefix where the file already uses it).

**Alternate demo personas:** New roster athletes (pattern `name-*.ts`) must still be **imported and called** from `index.ts` via a dedicated **`seed*Data(userId)`** overwrite helper and wired from **`DemoProfileModal`** — not inside `seedUserData()`. **`seedDemoHistoricalData`** orchestrates **`deleteAllCheckIns`**, writes weekly physique from **`src/lib/seed/demo-data/physique/`**, and generates daily telemetry via **`personaTuning`** in **`demo-historical.ts`**. Demo **UI theme** presets live in **`demo-theme.ts`** and apply from **`DemoProfileModal`** + **`DemoThemeSync`**. See **[`ironmind-demo-data`](../ironmind-demo-data/SKILL.md)** and [`Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md`](../../../Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md).

**Nutrition placeholder:** `seedUserData()` saves **today**’s nutrition day as a shell entry — mirror that pattern when adding new first-login domains that need a “today” row.

---

## Alert Service Pattern

When adding a new alert type:

1. Add the type literal to `SmartAlert.type` in `src/lib/types/index.ts`
2. Create the check function in `alerts.service.ts`
3. **Call it inside `getActiveAlerts()`** — this is the most commonly forgotten step

```ts
// src/services/alerts.service.ts

// ✅ Template for a new alert check
async function checkMyNewCondition(
  userId: string,
  context: AlertContext,
): Promise<SmartAlert | null> {
  // Logic here
  if (conditionMet) {
    return {
      id: `my-alert-${Date.now()}`,
      type: 'my-type', // Must exist in SmartAlert.type union first
      severity: 'warning',
      title: 'Alert Title',
      message: 'Alert message',
      actionRequired: false,
    };
  }
  return null;
}

// ✅ ALWAYS add to getActiveAlerts():
export async function getActiveAlerts(userId: string): Promise<SmartAlert[]> {
  const alerts: SmartAlert[] = [];
  const results = await Promise.allSettled([
    checkShoulderSpillover(userId),
    checkDay13Fatigue(userId),
    checkCalorieEmergency(userId),
    checkPelvicComfort(userId),
    checkProgressionDue(userId),
    checkRecoveryIssues(userId), // ← was missing, now added
    checkMyNewCondition(userId), // ← new alerts go here
  ]);
  results.forEach((r) => {
    if (r.status === 'fulfilled' && r.value) alerts.push(r.value);
  });
  return alerts;
}
```

---

## Page Completeness Checklist

Before marking a page as done, verify:

- [ ] Read path: data loads from controller with loading/error states
- [ ] Write path: all form submissions call a mutation hook
- [ ] Empty state: shows when no data exists (not just blank)
- [ ] Error state: shows when query fails
- [ ] Loading state: skeleton or spinner while fetching
- [ ] Mobile layout: tested at 375px width
- [ ] Actions wired: every button has an `onClick` handler
- [ ] Navigation: all internal links point to existing routes

---

## Route inventory (keep in sync when linking)

Major authenticated routes under `src/app/(app)/` include **dashboard**, **training** (`/training`, `/training/workout`, `/training/programs`, `/training/history`, `/training/exercises`), **nutrition**, **supplements**, **recovery**, **physique**, **coaching**, **export**, **settings**. Before adding `href` / `router.push`, confirm **`page.tsx` exists** at that segment (`IRONMIND.md` routing rule).

---

## Mutation Error Handling — Connect to Toast

All mutations must surface errors to the user. When a toast provider exists:

```ts
useMutation({
  mutationFn: ...,
  onSuccess: () => {
    queryClient.invalidateQueries(...);
    toast.success('Saved');
  },
  onError: (error) => {
    console.error(error);
    toast.error('Failed to save. Please try again.');
  },
});
```

Until a toast provider is built, at minimum log to console with a domain prefix:

```ts
onError: (error) => console.error('[supplements] toggle failed:', error),
```
