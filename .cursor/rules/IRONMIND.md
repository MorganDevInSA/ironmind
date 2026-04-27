# IRONMIND — Cursor Agent Rules

These rules are enforced on every edit in this project. No exceptions.

---

## Project Identity

**IRONMIND** is a premium elite bodybuilding performance system for a solo self-coaching athlete (Morgan).

**Stack**: Next.js 14 (App Router) · TypeScript strict · Tailwind CSS v3 · shadcn/ui · Firebase (Auth + Firestore + Storage) · TanStack Query · Zustand · Framer Motion · Recharts · Lucide Icons.

**Themes**: **Crimson** (default), **Hot Pink**, **Cobalt**, **Forge**, **Emerald**, **Violet**, plus **Custom** (user-chosen hex via `tinycolor2` in `ThemeSync`). Presets map to `html[data-theme="…"]` blocks in `globals.css`; all accent colors use CSS variables for theme support. **Demo profiles:** `src/lib/seed/demo-theme.ts` maps profile id → preset (e.g. Fez → cobalt, Maria → violet); `DemoProfileModal` applies it after `seed*Data` succeeds, and `DemoThemeSync` reapplies on load when `clientName` matches a demo athlete. See `Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md` §13.

---

## Rule Index

This project's rules are split into focused files. Read the relevant file when working in that area.

| File                                         | Contents                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| **[architecture.md](./architecture.md)**     | Three-layer data architecture, import rules, Firebase patterns, TypeScript policy     |
| **[tokens.md](./tokens.md)**                 | Full color palette, typography scale, spacing, shadows, theme system                  |
| **[page-checklist.md](./page-checklist.md)** | Loading/error/empty states, mobile testing, accessibility, QA + verification commands |

For CI/CD, deployment, environment, and MCP work, see `.cursor/skills/ironmind-cicd/SKILL.md` and `.cursor/plans/DEVOPS_CONTROL_CENTER.md` — infra is never edited via dashboards; always through committed config.

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
- **Program cycle anchor:** `Program.startDate` (ISO `yyyy-MM-dd`) is the calendar day for **cycle day 1**; `getCycleDay` / session pickers use it everywhere. Athletes set it from **dashboard** (`ProgramCycleStartControl`) and **training** via **`useUpdateProgram`**. Dashboard **trend week presets (1–4 wk)** extend **forward** from that anchor (not backward from today); preset workouts use **`useWorkouts`** over the computed `[from, to]` range.
- **Coach JSON import:** Valid `startDate` on `training_program.json` / `phase.json` (`YYYY-MM-DD`) is preserved on import when present (`import.service.ts`); otherwise today is used.
- Native `<input type="checkbox">` and `<input type="radio">` are globally themed via `accent-color: var(--accent)` in globals.css
- Nutrition meal plan-line `<select>`: use `.nutrition-meal-select` (see `globals.css`) and keep controlled values in sync with saved `planLine` (do not replace user-selected preset lines with the slot default in UI state)
- Progress visuals (bars/sliders) must use **filled-only accent gradients** and neutral empty tracks
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
- Stacked LED readiness/target indicators in the top bar (indicator-specific hover/focus detail panels)
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

### Collapsed sidebar navigation (desktop rail)

- **Decorative peeks** (title + one-line hint beside icons): keep them **`aria-hidden`**; put the combined name on the **`aria-label`** of each nav **`Link`** when the rail is collapsed only (when labels are visible, let visible text be the name).
- **Implementation:** render those peeks with **`createPortal(..., document.body)`** and **`position: fixed`** from **`getBoundingClientRect()`** — not `absolute`/`left-full` inside **`aside`** or **`nav`**. Reasons: (1) in `(app)/layout.tsx` the **main column follows the sidebar in DOM order** and can **paint over** flyouts that extend past the narrow rail; (2) **`overflow-y: auto`** on `nav` forces effective **horizontal clipping** of outward tooltips per CSS overflow rules.
- **Shared shell + size:** **`PEEK_CAPTION_PANEL_SKIN`** (`peek-caption.ts`) for fill/blur/shadow/padding; **`.sidebar-rail-peek-panel`** / **`.plan-day-strip-peek-panel`** in `globals.css` for **216px** lock, **centered** copy, intrinsic height, and **theme border** (**2px** `color-mix(in srgb, var(--accent) 62%, transparent)` — same as `.nav-item.active`; define border in CSS, not Tailwind arbitrary utilities on the peek). **Plan-by-day** uses **`plan-by-day-strip-peek-panel`** + same skin.
- **Expand/collapse control:** icon-only **`aria-label`** (`Expand sidebar` / `Collapse sidebar`) is enough; avoid a second decorative hover flyout on that control (it competed with nav peeks and the same z-index band).

### Brand logo (`IronmindLogo`)

- **Sidebar rail** (expanded + collapsed) **and sticky top bar** (desktop + mobile header): **`brandAssets.logoCombined`** — same landscape lockup as **`/login`**, not the theme male/female shield PNGs.
- **Register** (`variant="auth"`): **`logoMale`** / **`logoFemale`** by theme (**`hot-pink`** → female).
- **Sizing** is centralized in **`src/components/brand/ironmind-logo.tsx`** (Tailwind max height/width caps + **`next/image` `sizes`**). When changing footprint, update that file and keep **`Documentation/LOGO-BRIEF.md`**, **`Documentation/STYLE-GUIDE.md`** §6, and **`Documentation/ARCHITECTURE.md`** §13.6 aligned.
- **Object fit:** **`object-contain object-center`** only — do not mix conflicting **`object-*`** utilities (Tailwind applies one axis; wrong combos can frame empty canvas). Full inventory: **`Documentation/LOGO-BRIEF.md`**.

---

## Skills Reference

When working on specific areas, read and apply the relevant skill:

| Skill                          | When to Use                                                                                               |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `ironmind-typescript-patterns` | TypeScript errors, imports, type definitions                                                              |
| `ironmind-firebase-patterns`   | Firestore operations, queries, auth, storage                                                              |
| `ironmind-data-layer`          | Controllers, services, query keys, mutations, seed data                                                   |
| `ironmind-styling`             | Buttons, cards, badges, typography, component recipes                                                     |
| `ironmind-visual-persona`      | Brand identity, color psychology, forbidden elements                                                      |
| `ironmind-animations`          | Motion, hover effects, loading states, transitions                                                        |
| `ironmind-states`              | Skeleton loaders, error cards, empty state patterns                                                       |
| `ironmind-a11y`                | Focus rings, keyboard navigation, ARIA, screen readers                                                    |
| `ironmind-cicd`                | Deployment, Vercel/Firebase CLI, CI workflows, env vars, MCP, rollback, observability, rules/index deploy |

---

## Quick Checks

Before marking any work complete:

```bash
# Full CI chain (mirrors GitHub Actions `verify` job)
npm run ci                  # runs lint + typecheck + build

# Individual stages if ci script is not yet in package.json
npm run lint                # eslint . --max-warnings=0
npx tsc --noEmit            # type check
npm run build               # production build

# Mobile test
# Chrome DevTools → Device toolbar → 375px width
```

Verify:

- [ ] `npm run ci` passes locally (or all three stages above if ci script is pending)
- [ ] Loading state exists
- [ ] Error state exists
- [ ] Empty state exists (not blank)
- [ ] All links point to existing routes
- [ ] All buttons have handlers
- [ ] Mobile layout works at 375px
- [ ] Chart axis ticks are readable and use valid token values (`var(--text-2)`, not invalid CSS strings)
- [ ] Multi-series charts only render legends/lines for series with actual data

For any infrastructure/deploy change, also verify:

- [ ] Change is in a committed file (`vercel.ts`, `firestore.rules`, `.github/workflows/*.yml`) — never a dashboard-only edit
- [ ] If it's a tracked task in `.cursor/plans/DEVOPS_CONTROL_CENTER.md`, tick the box and note the outcome
- [ ] Secrets stay in Vercel env vars / GitHub Secrets — never in the repo
