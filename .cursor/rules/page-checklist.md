# IRONMIND Page Completeness Checklist

Every page must pass this checklist before being marked complete.

---

## Core States

### Loading State

- [ ] Shows themed iOS-style spinner while data loads
- [ ] Uses `.spinner` or `.spinner-lg` class from globals.css
- [ ] Skeleton class exists but prefer `.spinner` for page-level loading
- [ ] Does not flash (min 200ms display if data loads quickly)

### Error State

- [ ] Shows visible error message when query fails
- [ ] Includes actionable recovery (retry button, contact support)
- [ ] Does not show a blank screen or crash
- [ ] Error is styled consistently (use `.glass-panel` with `--bad` accent)

### Empty State

- [ ] Shows meaningful message when no data exists
- [ ] Not a blank div
- [ ] Includes guidance or CTA ("Add your first workout")
- [ ] Uses muted icon + text pattern

---

## Interactivity

### Buttons & Actions

- [ ] All buttons have `onClick` handlers
- [ ] Destructive actions have confirmation
- [ ] Submit buttons show loading state during mutation
- [ ] Disabled states are visually distinct

### Forms

- [ ] All inputs have labels (visible or aria-label)
- [ ] Validation errors display inline
- [ ] Required fields are marked
- [ ] Form submits on Enter key (where appropriate)
- [ ] Success feedback after submit (toast or redirect)
- [ ] Themed `<select>` controls (e.g. Nutrition meal plan-line): use `.nutrition-meal-select` and
      token borders/focus rings; ensure the controlled `value` reflects saved state (saved line
      or explicit default), not a label that overwrites user choice

### Accordion Panels

- [ ] Expandable panels use `.accordion-wrapper` with `data-open` attribute
- [ ] Content wrapped in `.accordion-inner` for overflow + opacity transition
- [ ] Mutual exclusion handled by single `useState<string | null>` — only one panel open at a time
- [ ] Never use `{isOpen && ...}` conditional rendering for expandable content — always render the accordion wrapper

### Navigation

- [ ] All `<Link>` and `router.push()` point to existing routes
- [ ] No 404 links
- [ ] Back navigation works as expected
- [ ] Active state shown in nav

### Dashboard — trend day strip (`/dashboard`)

- [ ] Changing the selected date updates **session**, **schedule row** (meals / vitamins / activity from logs), **nutrition**, **recovery**, and **supplements** for that date — use **`useNutritionDay`**, **`useRecoveryEntry`**, **`useSupplementLog`** keyed by selection, not only **`useDashboardData`**’s today bundle fields
- [ ] **Start workout** / primary logging CTAs remain gated to **calendar today** when product requires it

### Shell — alerts bell (`TopBar`)

- [ ] Alert list rows are keyboard-accessible (`<button>` or equivalent) with clear dismiss behavior
- [ ] Dismissing an alert removes it from the **visible** list without implying server-side deletion (computed alerts refetch unchanged until conditions change)
- [ ] Bell reflects **active** (non-dismissed) count; when count is zero, bell styling is **muted** vs “has alerts” state
- [ ] Count badge stays readable at small size (`font-mono tabular-nums`, sufficient contrast)

---

## Responsive Design

### Mobile (375px)

- [ ] Content readable without horizontal scroll
- [ ] Touch targets ≥ 44×44px
- [ ] No overlapping elements
- [ ] Bottom nav visible and functional
- [ ] Forms are usable with mobile keyboard

### Tablet (768px)

- [ ] Layout adjusts appropriately (2-column where sensible)
- [ ] No wasted whitespace or cramped content

### Desktop (1280px+)

- [ ] Content doesn't stretch edge-to-edge on ultrawide
- [ ] `max-width` applied where appropriate
- [ ] Sidebar visible and functional

---

## Data Display

### Numbers

- [ ] All numeric values use `font-mono tabular-nums`
- [ ] Proper formatting (thousands separators, decimal places)
- [ ] Units labeled clearly

### Tables

- [ ] Header row visually distinct
- [ ] Row hover state
- [ ] Responsive behavior (horizontal scroll or card view on mobile)
- [ ] Empty table state

### Physique — History (`/physique`)

- [ ] History uses a **wide** `.data-table` inside **`overflow-x-auto`** so tape + scale columns remain usable on mobile
- [ ] **First column (date) sticky** on horizontal scroll with opaque background so labels do not bleed through
- [ ] Each tape / scale cell shows **two lines**: absolute value (cm or kg), then **Δ** vs the **next older** check-in (accent when non-zero; muted when zero or unavailable)
- [ ] Copy above the table explains units (cm, kg) and that the list is **newest first**

### Charts

- [ ] Axis labels present and readable
- [ ] Tooltip shows value on hover
- [ ] Legend present if multiple series
- [ ] Loading state while data fetches

---

## Performance

### Data Fetching

- [ ] Uses TanStack Query through controller hooks
- [ ] Appropriate `staleTime` from `stale-times.ts`
- [ ] No redundant fetches
- [ ] Mutations invalidate correct query keys

### Bundle

- [ ] No unnecessary large imports
- [ ] Dynamic imports for heavy components (charts, modals)
- [ ] Images optimized

---

## Accessibility

### Keyboard

- [ ] All interactive elements focusable
- [ ] Focus visible (`:focus-visible` ring)
- [ ] Tab order logical
- [ ] Modal traps focus

### Screen Reader

- [ ] Heading hierarchy (h1 → h2 → h3)
- [ ] Images have alt text (or `aria-hidden` if decorative)
- [ ] Buttons have accessible names
- [ ] Dynamic content announced (`aria-live`)

### Color

- [ ] Contrast ≥ 4.5:1 for text
- [ ] Information not conveyed by color alone
- [ ] Focus states visible

---

## Quick Verification Commands

```bash
# Full CI chain (matches GitHub Actions verify job)
npm run ci                    # lint + typecheck + build

# Individual stages
npm run lint                  # eslint . --max-warnings=0
npx tsc --noEmit              # type check
npm run build                 # production build

# Mobile preview (if using dev tools)
# Chrome DevTools → Toggle device toolbar → iPhone SE (375px)

# Firebase emulators (for testing rules changes)
npm run emulators             # firestore :8080, storage :9199, UI :4000
```

For deploy-adjacent changes (rules, indexes, env vars, MCP config): see `.cursor/skills/ironmind-cicd/SKILL.md` and tick the matching item in `.cursor/plans/DEVOPS_CONTROL_CENTER.md`.

---

## Template: Loading/Error/Empty Pattern

```tsx
export default function MyPage() {
  const { data, isLoading, error } = useMyData();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-[color:var(--bad)] mb-4">Failed to load data</p>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <div className="text-[color:var(--text-2)] mb-2">
          <EmptyIcon className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-[color:var(--text-1)] mb-4">No data yet</p>
        <Link href="/add" className="btn-primary">
          Add First Entry
        </Link>
      </div>
    );
  }

  return <div>{/* Render data */}</div>;
}
```
