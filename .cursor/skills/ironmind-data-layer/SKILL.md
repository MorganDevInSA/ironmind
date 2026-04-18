---
name: ironmind-data-layer
description: Enforce the IRONMIND three-layer data architecture (Pages → Controllers → Services → Firebase). Use when adding new features, writing new pages, creating services or controllers, implementing mutations, or building any data-driven UI. Prevents architecture violations, missing wiring, dead services, and incomplete features.
---

# IRONMIND Data Layer Architecture

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
    onError: (error) => {
      console.error('[domain] save failed:', error);
      // TODO: wire to toast notification
    },
  });
}
```

---

## Query Key Factory Rules

All query keys are defined in `src/lib/constants/query-keys.ts`. Format:

```ts
// Every domain must have:
domain: {
  all: (uid: string) => ['domain', uid] as const,
  detail: (uid: string) => ['domain', uid, 'detail'] as const,
  list: (uid: string) => ['domain', uid, 'list'] as const,
  byDate: (uid: string, date: string) => ['domain', uid, date] as const,
}
```

When invalidating, use the broadest key needed:
```ts
// Invalidate all queries for a domain after mutation:
queryClient.invalidateQueries({ queryKey: queryKeys.training.all(userId) });

// Invalidate just one document:
queryClient.invalidateQueries({ queryKey: queryKeys.training.detail(userId, workoutId) });
```

---

## Stale Time Configuration

Edit `src/lib/constants/stale-times.ts`. Choose the right tier:

| Data Type | Stale Time | Rationale |
|-----------|-----------|-----------|
| Profile, landmarks | `Infinity` | Rarely changes |
| Active program, phase | `5 * 60_000` (5 min) | Changes between cycles |
| Today's nutrition, recovery | `60_000` (1 min) | User edits frequently |
| Supplement log | `30_000` (30 sec) | Active checklist |
| Workouts, history | `2 * 60_000` (2 min) | Logged once per session |
| Alerts | `60_000` (1 min) | Refresh with new logs |

---

## Service Template

```ts
// src/services/[domain].service.ts
import type { DomainType } from '@/lib/types';
import {
  getDocument, setDocument, addDocument, queryDocuments, getAllDocuments,
  createConverter, where, orderBy, limit,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import type { QueryConstraint } from 'firebase/firestore';

const converter = createConverter<DomainType>();

export async function getDomainData(userId: string): Promise<DomainType | null> {
  return getDocument<DomainType>(collections.domain(userId), 'data', converter);
}

export async function saveDomainData(
  userId: string,
  data: Partial<DomainType>
): Promise<void> {
  await setDocument<DomainType>(
    collections.domain(userId),
    'data',
    data as DomainType,
    converter
  );
}

export async function listDomainItems(
  userId: string,
  limitCount = 30
): Promise<DomainType[]> {
  const constraints: QueryConstraint[] = [
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  ];
  return queryDocuments<DomainType>(collections.domain(userId), constraints, converter);
}
```

---

## Seed Orchestrator Checklist

When adding new seed data, complete ALL of these steps:

```
src/lib/seed/
├── [domain].ts          ← 1. Create the data file
└── index.ts             ← 2. Import it, 3. Call it in seedUserData(), 4. Log success

# In index.ts:
import { morganDomainData } from './[domain]';

export async function seedUserData(userId: string): Promise<boolean> {
  // ...existing seeds...

  // NEW — step 3
  await saveDomainData(userId, morganDomainData);
  console.log('✓ Domain data seeded');
```

The currently MISSING seed call is **nutrition**:
```ts
// ADD to seedUserData() in src/lib/seed/index.ts:
import { saveNutritionDay } from '@/services/nutrition.service';
import { morganNutritionPlan } from './nutrition';

// Inside seedUserData():
await saveNutritionDay(userId, morganNutritionPlan.days[0]);
console.log('✓ Nutrition plan seeded');
```

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
  context: AlertContext
): Promise<SmartAlert | null> {
  // Logic here
  if (conditionMet) {
    return {
      id: `my-alert-${Date.now()}`,
      type: 'my-type',      // Must exist in SmartAlert.type union first
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
    checkRecoveryIssues(userId),  // ← was missing, now added
    checkMyNewCondition(userId),  // ← new alerts go here
  ]);
  results.forEach(r => { if (r.status === 'fulfilled' && r.value) alerts.push(r.value); });
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

## Currently Incomplete Pages (from audit)

| Page | Missing |
|------|---------|
| `recovery/page.tsx` | Full form + trend chart |
| `physique/page.tsx` | Check-in form + photo upload + chart |
| `nutrition/page.tsx` | Meal slot logging (write path) |
| `coaching/page.tsx` | "New Entry" modal + KPI tracker |
| `dashboard/page.tsx` | "Start Workout" + "Log Recovery" navigation |
| `settings/page.tsx` | Profile edit form |

Training sub-routes that must be created:
- `src/app/(app)/training/workout/page.tsx`
- `src/app/(app)/training/programs/page.tsx`
- `src/app/(app)/training/exercises/page.tsx`
- `src/app/(app)/training/history/page.tsx`

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
