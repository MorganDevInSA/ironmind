# IRONMIND Architecture Rules

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

### Hard Rules

1. **Pages call controllers only** — never `import` from `@/services` or `firebase/*` directly in a page or component
2. **Controllers use TanStack Query** — every read is `useQuery`, every write is `useMutation`
3. **Services call lib/firebase helpers only** — never call raw Firebase SDK in services
4. **All date fields are `string` (ISO)** — Firestore converter outputs strings, never `Date`

### Allowed Exceptions

**Controllers may import service functions directly in these cases:**

1. **use-import.ts** — imports `importCoachData`, `seedUserData` to wrap as mutations
2. **auth-guard.tsx** — may call `isUserSeeded` via `queryClient.fetchQuery` (already wrapped in TanStack Query)

**Pages/Components may import seed/import utilities:**

1. **Onboarding components** — may import `parseAndValidateFiles` for client-side validation before sending data to a controller

> All other Firebase/service imports in components must go through controllers.

### Program / phase `startDate`

- **Firestore:** `Program.startDate` is the persisted anchor for rotating **`dayNumber`** → calendar mapping (`src/lib/utils/cycle.ts` + consumers).
- **Coach import:** `importCoachData` keeps a valid ISO **`YYYY-MM-DD`** from `training_program.json` / `phase.json` when provided; invalid or missing values fall back to import-day (`calendarDateOr` in `import.service.ts`).
- **UI writes:** `useUpdateProgram` (`src/controllers/use-training.ts`) patches `startDate` and invalidates training + dashboard bundle queries.

---

## Import Rules

### Single Imports Only

Each identifier may only be imported once per file:

```ts
// ❌ WRONG — causes TS2300 Duplicate identifier
import type { ExportOptions } from '@/lib/types';
import type { ExportOptions } from '@/lib/types';

// ✅ CORRECT
import type { ExportOptions } from '@/lib/types';
```

### Correct Module Paths

| Wrong import                               | Correct import                               |
| ------------------------------------------ | -------------------------------------------- |
| `getDocuments` from `@/lib/firebase`       | `getAllDocuments` from `@/lib/firebase`      |
| `queryClient` from `@tanstack/react-query` | `QueryClient` (class) or shared instance     |
| `./types` in `src/lib/seed/`               | Define inline or in `src/lib/types/index.ts` |

---

## Firebase Function Names

Use EXACTLY these names from `src/lib/firebase/firestore.ts`:

| Function             | Signature                           | Use for                 |
| -------------------- | ----------------------------------- | ----------------------- |
| `getDocument<T>`     | `(path, docId, converter?)`         | Fetch single doc        |
| `setDocument<T>`     | `(path, docId, data, converter?)`   | Create or merge doc     |
| `updateDocument<T>`  | `(path, docId, data)`               | Partial update          |
| `addDocument<T>`     | `(path, data, converter?)`          | Add with auto-ID        |
| `deleteDocument`     | `(path, docId)`                     | Delete doc              |
| `queryDocuments<T>`  | `(path, constraints[], converter?)` | Query with filters      |
| `getAllDocuments<T>` | `(path, converter?)`                | Fetch entire collection |

> ⚠️ `getDocuments` does NOT exist. Use `getAllDocuments`.

---

## Query Constraints

Always type as `QueryConstraint[]`:

```ts
// ❌ WRONG — TS2345 when mixing constraint types
const constraints: QueryOrderByConstraint[] = [];

// ✅ CORRECT
import type { QueryConstraint } from 'firebase/firestore';
const constraints: QueryConstraint[] = [
  where('userId', '==', userId),
  orderBy('createdAt', 'desc'),
  limit(50),
];
```

---

## Collection Paths

Always use the `collections` helper from `src/lib/firebase/config.ts`:

```ts
// ✅ CORRECT
await getDocument(collections.profiles(userId), 'data', converter);

// ❌ WRONG — hardcoded paths
await getDocument(`users/${userId}/profile`, 'data', converter);
```

---

## SmartAlert Types

Valid `SmartAlert.type` values (defined in `src/lib/types/index.ts`):

```ts
'spillover' | 'fatigue' | 'calorie_emergency' | 'pelvic_comfort' | 'progression' | 'info';
```

To add a new alert type:

1. Add the literal to the union in `src/lib/types/index.ts` first
2. Then use it in `alerts.service.ts`
3. Call it inside `getActiveAlerts()` — no dead check functions

---

## Firestore Write Rules

### No `undefined` Values

Firestore rejects `undefined` field values. For partial writes:

- Build objects with only defined keys, or
- Strip `undefined` recursively before write

Reference pattern: `stripUndefinedDeep` in `src/services/physique.service.ts`.

### Timestamps → ISO Strings

The Firestore converter automatically converts:

- **Writes**: `Date` → Firestore `Timestamp`
- **Reads**: Firestore `Timestamp` → ISO string

All date/time fields in TypeScript types must be `string`, not `Date`.

---

## Seed Data Rules

When creating or modifying `src/lib/seed/*.ts`:

1. Modules MUST be imported into [`src/lib/seed/index.ts`](../../src/lib/seed/index.ts).
2. **First-login baseline (Morton)** MUST be invoked from `seedUserData()` in that same file. **Alternate demo personas** (Cheri, Alex, Jordan, Fez, Maria, …) MUST be wired through **`seed*Data` overwrite helpers** and the **Demo profile modal** — never orphan modules that are not imported/called.
3. Success paths SHOULD log with `✓` prefix where the file already uses that pattern.

```ts
// Pattern: baseline in seedUserData(); demos in seedCheriData(), seedFezData(), etc.
// Demo historical: demo-historical.ts + demo-data/physique/ (weekly literals) + demo-theme.ts
// See Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md §3–§4, §13.
```

---

## Routing Rules

Never add a link without a corresponding page:

```ts
// Before adding this:
<Link href="/some/path">

// Verify this exists:
src/app/(app)/some/path/page.tsx
```

---

## TypeScript Policy

- Run `npm run ci` (or `npx tsc --noEmit` standalone) after every substantive change
- Zero errors required — CI enforces this with `--max-warnings=0`
- Never use `as any` or `// @ts-ignore`
- All service functions have explicit return types
- Callback parameters must be typed (no implicit `any`)

The `npm run ci` script chains `lint → typecheck → build`, matching the GitHub Actions `verify` job exactly. If any stage fails locally, it will fail in CI — fix before pushing.

---

## Skills Reference

For detailed patterns, read the relevant skill:

| Area                           | Skill                          |
| ------------------------------ | ------------------------------ |
| TypeScript errors              | `ironmind-typescript-patterns` |
| Firebase operations            | `ironmind-firebase-patterns`   |
| Query structure                | `ironmind-data-layer`          |
| Deploy / CI / env / rules push | `ironmind-cicd`                |

For infra changes (Vercel config, GitHub Actions, Firestore rules deploy, env var setup, MCP tooling): read `.cursor/skills/ironmind-cicd/SKILL.md` and `.cursor/plans/DEVOPS_CONTROL_CENTER.md`. Infra changes go through committed files, never dashboard clicks.
