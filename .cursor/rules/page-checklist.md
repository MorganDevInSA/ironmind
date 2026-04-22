# IRONMIND Page Completeness Checklist

Every page must pass this checklist before being marked complete.

---

## Core States

### Loading State

- [ ] Shows skeleton or spinner while data loads
- [ ] Skeleton matches the shape of real content
- [ ] Uses `.skeleton` class from globals.css
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

### Navigation

- [ ] All `<Link>` and `router.push()` point to existing routes
- [ ] No 404 links
- [ ] Back navigation works as expected
- [ ] Active state shown in nav

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
# TypeScript errors
npx tsc --noEmit

# Lint errors
npm run lint

# Mobile preview (if using dev tools)
# Chrome DevTools → Toggle device toolbar → iPhone SE (375px)
```

---

## Template: Loading/Error/Empty Pattern

```tsx
export default function MyPage() {
  const { data, isLoading, error } = useMyData();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-8 w-1/3 rounded" />
        <div className="skeleton h-32 rounded-[14px]" />
        <div className="skeleton h-32 rounded-[14px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-[color:var(--bad)] mb-4">
          Failed to load data
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-secondary"
        >
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
        <p className="text-[color:var(--text-1)] mb-4">
          No data yet
        </p>
        <Link href="/add" className="btn-primary">
          Add First Entry
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Render data */}
    </div>
  );
}
```
