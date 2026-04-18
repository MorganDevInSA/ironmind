# IRONMIND Visual Style Guide

**Elite Bodybuilding Performance System — Premium Dark UI**

> **Current UI tokens** live in **`src/app/globals.css`** and **`.cursor/rules/IRONMIND.md`**. For the **dashboard** hub, the centered overview shell is **`.dashboard-overview`** and numbered exercise rows use **`.exercise-index-badge`** (**`Documentation/ARCHITECTURE.md` §13.4**). Persistent **header / sidebar / mobile nav** chrome uses **`--chrome-bg`**, **`--chrome-bg-topbar`**, and **`--chrome-bg-toggle`** (**§13.5**). Do not implement from the palette table below without cross-checking those sources.

---

## Brand Philosophy

IRONMIND is a **premium performance system** for elite athletes and serious trainees. Every visual element must communicate:

- **Precision**: Data-driven, grid-based layouts
- **Power**: Bold weights, masculine energy
- **Exclusivity**: High-contrast, luxury aesthetics
- **Performance**: Immediate visual feedback, zero friction

---

## Color System

### Core Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-0` | `#0A0A0A` | Primary background |
| `--bg-1` | `#0F1115` | Secondary background |
| `--bg-2` | `#141414` | Card backgrounds |
| `--surface-1` | `rgba(20, 28, 44, 0.95)` | Elevated surfaces |
| `--surface-2` | `rgba(30, 40, 60, 0.95)` | Higher elevation |
| `--panel` | `rgba(16, 22, 34, 0.72)` | Panels with blur |
| `--panel-strong` | `rgba(16, 22, 34, 0.9)` | Stronger panels |
| `--panel-border` | `rgba(80, 96, 128, 0.25)` | Subtle borders |

### Text Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--text-0` | `#F5F5F5` | Primary text |
| `--text-1` | `#B8C6DE` | Secondary text |
| `--text-2` | `#7F91AD` | Muted/tertiary text |

### Accent Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#3B82F6` | Primary accent (blue) |
| `--accent-2` | `#2A6CFF` | Secondary accent |
| `--good` | `#10B981` | Success, positive |
| `--bad` | `#EF4444` | Error, destructive |
| `--warn` | `#F59E0B` | Warning, alert |
| `--gold` | `#D4AF37` | Premium/gold highlights |
| `--gold-light` | `#F4D03F` | Light gold |
| `--gold-dark` | `#B8860B` | Dark gold |

### Color Usage Rules

- **Backgrounds**: Use `--bg-0` for app background, `--bg-1` for sections, `--bg-2` for cards
- **Accents**: Use `--accent` for primary actions, `--gold` for premium features
- **Status**: Use `--good` for success, `--warn` for warnings, `--bad` for errors
- **Text**: `--text-0` for primary, `--text-1` for secondary, `--text-2` for hints

---

## Typography

### Font Stack

```css
/* Primary UI */
font-family: 'Inter', system-ui, sans-serif;

/* Headlines & Brand */
font-family: 'Space Grotesk', system-ui, sans-serif;

/* Data/Numbers */
font-family: 'JetBrains Mono', ui-monospace, monospace;

/* Luxury Display (for special moments) */
font-family: 'Cinzel', serif;
```

### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | `1.875rem` (30px) | 700 | Page titles |
| H2 | `1.5rem` (24px) | 600 | Section headers |
| H3 | `1.25rem` (20px) | 600 | Card titles |
| H4 | `1.125rem` (18px) | 600 | Sub-sections |
| Body | `1rem` (16px) | 400 | Main content |
| Small | `0.875rem` (14px) | 500 | Secondary |
| XS | `0.75rem` (12px) | 500 | Labels, badges |
| Data | `1.5-3rem` | 600-700 | Metrics/numbers |

### Typography Rules

- **Headings**: Use `Space Grotesk`, `-0.02em` letter-spacing
- **Data Values**: Use `JetBrains Mono` for numbers (tabular-nums)
- **Body**: Use `Inter`, 1.5 line-height
- **Labels**: ALL CAPS, `0.2em` letter-spacing, `--text-2` color

---

## Shadows & Depth

```css
--shadow-soft: 0 10px 24px rgba(0, 0, 0, 0.35);
--shadow-strong: 0 16px 40px rgba(0, 0, 0, 0.45);
--shadow-gold: 0 8px 32px rgba(212, 175, 55, 0.25);
--shadow-accent: 0 8px 32px rgba(59, 130, 246, 0.25);
```

---

## Glassmorphism Panels

### Glass Panel Base

```css
.glass-panel {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-soft);
  border-radius: 14px;
}
```

### Trading Card (Hover Glow)

```css
.trading-card {
  @apply glass-panel;
}

.trading-card:hover {
  border-color: rgba(212, 175, 55, 0.25);
  box-shadow: var(--shadow-gold);
}
```

### Premium Panel (Strong)

```css
.trading-panel-strong {
  background: var(--panel-strong);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(16px);
  box-shadow: var(--shadow-strong);
  border-radius: 14px;
}
```

---

## Buttons

### Primary Button

```css
.btn-primary {
  @apply px-6 py-3 rounded-lg font-semibold text-white;
  @apply border;
  background: linear-gradient(120deg, rgba(59, 130, 246, 0.95), rgba(42, 108, 255, 0.95));
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 12px 22px rgba(59, 130, 246, 0.25);
  @apply hover:brightness-110 active:scale-95 transition-all duration-200;
}
```

### Secondary Button

```css
.btn-secondary {
  @apply px-6 py-3 rounded-lg font-semibold;
  color: var(--text-1);
  background: rgba(20, 28, 44, 0.9);
  border: 1px solid rgba(80, 96, 128, 0.35);
  @apply hover:border-[rgba(212,175,55,0.4)] hover:text-[color:var(--text-0)] active:scale-95 transition-all duration-200;
}
```

### Ghost Button

```css
.btn-ghost {
  @apply px-4 py-2 rounded-lg font-medium;
  color: var(--text-2);
  @apply hover:text-[color:var(--text-0)] hover:bg-[rgba(20,28,44,0.6)] active:scale-95 transition-all duration-200;
}
```

### Gold Accent Button (Premium)

```css
.btn-gold {
  @apply px-6 py-3 rounded-lg font-semibold;
  color: var(--gold-light);
  background: linear-gradient(120deg, rgba(212, 175, 55, 0.15), rgba(184, 134, 11, 0.1));
  border: 1px solid rgba(212, 175, 55, 0.4);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.15);
  @apply hover:brightness-110 active:scale-95 transition-all duration-200;
}
```

---

## Cards & Data Displays

### Metric Card

```css
.metric-card {
  @apply glass-panel p-5 flex flex-col gap-3;
}

.metric-badge {
  @apply inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest;
  @apply px-3 py-1 rounded-full;
  background: rgba(212, 175, 55, 0.12);
  color: var(--gold-light);
  border: 1px solid rgba(212, 175, 55, 0.35);
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
}
```

### Data Value Display

```css
.data-value {
  @apply text-3xl font-semibold;
  color: var(--text-0);
  font-family: 'JetBrains Mono', monospace;
}

.data-value-lg {
  @apply text-4xl font-bold;
  color: var(--text-0);
  font-family: 'JetBrains Mono', monospace;
}

.data-label {
  @apply text-[10px] font-semibold uppercase tracking-[0.3em];
  color: var(--text-2);
}
```

---

## Status Badges

```css
.status-badge {
  @apply inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide;
  @apply border;
}

.status-badge.active {
  background: rgba(16, 185, 129, 0.12);
  color: var(--good);
  border-color: rgba(16, 185, 129, 0.35);
}

.status-badge.warning {
  background: rgba(245, 158, 11, 0.12);
  color: var(--warn);
  border-color: rgba(245, 158, 11, 0.35);
}

.status-badge.error {
  background: rgba(239, 68, 68, 0.12);
  color: var(--bad);
  border-color: rgba(239, 68, 68, 0.35);
}

.status-badge.gold {
  background: rgba(212, 175, 55, 0.12);
  color: var(--gold-light);
  border-color: rgba(212, 175, 55, 0.35);
}
```

---

## Animations

### Pulse Soft (Gentle glow)

```css
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.72; }
}

.pulse-soft {
  animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Gold Glint (Premium shimmer)

```css
@keyframes gold-glint {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(212, 175, 55, 0.8)) drop-shadow(0 0 8px rgba(244, 208, 63, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(244, 208, 63, 1)) drop-shadow(0 0 12px rgba(244, 208, 63, 0.6));
  }
}

.gold-glint {
  animation: gold-glint 3s ease-in-out infinite;
}
```

### Pulse Ring (Active state)

```css
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}

.animate-pulse-ring {
  animation: pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Count Up (Number reveal)

```css
@keyframes count-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-count-up {
  animation: count-up 0.3s ease-out;
}
```

### Shimmer (Loading state)

```css
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: rgba(18, 24, 38, 0.9);
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0) 0,
    rgba(255, 255, 255, 0.03) 20%,
    rgba(255, 255, 255, 0.08) 60%,
    rgba(255, 255, 255, 0)
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

---

## Scrollbar Styling

```css
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: rgba(12, 18, 28, 0.8);
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(212, 175, 55, 0.4), rgba(184, 134, 11, 0.6));
  border-radius: 999px;
  border: 2px solid rgba(12, 18, 28, 0.8);
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(244, 208, 63, 0.6), rgba(212, 175, 55, 0.8));
}
```

---

## Background Effects

### Multi-Layer Gradient Background

```css
body {
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(59, 130, 246, 0.12), transparent 60%),
    radial-gradient(900px 500px at 110% 10%, rgba(42, 108, 255, 0.1), transparent 55%),
    radial-gradient(800px 400px at 50% 100%, rgba(212, 175, 55, 0.06), transparent 50%),
    linear-gradient(160deg, var(--bg-0), var(--bg-1) 45%, var(--bg-2) 100%);
  background-attachment: fixed;
}
```

---

## Chart Styling (Recharts)

### Grid Lines

```css
.chart-container .recharts-cartesian-grid line {
  stroke: rgba(114, 136, 176, 0.16);
  stroke-dasharray: 3 3;
}

.chart-container .recharts-cartesian-axis-line,
.chart-container .recharts-cartesian-axis-tick-line {
  stroke: rgba(132, 152, 190, 0.32);
}
```

### Tooltip Cursor

```css
.chart-container .recharts-tooltip-cursor {
  stroke: rgba(230, 200, 110, 0.9) !important;
  stroke-width: 1.8 !important;
  filter: drop-shadow(0 0 4px rgba(230, 200, 110, 0.5));
}
```

### Gold Bar Glow

```css
.chart-bar-gold .recharts-bar-rectangle rect[fill="#d4af37"] {
  stroke: #f4d03f;
  stroke-width: 1.5px;
  fill-opacity: 0.95;
  filter:
    drop-shadow(0 0 6px rgba(212, 175, 55, 0.8))
    drop-shadow(0 0 12px rgba(244, 208, 63, 0.38));
}
```

---

## Brand Text Effects

### Gradient Gold Text

```css
.brand-text {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  letter-spacing: 0.08em;
  background: linear-gradient(135deg, var(--gold-light), var(--gold), var(--gold-dark));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 12px rgba(212, 175, 55, 0.3);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}
```

### Embossed Gold Text

```css
.brand-text-embossed {
  font-family: 'Cinzel', serif;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: var(--gold-light);
  text-shadow: 
    0 1px 0 rgba(244, 208, 63, 0.8),
    0 2px 0 rgba(212, 175, 55, 0.7),
    0 3px 0 rgba(184, 134, 11, 0.6),
    0 4px 8px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(212, 175, 55, 0.4);
}
```

---

## Divider / Separator

```css
.divider {
  @apply h-px my-4;
  background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.25), transparent);
}
```

---

## Navigation Items

```css
.nav-item {
  width: 100%;
  height: 54px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(35, 45, 60, 0.55);
  cursor: pointer;
  transition: all 0.22s ease;
  backdrop-filter: blur(8px);
}

.nav-item:hover {
  background: rgba(50, 62, 82, 0.75);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}

.nav-item.active {
  background: rgba(12, 18, 28, 0.92);
  border: 1px solid rgba(230, 200, 110, 0.30);
  box-shadow: 0px 0px 14px rgba(230, 200, 110, 0.10);
}
```

---

## Implementation Notes

### Tailwind Configuration

Extend your `tailwind.config.js` with these additions:

```javascript
theme: {
  extend: {
    colors: {
      'bg-0': '#0A0A0A',
      'bg-1': '#0F1115',
      'bg-2': '#141414',
      'surface-1': 'rgba(20, 28, 44, 0.95)',
      'surface-2': 'rgba(30, 40, 60, 0.95)',
      'panel': 'rgba(16, 22, 34, 0.72)',
      'panel-strong': 'rgba(16, 22, 34, 0.9)',
      'panel-border': 'rgba(80, 96, 128, 0.25)',
      'text-0': '#F5F5F5',
      'text-1': '#B8C6DE',
      'text-2': '#7F91AD',
      'accent': '#3B82F6',
      'accent-2': '#2A6CFF',
      'good': '#10B981',
      'bad': '#EF4444',
      'warn': '#F59E0B',
      'gold': '#D4AF37',
      'gold-light': '#F4D03F',
      'gold-dark': '#B8860B',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      heading: ['Space Grotesk', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      display: ['Cinzel', 'serif'],
    },
    boxShadow: {
      'soft': '0 10px 24px rgba(0, 0, 0, 0.35)',
      'strong': '0 16px 40px rgba(0, 0, 0, 0.45)',
      'gold': '0 8px 32px rgba(212, 175, 55, 0.25)',
      'accent': '0 8px 32px rgba(59, 130, 246, 0.25)',
    },
  },
}
```

### Font Loading

Add to your `globals.css` or HTML head:

```css
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap');
```

---

## Responsive Breakpoints

| Breakpoint | Width | Usage |
|------------|-------|-------|
| `sm` | 640px | Large phones |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Desktops |
| `2xl` | 1536px | Large screens |

### Mobile-First Approach

1. Design for mobile (375px) first
2. Use `md:` for tablet adjustments
3. Use `lg:` for desktop layouts
4. Use `xl:` for large screens

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus states: 2px solid `--accent` outline
- Interactive elements: Min 44x44px touch target
- Animations: Respect `prefers-reduced-motion`

---

**Version**: 1.0  
**Last Updated**: 2026-04-18  
**Project**: IRONMIND — Elite Bodybuilding Performance System
