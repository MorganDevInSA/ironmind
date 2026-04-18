# IRONMIND — Cursor Agent Rules

These rules are enforced on every edit in this project. No exceptions.

---

## Project Identity

**IRONMIND** is a premium elite bodybuilding performance system for a solo self-coaching athlete (Morgan). Stack: Next.js 14 (App Router) · TypeScript strict · Tailwind CSS v3 · shadcn/ui · Firebase (Auth + Firestore + Storage) · TanStack Query · Zustand · Framer Motion · Recharts · Lucide Icons.

---

## Architecture — Non-Negotiable

```
Pages/Components  →  Controllers (use-*.ts)  →  Services (*.service.ts)  →  lib/firebase/
```

1. **Pages call controllers only** — never `import` from `@/services` or `firebase/*` directly in a page or component
2. **Controllers use TanStack Query** — every read is `useQuery`, every write is `useMutation`
3. **Services call lib/firebase helpers only** — never call raw Firebase SDK in services
4. **All date fields are `string` (ISO)** — Firestore converter outputs strings, never `Date`

---

## TypeScript — Zero Errors Policy

- Run `npx tsc --noEmit` after every substantive change. Zero errors required.
- Never use `as any` or `// @ts-ignore` to silence errors
- All service functions have explicit return types
- Query constraints are always typed as `QueryConstraint[]` (never `QueryOrderByConstraint[]`)
- Imports are single — never duplicate an identifier import

---

## Firebase — Exact Names

| Use this | Not this |
|----------|----------|
| `getAllDocuments` | `getDocuments` ❌ |
| `getDocument` | `getDocuments` ❌ |
| `QueryConstraint[]` | `QueryOrderByConstraint[]` ❌ |
| `collections.profiles(uid)` | `'users/${uid}/profile'` ❌ |

---

## `SmartAlert.type` — Valid values only

```
'spillover' | 'fatigue' | 'calorie_emergency' | 'pelvic_comfort' | 'progression' | 'info'
```

If a new alert type is needed, add it to the union in `src/lib/types/index.ts` first.

---

## Seed Data — Completeness Rule

When any `src/lib/seed/*.ts` file is created or modified:
- Its data MUST be imported into `src/lib/seed/index.ts`
- Its data MUST be called inside `seedUserData()`
- Success must be `console.log`'d with a ✓ prefix
- **Nutrition** is seeded via `saveNutritionDay()` (today’s date as a moderate-day placeholder); new domains must follow the same orchestrator pattern

## Firestore Writes — No `undefined`

Firestore rejects **`undefined`** field values. Partial writes must **omit** absent fields (build objects without `undefined`, or strip recursively before `setDocument`) — see `physique.service.ts` (`stripUndefinedDeep`) as the reference pattern for nested payloads.

---

## Alert Service — Dead Code Prevention

Every function in `alerts.service.ts` named `check*` MUST be called inside `getActiveAlerts()`. No check function may exist that is not in the `Promise.allSettled([...])` array.

---

## Routing — No 404 Links

Never add a `<Link href="/some/path">` or `router.push('/some/path')` without a corresponding `src/app/(app)/some/path/page.tsx`. Check routes exist before linking.

---

## CSS — Import Order

The Google Fonts `@import` in `globals.css` MUST be the first line (before `@tailwind` directives). PostCSS requires it.

---

## Mobile Nav — Positioning

The active indicator in `mobile-nav.tsx` uses `absolute` positioning. Its parent `Link` must have `relative` for the indicator to anchor correctly.

---

## Design System — Token Hierarchy

Always use these tokens, in this priority:

1. **CSS variables** from `globals.css` (e.g. `var(--crimson)`, `var(--text-0)`)
2. **Tailwind tokens** from `tailwind.config.js` (e.g. `text-text-0`, `bg-bg-2`, `text-crimson`)
3. **Raw hex in brackets** only when a value has no token equivalent

**Color palette — IRONMIND Crimson:**
- Backgrounds: `#080808` · `#0D0D0D` · `#131313`
- Panel bg: `rgba(18, 14, 14, 0.78)` — warm-dark, not blue-tinted
- Panel border: `rgba(65, 50, 50, 0.40)` — warm grey
- Text: `#F0F0F0` · `#9A9A9A` · `#5E5E5E` — **neutral grey, no blue tint**
- Accent: `#DC2626` (crimson) — replaces ALL previous gold and blue
- Success: `#22C55E` — kept for completion/progress
- Warn: `#F59E0B` — kept for caution states
- Error/Bad: `#EF4444` — bright red for danger

**App chrome** (header, sidebar, mobile bottom nav) — use **`globals.css`** variables, not flat neutral greys:
- `--chrome-bg` — sidebar & mobile nav bar (`#0D0D0D`, aligned with `--bg-1`)
- `--chrome-bg-topbar` — sticky top bar (**same as `--chrome-bg`** — unified shade with the sidebar)
- `--chrome-bg-toggle` — sidebar collapse control (`#080808`, aligned with `--bg-0`)
- Muted labels and chrome icons: `var(--text-1)` / `var(--text-2)`; hover to `var(--text-0)`. **Do not** use `#2e2e2e`-style cool grey bars or ad-hoc `#6B6B6B` / `#8A8A8A` in chrome.

**Forbidden old tokens** (replace on sight):
- Any `#D4AF37` / `#F4D03F` / `#B8860B` (old gold) → `#DC2626` / `#EF4444` / `#991B1B`
- Any `#3B82F6` / `#2A6CFF` (old blue) → `#DC2626` / `#B91C1C`
- Any `#B8C6DE` / `#7F91AD` (old blue-grey text) → `#9A9A9A` / `#6B6B6B`
- `rgba(212, 175, 55, ...)` → `rgba(220, 38, 38, ...)`
- `rgba(59, 130, 246, ...)` → `rgba(220, 38, 38, ...)`
- `rgba(80, 96, 128, ...)` → `rgba(65, 50, 50, ...)`
- `rgba(16, 22, 34, ...)` → `rgba(18, 14, 14, ...)`
- `bg-surface` → `bg-bg-2`
- `text-accent` → `text-[#DC2626]`
- `text-text-secondary` → `text-text-1`
- `text-foreground` → `text-text-0`

---

## Numbers Are Monospace

Every numeric data value in the UI uses `font-mono tabular-nums`. No exceptions.

---

## App Chrome (Header, Sidebar, Mobile Nav)

Implementation lives in **`src/components/layout/top-bar.tsx`**, **`sidebar.tsx`**, and **`mobile-nav.tsx`**. Backgrounds use **`bg-[color:var(--chrome-bg)]`** (sidebar, mobile nav) and **`bg-[color:var(--chrome-bg-topbar)]`** (header — same color as `--chrome-bg`); sidebar toggle uses **`var(--chrome-bg-toggle)`**. Secondary chrome copy and idle nav labels use **`text-[color:var(--text-1)]`** (and **`--text-2`** where appropriate), not one-off hex greys. Dropdown dividers in the alerts panel use **warm** `rgba(65, 50, 50, …)` — same rule as panels (`rgba(80, 96, 128, …)` is forbidden).

---

## Dashboard Overview Shell & Exercise List Contrast

- **Overview column:** The main dashboard content uses **`.dashboard-overview`** (`globals.css`) — centered (`max-width` + `margin-inline: auto`), **full border on all sides** (`4px` crimson token), **`border-radius: 1.25rem`**, warm-dark translucent background. Keeps the hub readable on wide screens without hugging the viewport edge (still respects `<main>` padding from the app layout).
- **Exercise row indices:** Use **`.exercise-index-badge`** for ordered lifts — **dark warm tile** (`--exercise-index-bg`) + **`var(--text-0)`** + thin crimson border. **Do not** place mid-grey (`#6B6B6B`–style) numerals on saturated crimson-filled squares (poor contrast).

---

## Crimson Is Precious

`--crimson` (`#DC2626`) is used ONLY for:
- Active nav item text and border
- PR achievements and KPI badges
- CTA / primary buttons
- Phase/milestone badges
- Key interactive elements

Maximum 2–3 crimson elements visible at once per view. Never use crimson for body text or decorative elements.

---

## Page Completeness Before Marking Done

Every page must have:
- [ ] Loading state (skeleton or spinner)
- [ ] Error state (visible message)
- [ ] Empty state (not a blank div)
- [ ] All buttons have `onClick` handlers
- [ ] All links point to existing routes
- [ ] Mobile layout tested at 375px

---

## Skills Reference

When working on specific areas, read and apply:

- `ironmind-typescript-patterns` — TypeScript correctness, imports, types
- `ironmind-firebase-patterns` — Firestore helpers, query constraints, auth, write sanitization
- `ironmind-data-layer` — Controller/service structure, `queryKeys`, composite hooks (`useDashboardData`), mutations, seed
- `ironmind-styling` — Buttons, cards, badges, typography
- `ironmind-visual-persona` — Brand identity, color usage, forbidden elements
- `ironmind-animations` — Motion, hover effects, loading states (prefer crimson tokens over legacy gold/blue snippets)
