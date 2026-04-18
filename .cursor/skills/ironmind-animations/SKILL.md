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

---

## Required Keyframes

Add all to `src/app/globals.css`:

```css
@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.72; }
}

@keyframes gold-glint {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(212,175,55,0.8)) drop-shadow(0 0 8px rgba(244,208,63,0.4));
  }
  50% {
    filter: drop-shadow(0 0 8px rgba(244,208,63,1)) drop-shadow(0 0 12px rgba(244,208,63,0.6));
  }
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
  70% { box-shadow: 0 0 0 10px rgba(59,130,246,0); }
  100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
}

@keyframes gold-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(212,175,55,0.2), inset 0 1px 2px rgba(244,208,63,0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(212,175,55,0.4), inset 0 1px 2px rgba(244,208,63,0.5);
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

.pulse-soft { animation: pulse-soft 2s cubic-bezier(0.4,0,0.6,1) infinite; }
.gold-glint { animation: gold-glint 3s ease-in-out infinite; }
.gold-glow { animation: gold-glow 3s ease-in-out infinite; }
.animate-pulse-ring { animation: pulse-ring 1.5s cubic-bezier(0.4,0,0.6,1) infinite; }
.animate-fade-in-up { animation: fade-in-up 0.3s ease-out; }
.animate-scale-in { animation: scale-in 0.2s ease-out; }
.animate-count-up { animation: count-up 0.3s ease-out; }

.skeleton {
  background: rgba(18,24,38,0.9);
  background-image: linear-gradient(
    90deg,
    rgba(255,255,255,0) 0,
    rgba(255,255,255,0.03) 20%,
    rgba(255,255,255,0.08) 60%,
    rgba(255,255,255,0)
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Hover Effects (Tailwind)

### Card Lift + Gold Border

```tsx
<div className="rounded-[14px] border border-[rgba(80,96,128,0.25)]
  transition-all duration-200
  hover:-translate-y-1
  hover:border-[rgba(212,175,55,0.25)]
  hover:shadow-[0_8px_32px_rgba(212,175,55,0.25)]">
```

### Button Press

```tsx
<button className="transition-all duration-200 active:scale-95 hover:brightness-110">
```

### Input Focus Glow

```tsx
<input className="transition-all duration-200
  focus:border-[rgba(212,175,55,0.4)]
  focus:shadow-[0_0_0_3px_rgba(212,175,55,0.1)]
  focus:outline-none" />
```

### Nav Item Active Shimmer (CSS pseudo-element)

```css
.nav-item {
  position: relative;
  overflow: hidden;
}

.nav-item::after {
  content: "";
  position: absolute;
  top: 0;
  left: -120%;
  width: 120%;
  height: 100%;
  background: linear-gradient(
    110deg,
    transparent 0%,
    rgba(255,220,140,0.05) 35%,
    rgba(255,220,140,0.20) 50%,
    rgba(255,220,140,0.05) 65%,
    transparent 100%
  );
  opacity: 0;
}

.nav-item.active::after {
  opacity: 0.55;
  animation: nav-shimmer 3.8s ease-in-out infinite;
}
```

---

## Page Transitions (Framer Motion)

```tsx
// app/components/providers/page-transition.tsx
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

### Skeleton Card

```tsx
function SkeletonCard() {
  return (
    <div className="rounded-[14px] p-5 bg-[rgba(16,22,34,0.72)] border border-[rgba(80,96,128,0.25)] space-y-4">
      <div className="skeleton w-1/3 h-3 rounded" />
      <div className="skeleton w-full h-8 rounded" />
      <div className="skeleton w-2/3 h-3 rounded" />
    </div>
  );
}
```

### Spinner

```tsx
<div className="inline-block w-6 h-6 rounded-full animate-spin
  border-[3px] border-[rgba(80,96,128,0.6)] border-t-[#D4AF37]" />
```

### Progress Bar

```tsx
<div className="h-1.5 rounded-full bg-[#141414] overflow-hidden">
  <div
    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600
      transition-all duration-500 ease-out"
    style={{ width: `${progress}%` }}
  />
</div>
```

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
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <span className="font-mono tabular-nums">{value.toLocaleString()}</span>;
}
```

### Ring Progress (SVG)

```tsx
export function ProgressRing({ value, max, size = 120, strokeWidth = 8, color = '#D4AF37' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / max) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none"
        stroke="rgba(80,96,128,0.2)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-700 ease-out" />
    </svg>
  );
}
```

---

## Micro-interactions

### Gradient Border Card

```tsx
<div className="relative rounded-[14px] p-[1px]
  bg-gradient-to-r from-[rgba(212,175,55,0.2)] via-transparent to-[rgba(212,175,55,0.2)]">
  <div className="rounded-[14px] bg-[rgba(16,22,34,0.9)] p-6">
    Content
  </div>
</div>
```

### Spotlight Sweep on Hover

```tsx
<div className="relative overflow-hidden rounded-[14px]
  before:absolute before:inset-0 before:pointer-events-none
  before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent
  before:-translate-x-full hover:before:translate-x-full
  before:transition-transform before:duration-700">
  <div className="relative z-10 p-6">Content</div>
</div>
```

---

## Duration Standards

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Button click | 100ms | ease-out |
| Hover state | 200ms | ease-out |
| Modal open | 200ms | ease-out |
| Page enter | 300ms | ease-out |
| Chart bars | 500ms | ease-out |
| Counter | 800ms | cubic ease-out |
| Ambient glow | 3000ms | ease-in-out |

---

## Reduced Motion

Always wrap complex animations:

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
