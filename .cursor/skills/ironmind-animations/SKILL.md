---
name: ironmind-animations
description: Apply premium animations and micro-interactions to IRONMIND components. Use when implementing loading states, hover effects, page transitions, data reveals, number counters, skeleton loaders, or any motion that enhances the elite performance experience.
---

# IRONMIND Animations & Effects

Every animation must feel deliberate, swift, and premium. No bounce, no wobble, no playfulness.

## Principles

- **Swift**: 150–300ms for interactions, 500ms max for transitions
- **Ease-out**: Decelerating motion feels natural and confident
- **Purposeful**: Feedback, guidance, or delight — never decoration
- **Restrained**: One animated element per user action
- **Theme-aware**: All accent colors use CSS variables (`var(--accent)`, `var(--accent-light)`, `var(--accent-2)`) — never hardcoded hex values

---

## Motion Design Tokens

Define in `:root` of `globals.css` for consistent timing:

```css
:root {
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-page: 500ms;
  --duration-ambient: 3000ms;
  
  --ease-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.6, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## Keyframes (Theme-Aware)

All keyframes in `globals.css` use CSS variables for theme compatibility:

```css
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.72; }
}

@keyframes accent-glint {
  0%, 100% {
    filter: drop-shadow(0 0 4px color-mix(in srgb, var(--accent) 85%, transparent))
            drop-shadow(0 0 8px color-mix(in srgb, var(--accent-light) 35%, transparent));
  }
  50% {
    filter: drop-shadow(0 0 8px var(--accent-light))
            drop-shadow(0 0 12px color-mix(in srgb, var(--accent) 55%, transparent));
  }
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 45%, transparent); }
  70% { box-shadow: 0 0 0 10px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

@keyframes accent-glow {
  0%, 100% {
    box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 22%, transparent),
                inset 0 1px 2px color-mix(in srgb, var(--accent-light) 28%, transparent);
  }
  50% {
    box-shadow: 0 0 30px color-mix(in srgb, var(--accent) 38%, transparent),
                inset 0 1px 2px color-mix(in srgb, var(--accent-light) 35%, transparent);
  }
}

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes count-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes nav-shimmer {
  0% { left: -120%; }
  45% { left: 120%; }
  100% { left: 120%; }
}

@keyframes knight-pulse {
  0%, 100% { opacity: 0.45; filter: brightness(0.8); }
  50%      { opacity: 1;    filter: brightness(1.5) saturate(1.4); }
}

@keyframes ios-spin {
  to { transform: rotate(360deg); }
}
```

### Utility Classes

```css
.pulse-soft       { animation: pulse-soft var(--duration-ambient) var(--ease-in-out) infinite; }
.accent-glint     { animation: accent-glint var(--duration-ambient) ease-in-out infinite; }
.accent-glow      { animation: accent-glow var(--duration-ambient) ease-in-out infinite; }
.animate-pulse-ring { animation: pulse-ring 1.5s var(--ease-in-out) infinite; }
.animate-fade-in-up { animation: fade-in-up var(--duration-slow) var(--ease-out); }
.animate-scale-in   { animation: scale-in var(--duration-normal) var(--ease-out); }
.animate-count-up   { animation: count-up var(--duration-slow) var(--ease-out); }
.knight-led-lit     { animation: knight-pulse 1.8s ease-in-out infinite; }
.knight-led-lit-alt { animation: knight-pulse 1.8s ease-in-out infinite; } /* secondary hue */
```

---

## Hover Effects (Tailwind + CSS Variables)

### Card Lift + Accent Border

```tsx
<div className="rounded-[14px] border border-[color:var(--panel-border)]
  transition-all duration-200
  hover:-translate-y-1
  hover:border-[color:color-mix(in_srgb,var(--accent)_28%,transparent)]
  hover:shadow-[var(--shadow-accent)]">
```

### Button Press

```tsx
<button className="transition-all duration-200 active:scale-95 hover:brightness-110">
```

### Input Focus Glow

```tsx
<input className="transition-all duration-200
  focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]
  focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_12%,transparent)]
  focus:outline-none" />
```

### Nav Item Active Shimmer

Already defined in `globals.css` as `.nav-item.active::after` — uses theme-aware `var(--accent-light)`.

---

## Page Transitions (Framer Motion)

```tsx
import { motion } from 'framer-motion';

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={variants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}
```

## Staggered List

```tsx
const container = {
  animate: { transition: { staggerChildren: 0.05 } }
};
const item = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

<motion.ul variants={container} initial="initial" animate="animate">
  {items.map(i => (
    <motion.li key={i.id} variants={item}>{i.content}</motion.li>
  ))}
</motion.ul>
```

---

## Loading States

### Skeleton (Theme-Aware)

Use `.skeleton` class from `globals.css`:

```tsx
function SkeletonCard() {
  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="skeleton w-1/3 h-3 rounded" />
      <div className="skeleton w-full h-8 rounded" />
      <div className="skeleton w-2/3 h-3 rounded" />
    </div>
  );
}
```

### Spinner (iOS-Style, Theme-Aware)

The `.spinner` class uses a conic gradient with `steps(12)` for an iOS-style activity indicator, themed via `color-mix` with `var(--accent)`. It replaced the old border-spinner pattern.

```tsx
<div className="spinner" />
```

Size variants:

| Class | Size |
|-------|------|
| `.spinner-sm` | 1rem |
| `.spinner` (default) | 1.5rem |
| `.spinner-lg` | 2.5rem |

```tsx
<div className="spinner-sm" />  {/* Inline / compact */}
<div className="spinner" />     {/* Default */}
<div className="spinner-lg" />  {/* Page-level / overlay */}
```

> **Note:** `.skeleton` still exists for placeholder shimmer blocks but `.spinner` is preferred for page-level loading states.

### Progress Bar (Theme-Aware)

```tsx
<div className="h-1.5 rounded-full bg-[color:var(--surface-track)] overflow-hidden">
  <div
    className="h-full rounded-full transition-all duration-500 ease-out"
    style={{
      width: `${progress}%`,
      background: `linear-gradient(90deg, var(--accent), var(--accent-2))`
    }}
  />
</div>
```

---

## Accordion Transitions

Grid-row accordion for smooth height animation without measuring content:

```css
.accordion-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 250ms ease-out;
}
.accordion-wrapper[data-open='true'] {
  grid-template-rows: 1fr;
}
.accordion-inner {
  overflow: hidden;
  opacity: 0;
  transition: opacity 200ms ease-out 0ms;
}
.accordion-wrapper[data-open='true'] .accordion-inner {
  opacity: 1;
  transition: opacity 200ms ease-out 80ms;
}
```

The 80ms delay on opacity creates a "handoff" feel — height starts expanding before content fades in.

Usage:

```tsx
<div className="accordion-wrapper" data-open={isOpen}>
  <div className="accordion-inner">
    {/* Collapsible content */}
  </div>
</div>
```

---

## LED Bar Indicators

Knight Rider–style LED bar used in the top bar for readiness/weight metrics. Each LED is a small dot; active LEDs pulse with the `knight-pulse` keyframe.

```tsx
<div className="flex items-center gap-1">
  {leds.map((active, i) => (
    <span
      key={i}
      className={`knight-led ${active ? 'knight-led-lit' : ''}`}
    />
  ))}
</div>
```

- `.knight-led` — Base dot (dim, themed background)
- `.knight-led-lit` — Active LED with `knight-pulse` animation (primary accent)
- `.knight-led-lit-alt` — Active LED with `knight-pulse` animation (secondary hue, e.g. for alternate metrics)

The animation runs at 1.8s ease-in-out infinite, pulsing between 0.45 and full opacity with a brightness/saturation boost at peak.

---

## Data Animation Patterns

### Animated Counter

```tsx
import { useEffect, useRef, useState } from 'react';

export function AnimatedCounter({ target, duration = 800 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <span className="font-mono tabular-nums">{value.toLocaleString()}</span>;
}
```

### Ring Progress (Theme-Aware via inline style)

```tsx
export function ProgressRing({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8 
}: { 
  value: number; 
  max: number; 
  size?: number; 
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle 
        cx={size/2} cy={size/2} r={radius} fill="none"
        stroke="var(--panel-border)" 
        strokeWidth={strokeWidth} 
      />
      <circle 
        cx={size/2} cy={size/2} r={radius} fill="none"
        stroke="var(--accent)" 
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out" 
      />
    </svg>
  );
}
```

---

## Micro-interactions

### Gradient Border Card (Theme-Aware)

Use `.gradient-border` class from `globals.css`:

```tsx
<div className="gradient-border">
  <div className="bg-[color:var(--panel-strong)] p-6">
    Content
  </div>
</div>
```

### Spotlight Sweep on Hover

Use `.spotlight-hover` class from `globals.css`:

```tsx
<div className="spotlight-hover rounded-[14px] glass-panel p-6">
  Content
</div>
```

---

## Duration Standards

| Interaction | Duration Token | Value |
|-------------|----------------|-------|
| Button click | `--duration-instant` | 100ms |
| Hover state | `--duration-normal` | 200ms |
| Modal open | `--duration-normal` | 200ms |
| Page enter | `--duration-slow` | 300ms |
| Chart bars | `--duration-page` | 500ms |
| Counter | custom | 800ms |
| Ambient glow | `--duration-ambient` | 3000ms |

---

## Reduced Motion

Always respect user preferences. The global rule in `globals.css` handles this:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

For Framer Motion components:

```tsx
import { useReducedMotion } from 'framer-motion';

function MyAnim() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={reduce ? false : { opacity: 0, y: 10 }}>
      Content
    </motion.div>
  );
}
```
