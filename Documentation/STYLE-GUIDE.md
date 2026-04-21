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

| Token | Value | Role |
|------|------|------|
| `--bg-0` | `#080808` | Main canvas |
| `--bg-1` | `#0D0D0D` | Section background |
| `--bg-2` | `#131313` | Elevated background |
| `--panel` | `rgba(18, 14, 14, 0.78)` | Glass panel base |
| `--panel-border` | `rgba(65, 50, 50, 0.40)` | Panel edge |
| `--text-0` | `#F0F0F0` | Primary text |
| `--text-1` | `#9A9A9A` | Secondary text |
| `--text-2` | `#5E5E5E` | Labels/meta |

### Accent + status

| Token | Value | Role |
|------|------|------|
| `--accent` | `#DC2626` | Primary accent |
| `--accent-2` | `#991B1B` | Dark accent |
| `--accent-light` | `#EF4444` | Bright accent |
| `--good` | `#22C55E` | Positive state |
| `--warn` | `#F59E0B` | Warning |
| `--bad` | `#EF4444` | Error |

### Theme modes

- `crimson` (default)
- `hot-pink`
- `custom` (user-set accent color)

Theme is controlled by `useUIStore` and synchronized through `ThemeSync`.

---

## 3) Shared selected-state system

Use `.is-selected` (defined in `globals.css`) for selected tabs/cards/buttons so selected glow and border feel synchronized across pages.

Current usage includes:

- Dashboard cycle-day tabs
- Dashboard selected session panel
- Nutrition day-type selector
- Recovery `Log`/`Trends` switcher
- Demo profile selection cards

When adding a new selector, prefer `.is-selected` over custom one-off selected classes.

---

## 4) Layout chrome

Persistent navigation chrome uses:

- `--chrome-bg`
- `--chrome-bg-topbar`
- `--chrome-bg-toggle`

Use these in sidebar/topbar/mobile-nav. Do not hardcode cool greys for app rails.

---

## 5) Typography

- **Headings:** Rajdhani, strong weight, tight tracking
- **Body text:** Rajdhani / system sans at readable contrast
- **Numbers and metrics:** monospace with `tabular-nums`
- **Label rows:** uppercase + tracking + `--text-2`

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

