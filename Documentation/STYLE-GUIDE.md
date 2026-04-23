# IRONMIND Visual Style Guide

This is the current UI reference for contributors. If anything here conflicts with live code, trust:

1. `src/app/globals.css`
2. `tailwind.config.js`
3. `.cursor/rules/IRONMIND.md`

---

## 1) Visual intent

IRONMIND should feel like a disciplined performance war room:

- Warm-black surfaces, sparse crimson accents
- High-contrast data hierarchy
- Strong selected-state feedback
- No blue-tech palette, no glossy esports styling

---

## 2) Core tokens (active)

### Background + text

| Token                  | Value                                                        | Role                                                            |
| ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| `--bg-0`               | `#080808`                                                    | Main canvas                                                     |
| `--bg-1`               | `#0D0D0D`                                                    | Section background                                              |
| `--bg-2`               | `#131313`                                                    | Elevated background                                             |
| `--panel`              | `rgba(18, 14, 14, 0.78)`                                     | Glass panel base                                                |
| `--panel-border`       | `color-mix(in srgb, var(--accent) 6%, transparent)`          | Panel edge (resting)                                            |
| `--panel-border-hover` | `color-mix(in srgb, var(--accent) 62%, transparent)`         | Panel edge (hover/focus-within)                                 |
| `--panel-glow`         | `0 0 14px color-mix(in srgb, var(--accent) 9%, transparent)` | Panel hover glow                                                |
| `--text-0`             | `#F0F0F0`                                                    | Primary text                                                    |
| `--text-1`             | `#9A9A9A`                                                    | Secondary text (theme-tinted on non-default presets and custom) |
| `--text-2`             | `#5E5E5E`                                                    | Labels/meta (theme-tinted on non-default presets and custom)    |

### Accent + status

| Token            | Value     | Role           |
| ---------------- | --------- | -------------- |
| `--accent`       | `#DC2626` | Primary accent |
| `--accent-2`     | `#991B1B` | Dark accent    |
| `--accent-light` | `#EF4444` | Bright accent  |
| `--good`         | `#22C55E` | Positive state |
| `--warn`         | `#F59E0B` | Warning        |
| `--bad`          | `#EF4444` | Error          |

### Theme modes

- `crimson` (default)
- `hot-pink`, `cobalt`, `forge`, `emerald`, `violet` (preset `data-theme` blocks in `globals.css`)
- `custom` (user-set accent hex; full token triad via `tinycolor2` in `ThemeSync`)

Theme is controlled by `useUIStore` and synchronized through `ThemeSync`.

**Demo profile loads:** After seed completes, `DemoProfileModal` calls **`getDemoThemeForProfileId`** from `src/lib/seed/demo-theme.ts` (same preset map as `Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md` §13). **`DemoThemeSync`** reapplies that mapping when the active profile’s `clientName` matches a demo athlete so refresh does not revert to crimson alone. Onboarding’s `StepTheme` remains the user-driven path for non-demo accounts.

---

## 3) Shared selected-state system

Use `.is-selected` (defined in `globals.css`) for selected tabs/cards/buttons so selected glow and border feel synchronized across pages.

Current usage includes:

- Dashboard **days in range** tabs (one tab per calendar day in the trend window)
- Dashboard selected session panel
- Nutrition day-type selector
- Recovery `Log`/`Trends` switcher
- Demo profile selection cards

When adding a new selector, prefer `.is-selected` over custom one-off selected classes.

Interactive panel hover states (§3.5) follow the same accent border treatment as selected states for visual consistency.

---

## 3.5) Interactive panel behavior

- **Resting panels:** near-invisible border (`color-mix(in srgb, var(--accent) 6%, transparent)`), no glow
- **Hover/focus-within:** border rises to 62% accent with subtle glow (`0 0 14px` at 9% accent)
- **Transitions:** `border-color 200ms ease-out`, `box-shadow 300ms ease-out`
- **No layout shift:** border-width stays `1px`, only color changes

Applies to `.glass-panel`, `.glass-panel-strong`, and `.dashboard-overview`.

---

## 3.6) Accordion expand/collapse

- `.accordion-wrapper` + `.accordion-inner` CSS classes in `globals.css`
- `data-open` attribute controls expanded state
- Height animation: `250ms` `grid-template-rows` transition (`0fr` → `1fr`)
- Content fade-in: `200ms` opacity with `80ms` delay

Never use `{isOpen && <div>...</div>}` — always render the accordion wrapper and toggle `data-open`.

---

## 4) Layout chrome

Persistent navigation chrome uses:

- `--chrome-bg`
- `--chrome-bg-topbar`
- `--chrome-bg-toggle`

Use these in sidebar/topbar/mobile-nav. Do not hardcode cool greys for app rails.

The top bar includes **stacked Knight Rider LED bars**: readiness + target progress, each with
its own hover/focus detail panel. Inline metric labels are intentionally removed from the header
row for cleaner chrome.

**Alerts bell:** Always visible. **Active** (non–session-dismissed) alerts drive accent strength, optional pulse, and a small count badge; clicking a row can **dismiss for this session** (client overlay only — not a Firestore delete). When there are no active alerts, the bell uses **muted** chrome styling.

---

## 5) Typography

- **Headings:** Rajdhani, strong weight, tight tracking
- **Body text:** Rajdhani / system sans at readable contrast
- **Numbers and metrics:** monospace with `tabular-nums`
- **Label rows:** uppercase + tracking + `--text-2`

### Text color hierarchy

| Element                        | Color                             | Rationale                                                             |
| ------------------------------ | --------------------------------- | --------------------------------------------------------------------- |
| h1 page titles                 | `var(--accent)`                   | Brand anchor, short and large — accent is readable at this scale      |
| Section headings inside panels | `var(--text-0)` (white)           | Readable structural headers — accent would hurt readability           |
| Bold/strong text within body   | `var(--text-0)` (white)           | Emphasis within readable content — never accent                       |
| User names, phase info         | `var(--text-0)` / `var(--text-1)` | Informational metadata — white for names, grey for context            |
| Body paragraphs                | `var(--text-1)`                   | Secondary readable text                                               |
| Micro-labels ("Step X of 6")   | `var(--accent)`                   | Tiny metadata labels (10px uppercase) — accent is a brand signal here |
| Icons                          | `var(--accent)`                   | Visual markers, not readable text                                     |
| Links                          | `var(--accent)`                   | Interactive, clickable — accent signals affordance                    |
| CTA button text                | `var(--accent)`                   | Interactive link-style actions ("Open nutrition →")                   |

---

## 5.5) Native form theming

All `<input type="checkbox">` and `<input type="radio">` elements are globally themed via `accent-color: var(--accent)` in `globals.css`. No per-component styling is needed for native form controls.

---

## 6) Brand assets and logo usage

All raster assets are under `public/brand/` and referenced through `brandAssets` in `src/lib/constants/brand-assets.ts`.

- `IronmindLogo` handles male/female mark selection by theme
- Login hero uses `brandAssets.logoCombined`
- Apple touch icon uses `brandAssets.appleTouchIcon`

Do not hardcode `/public` image paths in components.

---

## 7) Onboarding visual updates

Onboarding now includes a dedicated theme step (`StepTheme`) early in the flow. Theme tiles and profile selection follow the same selected-state language as dashboard controls.

Demo profile cards include expanded coach-grade context blocks:

- Lifestyle
- Training history
- Genetics and recovery tendency
- Equipment and resources
- Coach summary

---

## 8) Deprecated guidance

Old blue/gold token guidance is intentionally retired. If you see references to blue-primary or gold-primary visual systems in older notes, treat them as obsolete.

Tailwind accent utilities (`text-accent`, `bg-accent`, `border-accent`, `focus:border-accent`, etc.) are hardcoded in `tailwind.config.js` and do NOT respond to theme changes. Always use CSS variable syntax (`text-[color:var(--accent)]`, `bg-[color:var(--accent)]`, etc.) instead.

---

## 9) Charts and Indicator Bars (Current)

- Use **accent-only hue variants** (via `color-mix`) when differentiating series under one theme.
- Progress visuals follow a **filled-only gradient** rule:
  - filled area: accent gradient (lighter -> darker)
  - empty area: neutral track (`--surface-track`) with no accent fill
- Keep bar endings clean (match Training Density style) unless a specific threshold marker is required.
- Axis tick labels must use valid token values (e.g. `fill: 'var(--text-2)'`), not invalid strings like `fill: 'color:var(--text-2)'`.
- Multi-series measurement charts should render only series that actually have data points in the current dataset.

### Dashboard: Nutrition + Supplements row

- On the dashboard, **Today's Nutrition** and **Supplements** share one full-width row using
  **`md:grid-cols-2`** so both cards are **equal width** and span the same combined width as other
  `col-span-full` panels (e.g. Weekly Volume). Do not use a three-column grid with only two children.

### Dashboard: trend window + schedule affordances

- **Trend window** (`DashboardTrendWindow` on `/dashboard`): week-length presets (1–4 wk) plus optional **custom date range**; drives workout density and physique mini-charts for that window. A **horizontal day strip** lists every `yyyy-MM-dd` in the active range; picking a date drives **session preview** (`getCycleDay`), **schedule / nutrition / recovery / supplements** for that date (via `useNutritionDay`, `useRecoveryEntry`, `useSupplementLog`), and **workout-done** state from workouts in the trend query. **Start workout** remains available only when the strip is on **calendar today**.
- **Today's schedule** type cues use **themed icon chips** (meal / vitamins / activity), not multicolor type pills — keep schedule rows readable and on-brand.

### Nutrition page: meal plan-line `<select>`

- Use the **`nutrition-meal-select`** class (see `globals.css`) for theme-aligned closed-state
  styling: `color-scheme: dark`, `accent-color: var(--accent)`, themed borders and focus ring.
- **Selection model:** `displayLine` = saved `meal.planLine` when set, otherwise the computed
  default for that slot. Do not treat “value is one of the preset options” as “show default” — that
  breaks controlled `<select>` values after the user picks a preset line.
