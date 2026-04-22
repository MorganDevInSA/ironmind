# IRONMIND Design Tokens

Complete specification for colors, typography, spacing, and shadows.

All tokens are defined in `src/app/globals.css` as CSS custom properties.

---

## Theming

IRONMIND supports multiple color themes. The default is **Crimson**.

```html
<!-- Default (Crimson) -->
<html>

<!-- Hot Pink theme -->
<html data-theme="hot-pink">
```

Accent colors change per theme; neutrals remain fixed.

---

## Color Tokens

### Backgrounds (Fixed)

| Token | Value | Use |
|-------|-------|-----|
| `--bg-0` | `#080808` | Deepest black, base layer |
| `--bg-1` | `#0D0D0D` | App background |
| `--bg-2` | `#131313` | Elevated surfaces |

### Surfaces (Fixed)

| Token | Value | Use |
|-------|-------|-----|
| `--surface-1` | `rgba(22, 16, 16, 0.95)` | Warm elevated surface |
| `--surface-2` | `rgba(28, 20, 20, 0.95)` | Warmer elevated surface |
| `--surface-track` | `rgba(22, 18, 18, 0.78)` | Progress bar tracks |
| `--surface-well` | `rgba(14, 11, 11, 0.72)` | Inset wells |

### Panels (Fixed)

| Token | Value | Use |
|-------|-------|-----|
| `--panel` | `rgba(18, 14, 14, 0.78)` | Standard glass panel |
| `--panel-strong` | `rgba(18, 14, 14, 0.94)` | Modal/overlay panel |
| `--panel-border` | `rgba(65, 50, 50, 0.40)` | Panel border |
| `--panel-border-width` | `3px` | Default border thickness |

### Text (Fixed)

| Token | Value | Use |
|-------|-------|-----|
| `--text-0` | `#F0F0F0` | Primary text |
| `--text-1` | `#9A9A9A` | Secondary text |
| `--text-2` | `#5E5E5E` | Muted text, labels |
| `--text-detail` | `#BABABA` | Readable secondary on dark |

### Accent (Theme-Aware)

| Token | Crimson | Hot Pink | Use |
|-------|---------|----------|-----|
| `--accent` | `#DC2626` | `#FF3EA5` | Primary accent |
| `--accent-light` | `#EF4444` | `#FF7DC4` | Bright/hover accent |
| `--accent-2` | `#991B1B` | `#C21877` | Dark accent |

### Legacy Aliases (Map to Accent)

| Token | Maps To | Note |
|-------|---------|------|
| `--gold` | `var(--accent)` | Kept for back-compat |
| `--gold-light` | `var(--accent-light)` | Kept for back-compat |
| `--gold-dark` | `var(--accent-2)` | Kept for back-compat |
| `--crimson` | `var(--accent)` | Explicit crimson ref |

### Status (Fixed)

| Token | Value | Use |
|-------|-------|-----|
| `--good` | `#22C55E` | Success, completion |
| `--warn` | `#F59E0B` | Warning, caution |
| `--bad` | `#EF4444` | Error, danger |

### Chrome (Fixed)

| Token | Value | Use |
|-------|-------|-----|
| `--chrome-bg` | `#141414` | Sidebar, mobile nav |
| `--chrome-bg-topbar` | `var(--chrome-bg)` | Header (same as sidebar) |
| `--chrome-bg-toggle` | `#101010` | Collapse toggle |
| `--chrome-border` | `rgba(65, 50, 50, 0.38)` | Chrome hairlines |
| `--chrome-border-subtle` | `rgba(42, 36, 36, 0.72)` | Subtle chrome borders |

### Shadows

| Token | Value |
|-------|-------|
| `--shadow-soft` | `0 10px 24px rgba(0, 0, 0, 0.45)` |
| `--shadow-strong` | `0 16px 40px rgba(0, 0, 0, 0.60)` |
| `--shadow-accent` | `0 8px 32px color-mix(in srgb, var(--accent) 20%, transparent)` |

---

## Typography

### Font Families

| Token/Class | Font | Use |
|-------------|------|-----|
| `font-heading` | Rajdhani | Headlines, section titles |
| `font-sans` | Rajdhani | Body text (Tailwind default) |
| `font-mono` | JetBrains Mono | All numbers, data |
| `font-brand` | Cinzel | Logo, PR moments only |

### Type Scale

| Element | Size | Weight | Tracking |
|---------|------|--------|----------|
| h1 | `1.875rem` (30px) | 700 | `0.02em` |
| h2 | `1.5rem` (24px) | 600 | `0.02em` |
| h3 | `1.25rem` (20px) | 600 | `0.02em` |
| h4 | `1.125rem` (18px) | 600 | `0.02em` |
| Body | `1rem` (16px) | 400 | normal |
| Small | `0.875rem` (14px) | 400 | normal |

### Data Typography

| Class | Size | Weight | Font |
|-------|------|--------|------|
| `.data-label` | `0.625rem` (10px) | 600 | Rajdhani, uppercase, `0.3em` tracking |
| `.data-value` | `1.875rem` (30px) | 600 | JetBrains Mono |
| `.data-value-lg` | `2.25rem` (36px) | 700 | JetBrains Mono |
| `.data-value-sm` | `1.25rem` (20px) | 600 | JetBrains Mono |

### Rules

- **Numbers**: Always `font-mono tabular-nums` — no exceptions
- **Labels**: ALL CAPS, `tracking-[0.3em]`, `var(--text-2)`
- **Headlines**: `font-heading`, tracking `-0.02em`

---

## Spacing

Use Tailwind's default spacing scale. Key values:

| Token | Value | Use |
|-------|-------|-----|
| `p-4` | `1rem` | Standard card padding |
| `p-5` | `1.25rem` | Comfortable card padding |
| `p-6` | `1.5rem` | Spacious card padding |
| `gap-3` | `0.75rem` | Tight element gap |
| `gap-4` | `1rem` | Standard element gap |
| `gap-6` | `1.5rem` | Section gap |

### Border Radius

| Token | Value | Use |
|-------|-------|-----|
| `rounded-lg` | `0.5rem` | Buttons, inputs |
| `rounded-[14px]` | `14px` | Cards, panels |
| `rounded-[12px]` | `12px` | Nav items |
| `rounded-full` | `9999px` | Pills, badges |

---

## Dashboard-Specific Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--dashboard-overview-radius` | `1.25rem` | Overview container radius |
| `--dashboard-overview-border` | `rgba(220, 38, 38, 0.26)` | Overview border (theme-aware) |
| `--dashboard-overview-border-width` | `4px` | Overview border thickness |
| `--dashboard-overview-max-width` | `72rem` | Max width on large screens |
| `--exercise-index-bg` | `rgba(22, 18, 18, 0.96)` | Exercise number badge |
| `--exercise-index-border` | `rgba(220, 38, 38, 0.42)` | Exercise badge border |

---

## Motion Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | `100ms` | Button press |
| `--duration-fast` | `150ms` | Quick feedback |
| `--duration-normal` | `200ms` | Hover, modal open |
| `--duration-slow` | `300ms` | Page transitions |
| `--duration-page` | `500ms` | Chart animations |
| `--duration-ambient` | `3000ms` | Glows, ambient effects |

---

## Forbidden Tokens

Replace on sight — these are legacy values:

| Old Token | Replace With |
|-----------|-------------|
| `#D4AF37`, `#F4D03F`, `#B8860B` | `var(--accent)`, `var(--accent-light)` |
| `#3B82F6`, `#2A6CFF` | `var(--accent)` |
| `#B8C6DE`, `#7F91AD` | `var(--text-1)` |
| `rgba(212, 175, 55, ...)` | `color-mix(in srgb, var(--accent) X%, transparent)` |
| `rgba(59, 130, 246, ...)` | `color-mix(in srgb, var(--accent) X%, transparent)` |
| `rgba(16, 22, 34, ...)` | `rgba(18, 14, 14, ...)` |
| `bg-surface` | `bg-[color:var(--bg-2)]` |
| `text-accent` | `text-[color:var(--accent)]` |

---

## Using Tokens in Tailwind

```tsx
// CSS variable with Tailwind arbitrary value
className="bg-[color:var(--panel)]"
className="text-[color:var(--text-0)]"
className="border-[color:var(--panel-border)]"

// Opacity via color-mix
className="bg-[color:color-mix(in_srgb,var(--accent)_20%,transparent)]"

// Shadow variable
className="shadow-[var(--shadow-soft)]"
```
