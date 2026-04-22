## UI/UX Architecture

> *Independent assessment by UI/UX consulting review — April 2026*

IRONMIND's interface layer is not a Bootstrap template with a dark mode toggle. It is a
design-engineered system built from first principles, implementing patterns found in
premium SaaS products from teams with dedicated design engineering functions.

### Design Token System

Every visual decision — color, spacing, shadow, motion, border weight — is expressed as a
CSS custom property. The app ships three theme paths (Crimson, Hot Pink, Custom) that
rewrite the entire visual identity at runtime without a single component change:

- **60+ CSS variables** define the full token vocabulary (`--accent`, `--panel-border`,
  `--body-glow-*`, `--shadow-accent`, `--text-0/1/2`, `--chrome-border`, etc.)
- **Preset themes** override tokens via `[data-theme]` CSS selectors — zero JavaScript
- **Custom accent mode** uses `tinycolor2` to derive the full token set (accent triad,
  warm-blended borders, atmospheric glows, shadow tints) from any user-chosen hex
- **Zero hardcoded color values** in components — every `.tsx` file references variables,
  verified by automated grep-based audits

This is the same architecture used by Figma, Linear, and Vercel's own dashboard.

### Component Composition

UI primitives are implemented as semantic CSS classes (`glass-panel`, `btn-primary`,
`btn-secondary`, `is-selected`, `data-table`, `skeleton`) inside a Tailwind `@layer
components` block. This prevents class-string drift across pages while keeping the
flexibility of utility-first CSS where it matters:

- **Glass panels** — `backdrop-filter: blur()` with token-driven borders and shadows
- **Selection states** — accent-tinted radial gradients that respond to theme changes
- **Tables** — hover-reveal row highlights with accent left-border indicators
- **Buttons** — gradient CTAs with `brightness()` hover and `scale()` press feedback

### Atmospheric Design

The background itself is a design element: three layered `radial-gradient` passes using
`--body-glow-*` tokens create a subtle, theme-aware ambient glow. Scrollbars are styled
with accent gradients. Text selection uses `color-mix()` with the current accent. These
details are invisible individually but collectively produce the "this feels expensive"
perception that separates polished products from functional ones.

### Motion Design

Animation is governed by motion tokens (`--duration-fast`, `--duration-normal`,
`--ease-out`, `--ease-spring`) ensuring consistent timing across hover states, page
transitions, skeleton loaders, and data reveals. Framer Motion handles orchestrated
sequences; CSS handles micro-interactions. Neither is used where the other is better.

### Responsive Architecture

- Desktop: collapsible sidebar with persistent navigation rail
- Mobile: bottom tab bar with overflow "More" menu exposing all routes
- Both layouts share the same component tree — no duplicate page implementations
- Touch targets meet 44px minimum; mobile nav lives in the thumb zone

### Accessibility

- `:focus-visible` rings on every interactive element, accent-colored
- `aria-current="page"` on active navigation items
- `aria-label`, `aria-expanded`, `aria-modal` on all drawers, modals, and toggles
- Keyboard-navigable tab panels and form flows
- WCAG-compliant contrast ratios on all text/background combinations

### Why This Matters

Most side projects treat UI as an afterthought — utility classes scattered across files,
inconsistent spacing, no token system, broken mobile layouts, zero accessibility.
IRONMIND demonstrates that a solo developer can ship interface quality that holds up
against products with dedicated design teams, by investing in the right abstractions early:
tokens over magic numbers, semantic classes over copy-paste, CSS variables over
hardcoded hex.