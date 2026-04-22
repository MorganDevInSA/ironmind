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
  `--panel-border-hover`, `--panel-glow`, `--body-glow-*`, `--shadow-accent`,
  `--text-0/1/2`, `--chrome-border`, etc.)
- **Preset themes** override tokens via `[data-theme]` CSS selectors — zero JavaScript
- **Custom accent mode** uses `tinycolor2` to derive the full token set (accent triad,
  warm-blended borders, theme-tinted secondary text, atmospheric glows, shadow tints)
  from any user-chosen hex
- **Zero hardcoded color values** in components — every `.tsx` file references variables,
  verified by automated grep-based audits. Tailwind accent utilities (`text-accent`,
  `bg-accent`) are explicitly forbidden as they bypass the theme system.

This is the same architecture used by Figma, Linear, and Vercel's own dashboard.

### Interactive Panel System

Panels are not static containers — they respond to user interaction through a three-tier
visual hierarchy driven entirely by CSS:

- **Resting**: near-invisible 6% accent border — panels recede into the dark background
- **Hover / focus-within**: border intensifies to 62% accent with a subtle outer glow,
  matching the active navbar button treatment
- **Selected (`.is-selected`)**: full accent border with radial gradient background

Transitions are asymmetric: border-color at 200ms ease-out (snappy response), box-shadow
at 300ms ease-out (glow trails slightly behind, creating a "breathing" feel). No layout
shift — border-width stays at 1px throughout, only color and shadow change.

### Accordion Expand/Collapse

Expandable content uses CSS `grid-template-rows` animation — the modern way to animate
height from 0 to auto without JavaScript measurement or `requestAnimationFrame`:

- `.accordion-wrapper` with `data-open` attribute controls the 250ms height transition
- `.accordion-inner` handles overflow clipping and an 80ms-delayed opacity fade
- Mutual exclusion via single `useState<string | null>` — clicking panel B automatically
  collapses panel A while B expands, creating a smooth "handoff"

Applied across Nutrition (meal details), Workout (exercise sets), User Guide (sections),
and Onboarding (demo data panel).

### Component Composition

UI primitives are implemented as semantic CSS classes (`glass-panel`, `btn-primary`,
`btn-secondary`, `is-selected`, `data-table`, `spinner`) inside a Tailwind `@layer
components` block. This prevents class-string drift across pages while keeping the
flexibility of utility-first CSS where it matters:

- **Glass panels** — `backdrop-filter: blur()` with token-driven borders, interactive
  hover states, and shadow transitions
- **Selection states** — accent-tinted radial gradients synchronized across nav items,
  tabs, and cards
- **Tables** — hover-reveal row highlights with accent left-border indicators
- **Buttons** — gradient CTAs with `brightness()` hover and `scale()` press feedback
- **Native form controls** — checkboxes and radios globally themed via `accent-color`

### iOS-Style Loading Spinner

Loading states use a themed iOS activity indicator — a 12-segment conic gradient that
steps discretely (via `steps(12)`) and derives its color from `var(--accent)` through
`color-mix()`. Size variants (`.spinner-sm`, `.spinner`, `.spinner-lg`) cover inline
buttons to full-page loading. Skeleton loaders exist but spinners are the default.

### Knight Rider LED Indicators

The top bar features two synced LED bar indicators for readiness score and weight-to-target
ratio. Each bar renders 10-12 segments with:

- **Primary bar** (`--accent-light`): readiness score proportionally fills segments
- **Secondary bar** (`--accent-2`): weight proximity to target
- **Synced pulse**: `knight-pulse` keyframe with `brightness(1.5)` and `saturate(1.4)` at
  peak, staggered 60ms per segment for the classic scanner sweep
- **Hover tooltip**: slides down with readiness label (Peak/Primed/Solid/Moderate/Fatigued)
  and weight status (On Target/Close/Cutting/Building)

### Atmospheric Design

The background itself is a design element: three layered `radial-gradient` passes using
`--body-glow-*` tokens create a subtle, theme-aware ambient glow. Scrollbars are styled
with accent gradients. Text selection uses `color-mix()` with the current accent. Page
titles render in the active accent color for branded identity. These details are invisible
individually but collectively produce the "this feels expensive" perception that separates
polished products from functional ones.

### Motion Design

Animation is governed by motion tokens (`--duration-fast`, `--duration-normal`,
`--ease-out`, `--ease-spring`) ensuring consistent timing across hover states, page
transitions, accordion reveals, and data reveals. Framer Motion handles orchestrated
sequences; CSS handles micro-interactions. Neither is used where the other is better.

### Responsive Architecture

- Desktop: collapsible sidebar with persistent navigation rail, `max-w-4xl` centered
  content well
- Mobile: bottom tab bar with overflow "More" menu exposing all routes
- Both layouts share the same component tree — no duplicate page implementations
- Touch targets meet 44px minimum; mobile nav lives in the thumb zone

### Accessibility

- `:focus-visible` rings on every interactive element, accent-colored
- `aria-current="page"` on active navigation items
- `aria-label`, `aria-expanded`, `aria-modal` on all drawers, modals, and toggles
- `role="status"` on readiness indicators with full descriptive labels
- Keyboard-navigable tab panels and form flows
- WCAG-compliant contrast ratios on all text/background combinations
- `@media (prefers-reduced-motion: reduce)` kills all animation globally

### Why This Matters

Most side projects treat UI as an afterthought — utility classes scattered across files,
inconsistent spacing, no token system, broken mobile layouts, zero accessibility.
IRONMIND demonstrates that a solo developer can ship interface quality that holds up
against products with dedicated design teams, by investing in the right abstractions early:
tokens over magic numbers, semantic classes over copy-paste, CSS variables over hardcoded
hex, interactive states over static containers.
