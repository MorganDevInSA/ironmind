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
| **Strength** | Heavy weights, aggressive contrasts, crimson fire |
| **Precision** | Data-driven grids, monospace numbers, exact measurements |
| **Rawness** | Pure dark backgrounds, no luxury softness, no blue-grey — **app chrome** (header, sidebar, mobile nav) uses warm blacks (`--chrome-bg`; header uses `--chrome-bg-topbar` = same value), not flat cool `#2e2e2e` bars |
| **Intelligence** | Smart data displays, clean information architecture |
| **Masculine** | Angular geometry, deep blacks, blood-red accents |

---

## Color Psychology

| Color | Hex | Emotion | Use When |
|-------|-----|---------|----------|
| Absolute Black | `#080808` | Power, void, foundation | Background base |
| Crimson | `#DC2626` | Blood, strength, drive | PRs, milestones, CTAs, active nav |
| Red | `#EF4444` | Fire, urgency | Active indicators, error, danger |
| Deep Crimson | `#991B1B` | Iron, depth, permanence | Shadows, glows, dark accents |
| Success Green | `#22C55E` | Growth, completion | Goals hit, meals done, sets done |
| Amber | `#F59E0B` | Warning, caution | Recovery flags, near-limits |
| Iron Grey | `#9A9A9A` | Precision, neutral support | Secondary text |
| Charcoal | `#5E5E5E` | Silence, structure | Labels, hints |

**Color ratio rule**: 85% dark neutrals · 12% text · 3% crimson.

Crimson is blood — use only where it matters. Overusing it dilutes the impact.

---

## Typography Voice

| Font | Feel | Usage |
|------|------|-------|
| **Rajdhani** | Bold, technical, precise | Headlines and section titles (`globals.css` import) |
| **Inter** | Clean, modern, neutral | Body text, labels, UI chrome (Tailwind default `sans`) |
| **JetBrains Mono** | Data, code, precision | All numbers and metrics |
| **Cinzel** | Luxury, timeless strength | Brand logo, PR moments only |

**Rules**:
- Headlines: `font-heading`, `-0.02em` letter-spacing, `font-weight: 600-700`
- Labels: ALL CAPS, `tracking-[0.3em]`, muted color (`--text-2`)
- Numbers: always `font-mono tabular-nums` — no exceptions
- Body: `Inter`, `leading-[1.5]`, `--text-1` color
- **Contrast for small badges:** Ordered exercise indices use **`.exercise-index-badge`** (`globals.css`) — warm-dark tile (`--exercise-index-bg`) and **`--text-0`** numerals. Avoid **grey-on-saturated-red** pills (unreadable); crimson stays on **borders / accents**, not low-contrast fill behind grey text.

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

---

## Brand Moments

### Personal Record

```
- Full overlay: rgba(0,0,0,0.88) backdrop
- Large crimson-lit number in JetBrains Mono
- "PERSONAL RECORD" in Cinzel, crimson gradient (#FF4040 → #DC2626 → #991B1B)
- Subtle upward crimson particles (CSS only)
- Auto-dismiss after 3 seconds
```

### Phase Transition

```
- Crossfade: 0.5s ease-out
- Crimson accent line sweeps across screen
- Old phase name fades out, new fades in
- Keep interaction possible throughout
```

### Goal Achieved

```
- Ring fills to 100% with crimson stroke
- Scale-in checkmark (0.2s ease-out, green for completion)
- "TARGET MET" badge appears with count-up animation
- No confetti — a brief crimson glow pulse instead
```

---

## Visual Hierarchy Rules

1. **Size**: Larger = more important. Data values must dominate cards.
2. **Weight**: Heavier = more important. Labels are lighter than values.
3. **Color**: Gold > Blue > Green > Text. Reserve gold for the single most important thing per view.
4. **Contrast**: Primary content uses `--text-0`. Supporting uses `--text-1`. Hints use `--text-2`.
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
[=========-]         ← colored arc, gold when ≥90%
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

- [ ] Colors match palette exactly
- [ ] All numbers use monospace font
- [ ] Typography hierarchy is unambiguous
- [ ] Gold used sparingly (max 1-2 elements per view)
- [ ] Shadows are subtle and intentional
- [ ] Contrast ≥ 4.5:1 for all text
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] No forbidden elements present
- [ ] Copy is direct and concise
- [ ] Dark background with proper depth layers
