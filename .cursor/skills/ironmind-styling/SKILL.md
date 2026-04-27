---
name: ironmind-styling
description: Apply IRONMIND UI styling with theme-aware patterns. Use when implementing buttons, cards, panels, badges, typography, data displays, accent-border hover peeks, or any UI element. All accent colors use CSS variables for multi-theme support.
---

# IRONMIND UI/UX Styling

Blood, strength, sweat, growth. Pure dark with accent fire.

## Design Token Quick Reference

```css
/* Backgrounds */
--bg-0: #080808; /* Deepest black */
--bg-1: #0d0d0d; /* App background */
--bg-2: #131313; /* Elevated surfaces */

/* Panels */
--panel: rgba(18, 14, 14, 0.78);
--panel-strong: rgba(18, 14, 14, 0.94);
--panel-border: color-mix(in srgb, var(--accent) 6%, transparent);
--panel-border-hover: color-mix(in srgb, var(--accent) 62%, transparent);
--panel-glow: 0 0 14px color-mix(in srgb, var(--accent) 9%, transparent);

/* Text — default crimson uses neutral warm greys (see globals.css :root) */
--text-0: #f0f0f0; /* Primary text */
--text-1: #a8a3a3; /* Secondary text */
--text-2: #6f6a6a; /* Muted/labels */
--text-detail: #bababa; /* Readable secondary on dark */

/* Accent (theme-aware — changes with data-theme) */
--accent: #dc2626; /* Primary accent */
--accent-light: #ef4444; /* Bright accent */
--accent-2: #991b1b; /* Dark accent */

/* Status (fixed) */
--good: #22c55e;
--warn: #f59e0b;
--bad: #ef4444;

/* Chrome */
--chrome-bg: #141414;
--chrome-bg-topbar: var(--chrome-bg);
--chrome-border: rgba(65, 50, 50, 0.38);
```

---

## Semantic CSS Classes

All classes are defined in `globals.css` and are theme-aware.

### Panels

| Class                     | Use                                                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.glass-panel`            | Standard card with blur, border, shadow. Hover/focus-within: border → `--panel-border-hover` with `--panel-glow` (200ms ease-out border, 300ms ease-out shadow) |
| `.glass-panel-strong`     | Modal/overlay with stronger opacity. Same hover/focus-within transitions as `.glass-panel`                                                                      |
| `.dashboard-overview`     | Main dashboard container (centered, bordered)                                                                                                                   |
| `.dashboard-card-surface` | Cards inside dashboard grid                                                                                                                                     |
| `.card-hover`             | Add hover lift + accent border glow                                                                                                                             |
| `.gradient-border`        | Wrapper for accent gradient border effect                                                                                                                       |
| `.trading-panel`          | Strength panel with gradient border shimmer                                                                                                                     |

### Buttons

| Class            | Use                                                                                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.btn-primary`   | Main CTA — accent gradient, shadow                                                                                                                             |
| `.btn-secondary` | Secondary action — `var(--surface-well)` + `var(--chrome-border)`; accent border on hover (theme-safe; do not duplicate with fixed `rgba(22,16,16)` hairlines) |
| `.btn-ghost`     | Minimal — text only, hover background                                                                                                                          |
| `.btn-gold`      | Alias for `.btn-primary` (legacy name)                                                                                                                         |

### Typography

| Class                  | Use                                    |
| ---------------------- | -------------------------------------- |
| `.data-label`          | Uppercase muted label (10px, tracking) |
| `.data-value`          | Large monospace number (30px)          |
| `.data-value-lg`       | Extra large number (36px)              |
| `.data-value-sm`       | Small monospace number (20px)          |
| `.brand-text`          | Gradient text for brand/logo           |
| `.brand-text-embossed` | 3D embossed brand text                 |

### Status Badges

| Class                | Use                 |
| -------------------- | ------------------- |
| `.status-badge.good` | Green success state |
| `.status-badge.warn` | Amber warning state |
| `.status-badge.bad`  | Red error state     |
| `.status-badge.gold` | Accent milestone/PR |
| `.status-badge.info` | Blue informational  |
| `.metric-badge`      | Pill badge for KPIs |

### Navigation

| Class                | Use                                  |
| -------------------- | ------------------------------------ |
| `.nav-item`          | Sidebar/mobile nav button            |
| `.nav-item.active`   | Active nav state with shimmer        |
| `.is-selected`       | Selected state glow for tabs/toggles |
| `.tab-button`        | Tab navigation button                |
| `.tab-button.active` | Active tab with accent underline     |

### Brand logo (`IronmindLogo`)

| Concern        | Pattern                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Component**  | **`IronmindLogo`** — variants **`sidebar-expanded`**, **`sidebar-collapsed`**, **`topbar`**, **`auth`**                                                                |
| **Asset**      | Sidebar + top bar → **`brandAssets.logoCombined`**; **`auth`** (register) → male/female by theme                                                                       |
| **Sizing**     | **Source of truth:** **`src/components/brand/ironmind-logo.tsx`** (max height/width + **`next/image` `sizes`**). Sync **`Documentation/LOGO-BRIEF.md`** when adjusting |
| **Object fit** | **`object-contain object-center`** — avoid mixing **`object-left`** / **`object-bottom`** (see **LOGO-BRIEF**)                                                         |

### Utilities

| Class                    | Use                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `.exercise-index-badge`  | Ordered exercise number                                                                                                 |
| `.divider`               | Horizontal accent gradient line                                                                                         |
| `.skeleton`              | Loading shimmer effect (deprecated — prefer `.spinner`)                                                                 |
| `.spinner`               | iOS-style activity indicator (conic gradient, `steps(12)`). Size variants: `.spinner-sm` (1rem), `.spinner-lg` (2.5rem) |
| `.accordion-wrapper`     | Grid-based expand/collapse container — toggle via `data-open="true"`                                                    |
| `.accordion-inner`       | Inner wrapper for overflow + opacity transition (place inside `.accordion-wrapper`)                                     |
| `.knight-led`            | LED bar indicator dot (base)                                                                                            |
| `.knight-led-lit`        | Active LED with `knight-pulse` animation (primary hue)                                                                  |
| `.knight-led-lit-alt`    | Active LED with `knight-pulse` animation (secondary hue)                                                                |
| `.recovery-slider`       | Themed range slider (filled gradient + neutral empty track)                                                             |
| `.nutrition-meal-select` | Nutrition meal plan-line `<select>`: dark `color-scheme`, accent focus, themed `option` rows                            |
| `.tooltip`               | Floating tooltip box                                                                                                    |
| `.live-dot`              | Pulsing live indicator                                                                                                  |
| `.spotlight-hover`       | Hover sweep effect                                                                                                      |

---

## Component Recipes (Inline Tailwind)

When semantic classes don't exist, use these theme-aware patterns.

### Glass Panel (Custom)

```tsx
<div
  className="relative rounded-[14px] p-6
  bg-[color:var(--panel)] backdrop-blur-xl
  border border-[color:var(--panel-border)]
  shadow-[var(--shadow-soft)]"
>
  Content
</div>
```

### Hover Card with Accent Glow

```tsx
<div className="glass-panel card-hover p-6 cursor-pointer">Content</div>
```

Or inline:

```tsx
<div
  className="relative rounded-[14px] p-6
  bg-[color:var(--panel)] backdrop-blur-xl
  border border-[color:var(--panel-border)]
  shadow-[var(--shadow-soft)]
  hover:border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]
  hover:shadow-[var(--shadow-accent)]
  hover:-translate-y-0.5
  transition-all duration-200 cursor-pointer"
>
  Content
</div>
```

### Primary Button (Inline)

```tsx
<button
  className="px-6 py-3 rounded-lg font-semibold text-white
  bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)]
  border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
  shadow-[var(--shadow-accent)]
  hover:brightness-110 active:scale-95 transition-all duration-200"
>
  Action
</button>
```

### Secondary Button

Prefer the **`.btn-secondary`** class (`globals.css`) — it uses `var(--surface-well)` and `var(--chrome-border)` so secondary actions stay correct on every `data-theme`.

```tsx
<button type="button" className="btn-secondary px-6 py-3">
  Action
</button>
```

### Ghost Button (Inline)

```tsx
<button
  className="px-4 py-2 rounded-lg font-medium text-[color:var(--text-2)]
  hover:text-[color:var(--text-0)] hover:bg-[rgba(22,16,16,0.6)]
  active:scale-95 transition-all duration-200"
>
  Action
</button>
```

---

## Metric / Data Cards

```tsx
<div className="glass-panel p-5 flex flex-col gap-3">
  {/* Header */}
  <div className="flex items-center justify-between">
    <span className="data-label">MUSCLE VOLUME</span>
    <span className="metric-badge">ON TRACK</span>
  </div>

  {/* Value */}
  <div className="data-value">42</div>

  {/* Secondary */}
  <div className="text-sm text-[color:var(--text-1)]">sets this week</div>
</div>
```

---

## Status Badges (Inline Patterns)

```tsx
// Success
<span className="status-badge good">Done</span>

// Warning
<span className="status-badge warn">Warning</span>

// Error
<span className="status-badge bad">Error</span>

// Accent (PR/KPI)
<span className="status-badge gold">PR</span>

// Custom inline
<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md
  text-xs font-semibold uppercase tracking-wide border
  bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)]
  text-[color:var(--accent-light)]
  border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)]
  [text-shadow:0_0_8px_color-mix(in_srgb,var(--accent)_40%,transparent)]">
  MILESTONE
</span>
```

---

## Typography Patterns

```tsx
// Page title (accent-colored — ONLY h1 page titles)
<h1 className="text-2xl font-bold text-[color:var(--accent)]">
  Title
</h1>

// Section heading inside a panel (white — NOT accent)
<h3 className="font-semibold text-[color:var(--text-0)]">Section Title</h3>

// Bold text within body copy (white — NOT accent)
<strong className="text-[color:var(--text-0)]">important phrase</strong>

// Data label (ALL CAPS)
<span className="data-label">SETS / WEEK</span>

// Large data value
<span className="data-value">12,450</span>

// Brand text (accent gradient)
<span className="brand-text">IRONMIND</span>
```

---

## Navigation Items

Use `.nav-item` class:

```tsx
<button className={`nav-item ${isActive ? 'active' : ''}`} data-active={isActive}>
  <Icon className="w-5 h-5" />
  <span className="text-sm font-semibold tracking-wide">Label</span>
</button>
```

---

## Form Inputs

```tsx
<input
  className="w-full px-4 py-3 rounded-lg
  bg-[color:var(--bg-2)] border border-[color:var(--panel-border)]
  text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)]
  focus:border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
  focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_10%,transparent)]
  focus:outline-none transition-all duration-200"
/>
```

Native checkbox/radio inputs are globally themed via `accent-color: var(--accent)` in `globals.css` — no extra styling needed.

---

## Accent-border “peek” panels (hover / focus supplements)

**Caption peeks** (dashboard/training **plan-by-day** strip + **collapsed** sidebar rail) share one implementation:

| Piece                                                                       | Location                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Border** (2px solid, accent **62%** mix — matches **`.nav-item.active`**) | **`globals.css`** on **`.sidebar-rail-peek-panel`** / **`.plan-day-strip-peek-panel`** — plain CSS (`border-color: color-mix(...)`) so **`var(--accent)`** always wins; avoid Tailwind arbitrary border utilities on these panels (they could fall back to a light default). |
| Shell (fill / blur / shadow / `px-3 py-2.5`)                                | **`PEEK_CAPTION_PANEL_SKIN`** in [`src/lib/constants/peek-caption.ts`](../../../src/lib/constants/peek-caption.ts) — **`sidebar.tsx`** + **[`plan-by-day-strip.tsx`](../../../src/components/training/plan-by-day-strip.tsx)** (`PLAN_DAY_PEEK_SKIN` aliases it).            |
| Rigid width                                                                 | Same globals classes — **`width` / `min-width` / `max-width`: 216px** (`box-sizing: border-box`); intrinsic height from padding + two lines.                                                                                                                                 |
| Copy alignment                                                              | **`text-center`** on the peek root in both components (title + hint).                                                                                                                                                                                                        |

Shadow / inset stack in **`PEEK_CAPTION_PANEL_SKIN`** follows active-nav lift (**accent 9%** outer glow + hairline insets); border color never lives in the Tailwind string — only in **`globals.css`** next to the layout class.

**Positioning:** peeks that must appear **outside** a scroll container or **over** the main app column (collapsed sidebar rail) use **`createPortal` + `position: fixed`** — not `absolute`/`left-full` inside `overflow-y: auto` or narrow fixed rails (see **ironmind-a11y** shell sidebar section). The **day strip** peek stays **`absolute`** above each pill (sufficient within the card); it still uses the **same** skin + layout class as the rail for visual parity.

---

## Data Tables

Use `.data-table` class or inline:

```tsx
<table className="data-table">
  <thead>
    <tr>
      <th>Exercise</th>
      <th>Sets</th>
      <th>Reps</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Squat</td>
      <td className="font-mono tabular-nums">4</td>
      <td className="font-mono tabular-nums">8</td>
    </tr>
  </tbody>
</table>
```

**Wide measurement grids (Physique History):** Wrap in **`overflow-x-auto`**. Keep the **first column sticky** (`sticky left-0`) with a solid **`bg-[color:var(--bg-…)]`** (match panel background) so the date column stays readable while scrolling. Tape and scale cells often use a **two-line** pattern: primary value (`font-mono tabular-nums`), then **Δ** on the second line (`text-[10px]`, **`var(--accent)`** when delta ≠ 0). Reference: **`HistoryTapeCell`** / **`HistoryScaleCell`** in [`src/app/(app)/physique/page.tsx`](<../../../src/app/(app)/physique/page.tsx>).

---

## Dividers

Use `.divider` class:

```tsx
<hr className="divider" />
```

Or inline:

```tsx
<hr
  className="h-px my-4 border-0
  bg-gradient-to-r from-transparent via-[color:color-mix(in_srgb,var(--accent)_30%,transparent)] to-transparent"
/>
```

---

## Theme Switching

Use **`useUIStore`** (`theme`, `setTheme`, optional `customAccent`) so the choice persists and **`ThemeSync`** (`src/components/theme/theme-sync.tsx`) keeps `data-theme` and CSS variables aligned.

**Preset `data-theme` values** (see `globals.css`): `hot-pink`, `cobalt`, `forge`, `emerald`, `violet`. **Crimson** is the default (no `data-theme` / store value `crimson`). **Custom** sets `data-theme="custom"` and derives tokens with `tinycolor2`.

```tsx
// Low-level illustration only — prefer the Zustand store in app code:
document.documentElement.dataset.theme = 'forge';
delete document.documentElement.dataset.theme; // back toward default crimson path
```

All components using CSS variables automatically update.

---

## Anti-Patterns to Avoid

| Don't                                               | Do Instead                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `bg-[#DC2626]`                                      | `bg-[color:var(--accent)]`                                                                        |
| `text-[#EF4444]`                                    | `text-[color:var(--accent-light)]`                                                                |
| `border-[rgba(220,38,38,0.3)]`                      | `border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]`                                 |
| `shadow-[0_8px_32px_rgba(220,38,38,0.2)]`           | `shadow-[var(--shadow-accent)]`                                                                   |
| Creating new button styles                          | Use `.btn-primary`, `.btn-secondary`, `.btn-ghost`                                                |
| Inline panel styling                                | Use `.glass-panel`, `.glass-panel-strong`                                                         |
| `text-accent`                                       | `text-[color:var(--accent)]` (Tailwind utility uses hardcoded hex)                                |
| `bg-accent`                                         | `.btn-primary` or `bg-[color:var(--accent)]`                                                      |
| `{isOpen && <div>...</div>}` for expandable content | Use `.accordion-wrapper` with `data-open` attribute                                               |
| Accent-colored body text, bold, or section headings | Use `text-[color:var(--text-0)]` for readable content; accent is for icons, links, h1 titles only |

### Visualization-specific anti-patterns

| Don't                                         | Do Instead                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------- |
| Tint empty progress-track areas with accent   | Keep empty track neutral (`--surface-track`) and tint filled area only                |
| Use unrelated palette colors per chart series | Use accent-only hue variants (`color-mix` with `var(--accent)`/`var(--accent-light)`) |
| Keep static legend lines for absent data      | Filter chart series to only metrics with actual points                                |
| `fill: 'color:var(--text-2)'` for chart ticks | `fill: 'var(--text-2)'`                                                               |
