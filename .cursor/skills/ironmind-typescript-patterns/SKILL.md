---
name: ironmind-typescript-patterns
description: Enforce correct TypeScript patterns in the IRONMIND codebase. Use when writing or editing any TypeScript file — services, controllers, components, types, seed files. Prevents the class of errors found in the audit: duplicate imports, wrong union types, implicit any, unknown ReactNode, broken module references.
---

# IRONMIND TypeScript Patterns

These patterns are derived from real compiler errors found in this codebase. Apply every rule every time.

## Rule 1 — Never duplicate imports

Each identifier may only be imported once per file.

```ts
// ❌ WRONG — causes TS2300 Duplicate identifier
import type { ExportOptions } from '@/lib/types';
import type { ExportOptions } from '@/lib/types';

// ✅ CORRECT
import type { ExportOptions } from '@/lib/types';
```

## Rule 2 — Import from the correct module path

Always verify that the exported member exists in the target module.

| Wrong import                               | Correct import                                             |
| ------------------------------------------ | ---------------------------------------------------------- |
| `getDocuments` from `@/lib/firebase`       | `getAllDocuments` from `@/lib/firebase`                    |
| `queryClient` from `@tanstack/react-query` | `QueryClient` (class) or shared instance                   |
| `./types` in `src/lib/seed/`               | Define the interface inline or in `src/lib/types/index.ts` |

Before adding an import, confirm the export exists:

```bash
# Quick check
grep -n "export" src/lib/firebase/firestore.ts | grep "function"
```

## Rule 3 — Always type Firestore query constraints as `QueryConstraint[]`

`QueryConstraint` is the common base type for `where()`, `orderBy()`, `limit()`, `startAfter()`, etc. Never use a specific subtype for an array that will hold mixed constraints.

```ts
// ❌ WRONG — TS2345 when you push a `where()` or `limit()` into it
const constraints: QueryOrderByConstraint[] = [];
constraints.push(where('userId', '==', userId)); // type error

// ✅ CORRECT
import type { QueryConstraint } from 'firebase/firestore';
const constraints: QueryConstraint[] = [];
constraints.push(where('userId', '==', userId));
constraints.push(orderBy('createdAt', 'desc'));
constraints.push(limit(50));
```

## Rule 4 — Keep `SmartAlert.type` in sync

The `SmartAlert.type` union is defined in `src/lib/types/index.ts`. The only valid values are:

```ts
type: 'spillover' | 'fatigue' | 'calorie_emergency' | 'pelvic_comfort' | 'progression' | 'info';
```

**`'info'` IS in the union** (added after audit). Never assign a string literal to `SmartAlert.type` that is not in this list. When adding a new alert category:

1. Add the literal to the union in `src/lib/types/index.ts` first
2. Then use it in `alerts.service.ts`

## Rule 5 — Explicit return types on service functions

All functions in `src/services/` must have explicit return types.

```ts
// ❌ WRONG — implicit return type
export async function getProfile(userId: string) {
  return getDocument<AthleteProfile>(...);
}

// ✅ CORRECT
export async function getProfile(userId: string): Promise<AthleteProfile | null> {
  return getDocument<AthleteProfile>(...);
}
```

## Rule 6 — Type ReactNode imports explicitly

When using `React.ReactNode` or `ReactNode` in props, import it directly.

```ts
// ❌ WRONG in some tsconfig modes
type CardProps = { children: React.ReactNode }; // React namespace not imported

// ✅ CORRECT
import type { ReactNode } from 'react';
type CardProps = { children: ReactNode };
```

## Rule 7 — No implicit `any` — always type callback parameters

```ts
// ❌ WRONG — TS7006 implicit any
items.map((muscle) => muscle.name);

// ✅ CORRECT
items.map((muscle: VolumeSummaryItem) => muscle.name);
// or use inference via properly typed arrays
const items: VolumeSummaryItem[] = weeklyVolume;
items.map((muscle) => muscle.name); // inferred
```

## Rule 8 — Seed interfaces belong in `src/lib/types/index.ts`

Never create a `./types` file inside `src/lib/seed/`. All shared interfaces go in the central types module.

```ts
// ❌ WRONG — broken in this project, ./types doesn't exist
import type { NutritionPlanSeed } from './types';

// ✅ CORRECT — define directly or import from central types
export interface NutritionPlanSeed { ... }
// OR add to src/lib/types/index.ts and import from there
import type { NutritionPlanSeed } from '@/lib/types';
```

## Rule 9 — Verify seed orchestrator after adding seed data

When a new seed file is created (e.g. `seed/nutrition.ts`), it MUST be:

1. Imported in `src/lib/seed/index.ts`
2. Called inside `seedUserData()`
3. Its data written to Firestore via the appropriate service

Seed data that is defined but not called is dead code and will result in empty pages on first login.

```ts
// Checklist for src/lib/seed/index.ts:
// ✅ morganProfile          → updateProfile()
// ✅ morganProgram          → createProgram() + setActiveProgram()
// ✅ morganSupplementProtocol → saveProtocol()
// ✅ morganInitialPhase     → createPhase() + setActivePhase()
// ✅ morganVolumeLandmarks  → updateVolumeLandmarks()
// ✅ morganInitialNotes     → createJournalEntry() (loop)
// ✅ morganNutritionPlan    → saveNutritionDay() — ADD THIS
```

## Rule 10 — Run the CI chain before committing

Always verify the full pipeline before marking work as done:

```bash
cd /home/morgan/Desktop/Coach/ironmind
npm run ci                  # lint + typecheck + build — matches GitHub Actions
```

If the `ci` script is not yet present in `package.json` (see `.cursor/plans/DEVOPS_CONTROL_CENTER.md` task 4.1), run each stage individually:

```bash
npm run lint                # eslint . --max-warnings=0
npx tsc --noEmit            # type check
npm run build               # production build
```

Zero errors, zero warnings is the only acceptable state. The pre-commit hook (`simple-git-hooks` + `lint-staged`, task 4.5) auto-fixes lint on staged files, but does not run `tsc` — always run typecheck manually when making type changes.
