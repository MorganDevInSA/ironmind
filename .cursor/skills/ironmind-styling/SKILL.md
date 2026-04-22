---
name: ironmind-styling
description: Apply IRONMIND UI styling with theme-aware patterns. Use when implementing buttons, cards, panels, badges, typography, data displays, or any UI element. All accent colors use CSS variables for multi-theme support.
---

# IRONMIND UI/UX Styling

Blood, strength, sweat, growth. Pure dark with accent fire.

## Design Token Quick Reference

```css
/* Backgrounds */
--bg-0: #080808;           /* Deepest black */
--bg-1: #0D0D0D;           /* App background */
--bg-2: #131313;           /* Elevated surfaces */

/* Panels */
--panel: rgba(18, 14, 14, 0.78);
--panel-strong: rgba(18, 14, 14, 0.94);
--panel-border: rgba(65, 50, 50, 0.40);

/* Text (neutral, theme-independent) */
--text-0: #F0F0F0;         /* Primary text */
--text-1: #9A9A9A;         /* Secondary text */
--text-2: #5E5E5E;         /* Muted/labels */
--text-detail: #BABABA;    /* Readable secondary on dark */

/* Accent (theme-aware — changes with data-theme) */
--accent: #DC2626;         /* Primary accent */
--accent-light: #EF4444;   /* Bright accent */
--accent-2: #991B1B;       /* Dark accent */

/* Status (fixed) */
--good: #22C55E;
--warn: #F59E0B;
--bad: #EF4444;

/* Chrome */
--chrome-bg: #141414;
--chrome-bg-topbar: var(--chrome-bg);
--chrome-border: rgba(65, 50, 50, 0.38);
```

---

## Semantic CSS Classes

All classes are defined in `globals.css` and are theme-aware.

### Panels

| Class | Use |
|-------|-----|
| `.glass-panel` | Standard card with blur, border, shadow |
| `.glass-panel-strong` | Modal/overlay with stronger opacity |
| `.dashboard-overview` | Main dashboard container (centered, bordered) |
| `.dashboard-card-surface` | Cards inside dashboard grid |
| `.card-hover` | Add hover lift + accent border glow |
| `.gradient-border` | Wrapper for accent gradient border effect |
| `.trading-panel` | Strength panel with gradient border shimmer |

### Buttons

| Class | Use |
|-------|-----|
| `.btn-primary` | Main CTA — accent gradient, shadow |
| `.btn-secondary` | Secondary action — muted, accent hover |
| `.btn-ghost` | Minimal — text only, hover background |
| `.btn-gold` | Alias for `.btn-primary` (legacy name) |

### Typography

| Class | Use |
|-------|-----|
| `.data-label` | Uppercase muted label (10px, tracking) |
| `.data-value` | Large monospace number (30px) |
| `.data-value-lg` | Extra large number (36px) |
| `.data-value-sm` | Small monospace number (20px) |
| `.brand-text` | Gradient text for brand/logo |
| `.brand-text-embossed` | 3D embossed brand text |

### Status Badges

| Class | Use |
|-------|-----|
| `.status-badge.good` | Green success state |
| `.status-badge.warn` | Amber warning state |
| `.status-badge.bad` | Red error state |
| `.status-badge.gold` | Accent milestone/PR |
| `.status-badge.info` | Blue informational |
| `.metric-badge` | Pill badge for KPIs |

### Navigation

| Class | Use |
|-------|-----|
| `.nav-item` | Sidebar/mobile nav button |
| `.nav-item.active` | Active nav state with shimmer |
| `.is-selected` | Selected state glow for tabs/toggles |
| `.tab-button` | Tab navigation button |
| `.tab-button.active` | Active tab with accent underline |

### Utilities

| Class | Use |
|-------|-----|
| `.exercise-index-badge` | Ordered exercise number |
| `.divider` | Horizontal accent gradient line |
| `.skeleton` | Loading shimmer effect |
| `.spinner` | Rotating loading indicator |
| `.tooltip` | Floating tooltip box |
| `.live-dot` | Pulsing live indicator |
| `.spotlight-hover` | Hover sweep effect |

---

## Component Recipes (Inline Tailwind)

When semantic classes don't exist, use these theme-aware patterns.

### Glass Panel (Custom)

```tsx
<div className="relative rounded-[14px] p-6
  bg-[color:var(--panel)] backdrop-blur-xl
  border border-[color:var(--panel-border)]
  shadow-[var(--shadow-soft)]">
  Content
</div>
```

### Hover Card with Accent Glow

```tsx
<div className="glass-panel card-hover p-6 cursor-pointer">
  Content
</div>
```

Or inline:

```tsx
<div className="relative rounded-[14px] p-6
  bg-[color:var(--panel)] backdrop-blur-xl
  border border-[color:var(--panel-border)]
  shadow-[var(--shadow-soft)]
  hover:border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]
  hover:shadow-[var(--shadow-accent)]
  hover:-translate-y-0.5
  transition-all duration-200 cursor-pointer">
  Content
</div>
```

### Primary Button (Inline)

```tsx
<button className="px-6 py-3 rounded-lg font-semibold text-white
  bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)]
  border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
  shadow-[var(--shadow-accent)]
  hover:brightness-110 active:scale-95 transition-all duration-200">
  Action
</button>
```

### Secondary Button (Inline)

```tsx
<button className="px-6 py-3 rounded-lg font-semibold text-[color:var(--text-1)]
  bg-[rgba(22,16,16,0.9)] border border-[color:var(--panel-border)]
  hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]
  hover:text-[color:var(--text-0)]
  active:scale-95 transition-all duration-200">
  Action
</button>
```

### Ghost Button (Inline)

```tsx
<button className="px-4 py-2 rounded-lg font-medium text-[color:var(--text-2)]
  hover:text-[color:var(--text-0)] hover:bg-[rgba(22,16,16,0.6)]
  active:scale-95 transition-all duration-200">
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
// Page title
<h1 className="text-[1.875rem] font-bold font-heading tracking-tight text-[color:var(--text-0)]">
  Title
</h1>

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
<button 
  className={`nav-item ${isActive ? 'active' : ''}`}
  data-active={isActive}
>
  <Icon className="w-5 h-5" />
  <span className="text-sm font-semibold tracking-wide">Label</span>
</button>
```

---

## Form Inputs

```tsx
<input className="w-full px-4 py-3 rounded-lg
  bg-[color:var(--bg-2)] border border-[color:var(--panel-border)]
  text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)]
  focus:border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
  focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_10%,transparent)]
  focus:outline-none transition-all duration-200" />
```

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

---

## Dividers

Use `.divider` class:

```tsx
<hr className="divider" />
```

Or inline:

```tsx
<hr className="h-px my-4 border-0
  bg-gradient-to-r from-transparent via-[color:color-mix(in_srgb,var(--accent)_30%,transparent)] to-transparent" />
```

---

## Theme Switching

To change theme at runtime:

```tsx
document.documentElement.dataset.theme = 'hot-pink';
// or remove for default:
delete document.documentElement.dataset.theme;
```

All components using CSS variables automatically update.

---

## Anti-Patterns to Avoid

| Don't | Do Instead |
|-------|------------|
| `bg-[#DC2626]` | `bg-[color:var(--accent)]` |
| `text-[#EF4444]` | `text-[color:var(--accent-light)]` |
| `border-[rgba(220,38,38,0.3)]` | `border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]` |
| `shadow-[0_8px_32px_rgba(220,38,38,0.2)]` | `shadow-[var(--shadow-accent)]` |
| Creating new button styles | Use `.btn-primary`, `.btn-secondary`, `.btn-ghost` |
| Inline panel styling | Use `.glass-panel`, `.glass-panel-strong` |
