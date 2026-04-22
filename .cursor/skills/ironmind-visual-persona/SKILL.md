---
name: ironmind-visual-persona
description: Apply the IRONMIND brand persona and visual language. Use when creating brand elements, selecting color treatment, writing UI copy, establishing visual hierarchy, or making design decisions that affect the premium masculine aesthetic of the elite bodybuilding performance system.
---

# IRONMIND Visual Persona

## Brand Essence

IRONMIND is a **raw performance system** for elite athletes. Not a finance dashboard — a war room.

**Blood, strength, sweat, growth.** Every pixel earns its place.

### Core Attributes

| Attribute | Visual Expression |
|-----------|------------------|
| **Strength** | Heavy weights, aggressive contrasts, accent fire |
| **Precision** | Data-driven grids, monospace numbers, exact measurements |
| **Rawness** | Pure dark backgrounds, no luxury softness — app chrome uses warm blacks (`var(--chrome-bg)`), not flat cool grey bars |
| **Intelligence** | Smart data displays, clean information architecture |
| **Masculine** | Angular geometry, deep blacks, blood-red accents |

---

## Theming System

IRONMIND supports multiple color themes via CSS custom properties. The default is **Crimson** (`#DC2626`), but themes like **Hot Pink** (`#FF3EA5`) are available.

### Theme-Aware Development Rules

1. **Always use CSS variables** for accent colors — never hardcode hex values
2. **Use `var(--accent)`** for primary accent, `var(--accent-light)` for highlights, `var(--accent-2)` for dark tones
3. **Use `color-mix()`** for opacity variants: `color-mix(in srgb, var(--accent) 20%, transparent)`
4. **Neutral colors are fixed** — backgrounds (`--bg-0`, `--bg-1`, `--bg-2`) and text (`--text-0`, `--text-1`, `--text-2`) don't change per theme

### Available Themes

| Theme | `data-theme` | Accent | Use Case |
|-------|--------------|--------|----------|
| **Crimson** | (default) | `#DC2626` | Default — blood, intensity, power |
| **Hot Pink** | `hot-pink` | `#FF3EA5` | Alternative — high energy, modern edge |

To apply a theme: `<html data-theme="hot-pink">`.

---

## Color Psychology (Theme-Aware)

| Token | Default Hex | Emotion | Use When |
|-------|-------------|---------|----------|
| `--bg-0` | `#080808` | Power, void, foundation | Background base |
| `--accent` | `#DC2626` | Blood, strength, drive | PRs, milestones, CTAs, active nav |
| `--accent-light` | `#EF4444` | Fire, urgency | Active indicators, highlights |
| `--accent-2` | `#991B1B` | Iron, depth, permanence | Shadows, glows, dark accents |
| `--good` | `#22C55E` | Growth, completion | Goals hit, meals done, sets done |
| `--warn` | `#F59E0B` | Warning, caution | Recovery flags, near-limits |
| `--bad` | `#EF4444` | Danger, error | Failures, errors |
| `--text-1` | `#9A9A9A` | Precision, neutral support | Secondary text |
| `--text-2` | `#5E5E5E` | Silence, structure | Labels, hints |

**Color ratio rule**: 85% dark neutrals · 12% text · 3% accent.

Accent is precious — use only where it matters. Overusing it dilutes the impact.

---

## Typography Voice

| Font | Feel | Usage |
|------|------|-------|
| **Rajdhani** | Bold, technical, precise | Headlines and section titles |
| **Inter** | Clean, modern, neutral | Body text, labels, UI chrome |
| **JetBrains Mono** | Data, code, precision | All numbers and metrics |
| **Cinzel** | Luxury, timeless strength | Brand logo, PR moments only |

**Rules**:
- Headlines: `font-heading`, `-0.02em` letter-spacing, `font-weight: 600-700`
- Labels: ALL CAPS, `tracking-[0.3em]`, muted color (`var(--text-2)`)
- Numbers: always `font-mono tabular-nums` — no exceptions
- Body: Rajdhani/Inter, `leading-[1.5]`, `var(--text-1)` color
- **Contrast for small badges:** Use `.exercise-index-badge` for ordered exercises — warm-dark tile + `var(--text-0)` numerals. Avoid grey-on-saturated-accent pills (unreadable).

---

## Forbidden Elements

Never use in IRONMIND:

- ❌ Pastel colors (pink, mint, lilac, baby blue)
- ❌ Rounded bubbly shapes (border-radius > 16px on containers)
- ❌ Playful emoji in UI chrome
- ❌ Comic sans or display fonts that feel "fun"
- ❌ Sparkles, confetti, rainbow gradients
- ❌ Cartoon-style illustration
- ❌ Box shadows on every single element
- ❌ Pure white backgrounds
- ❌ Gradient text on body copy (only headlines/brand)
- ❌ Hardcoded accent hex values (use CSS variables)

---

## Brand Moments

### Personal Record

```
- Full overlay: rgba(0,0,0,0.88) backdrop
- Large accent-lit number in JetBrains Mono
- "PERSONAL RECORD" in Cinzel, accent gradient
- Subtle upward accent-colored particles (CSS only)
- Auto-dismiss after 3 seconds
```

### Phase Transition

```
- Crossfade: 0.5s ease-out
- Accent line sweeps across screen
- Old phase name fades out, new fades in
- Keep interaction possible throughout
```

### Goal Achieved

```
- Ring fills to 100% with accent stroke
- Scale-in checkmark (0.2s ease-out, green for completion)
- "TARGET MET" badge appears with count-up animation
- No confetti — a brief accent glow pulse instead
```

---

## Visual Hierarchy Rules

1. **Size**: Larger = more important. Data values must dominate cards.
2. **Weight**: Heavier = more important. Labels are lighter than values.
3. **Color**: Accent > Good (green) > Text. Reserve accent for the single most important thing per view.
4. **Contrast**: Primary content uses `var(--text-0)`. Supporting uses `var(--text-1)`. Hints use `var(--text-2)`.
5. **Spacing**: Use generous whitespace. Dense = overwhelming. Elite = spacious.

---

## Data Display Patterns

### Metric Card Pattern

```
┌─────────────────────────────┐
│ LABEL              [BADGE]  │  ← uppercase, muted
│                             │
│ 1,250                       │  ← large monospace number
│                             │
│ +12 from last week          │  ← small secondary text
└─────────────────────────────┘
```

### Trend Indicator Pattern

```
▲ +2.5kg  (green)   = progress
▼ -1.2kg  (red)     = regression
— 0.0kg   (muted)   = stagnant
```

### Compliance Ring Pattern

```
  ● 87%               ← large number center
[=========-]         ← colored arc, accent when ≥90%
Nutrition Adherence  ← label below
```

---

## Responsive Personality

### Mobile (< 768px)

- Single column, full-width cards
- Reduced typography scale (but still bold)
- Bottom tab navigation, thumb-zone actions
- Feel: **Pocket command center**

### Tablet (768px–1024px)

- Two-column grid
- Condensed sidebar or bottom tabs
- Feel: **Performance dashboard**

### Desktop (> 1024px)

- Multi-column, generous whitespace
- Persistent sidebar
- Full data visualizations
- Feel: **Mission control**

---

## UI Copy Voice

- **Direct**: "Log Workout" not "Start Tracking Your Workout"
- **Precise**: "Day 7 of 14" not "You're halfway through!"
- **Active**: "View Progress" not "See How You're Doing"
- **Professional**: "Recovery Score: 82/100" not "You're feeling great today!"
- **No fluff**: Never add filler words to labels or buttons

---

## Quality Checklist

Before shipping UI:

- [ ] Colors use CSS variables, not hardcoded hex
- [ ] All numbers use monospace font
- [ ] Typography hierarchy is unambiguous
- [ ] Accent used sparingly (max 2–3 elements per view)
- [ ] Shadows are subtle and intentional
- [ ] Contrast ≥ 4.5:1 for all text
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] No forbidden elements present
- [ ] Copy is direct and concise
- [ ] Dark background with proper depth layers
- [ ] Theme switches correctly if `data-theme` changes
