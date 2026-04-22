# IRONMIND — Cursor Agent Rules

These rules are enforced on every edit in this project. No exceptions.

---

## Project Identity

**IRONMIND** is a premium elite bodybuilding performance system for a solo self-coaching athlete (Morgan).

**Stack**: Next.js 14 (App Router) · TypeScript strict · Tailwind CSS v3 · shadcn/ui · Firebase (Auth + Firestore + Storage) · TanStack Query · Zustand · Framer Motion · Recharts · Lucide Icons.

**Themes**: Crimson (default), Hot Pink, Custom (user-chosen hex via tinycolor2) — all accent colors use CSS variables for theme support.

---

## Rule Index

This project's rules are split into focused files. Read the relevant file when working in that area.

| File | Contents |
|------|----------|
| **[architecture.md](./architecture.md)** | Three-layer data architecture, import rules, Firebase patterns, TypeScript policy |
| **[tokens.md](./tokens.md)** | Full color palette, typography scale, spacing, shadows, theme system |
| **[page-checklist.md](./page-checklist.md)** | Loading/error/empty states, mobile testing, accessibility, QA checklist |

---

## Critical Rules (Always Apply)

### Architecture

```
Pages/Components  →  Controllers (use-*.ts)  →  Services (*.service.ts)  →  lib/firebase/
```

- Pages call **controllers only**
- Controllers use **TanStack Query**
- Services call **lib/firebase helpers only**
- All dates are **ISO strings**, not `Date` objects

### TypeScript

- Run `npx tsc --noEmit` after every substantive change
- Zero errors required
- Never use `as any` or `// @ts-ignore`

### Theme-Aware Styling

- Use CSS variables for accent colors: `var(--accent)`, `var(--accent-light)`, `var(--accent-2)`
- Use `color-mix()` for opacity: `color-mix(in srgb, var(--accent) 20%, transparent)`
- Never hardcode accent hex values (`#DC2626`, etc.)
- Native `<input type="checkbox">` and `<input type="radio">` are globally themed via `accent-color: var(--accent)` in globals.css
- NEVER use Tailwind's `text-accent`, `bg-accent`, `border-accent`, `focus:border-accent` utilities — they resolve to hardcoded hex from `tailwind.config.js` and bypass the CSS variable theme system. Use `text-[color:var(--accent)]` etc. instead.

### Numbers Are Monospace

Every numeric data value in the UI uses `font-mono tabular-nums`. No exceptions.

### Crimson Is Precious

`var(--accent)` is used ONLY for:
- Active nav item text and border
- PR achievements and KPI badges
- CTA / primary buttons
- Phase/milestone badges
- Key interactive elements (links, toggles, checkmarks)
- Page h1 titles (branded identity)
- LED readiness/weight indicators in the top bar
- Icons (visual markers, not readable text)
- Micro-labels (step numbers, "Step X of 6" — 10px uppercase metadata)

**Never use accent for readable body text, bold text within paragraphs, section headings inside panels, user names, or informational metadata.** These must use `--text-0` (white) or `--text-1`/`--text-2` (grey) for readability — especially on mobile.

Maximum 2–3 accent elements visible at once per view.

### Interactive Panels

All `.glass-panel`, `.glass-panel-strong`, and `.dashboard-overview` elements have hover/focus-within states:
- Resting: 6% accent border opacity, no glow
- Hover/focus-within: 62% accent border, subtle accent glow
- Transition: border-color 200ms ease-out, box-shadow 300ms ease-out

Expandable content uses the `.accordion-wrapper` + `.accordion-inner` pattern (CSS grid-row animation).
Never use `{isOpen && <div>...</div>}` for expand/collapse — always render the accordion wrapper.

---

## Skills Reference

When working on specific areas, read and apply the relevant skill:

| Skill | When to Use |
|-------|-------------|
| `ironmind-typescript-patterns` | TypeScript errors, imports, type definitions |
| `ironmind-firebase-patterns` | Firestore operations, queries, auth, storage |
| `ironmind-data-layer` | Controllers, services, query keys, mutations, seed data |
| `ironmind-styling` | Buttons, cards, badges, typography, component recipes |
| `ironmind-visual-persona` | Brand identity, color psychology, forbidden elements |
| `ironmind-animations` | Motion, hover effects, loading states, transitions |
| `ironmind-states` | Skeleton loaders, error cards, empty state patterns |
| `ironmind-a11y` | Focus rings, keyboard navigation, ARIA, screen readers |

---

## Quick Checks

Before marking any work complete:

```bash
# TypeScript
npx tsc --noEmit

# Mobile test
# Chrome DevTools → Device toolbar → 375px width
```

Verify:
- [ ] Loading state exists
- [ ] Error state exists  
- [ ] Empty state exists (not blank)
- [ ] All links point to existing routes
- [ ] All buttons have handlers
- [ ] Mobile layout works at 375px
