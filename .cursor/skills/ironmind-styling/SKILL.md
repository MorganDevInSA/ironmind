---
name: ironmind-styling
description: Apply IRONMIND crimson/black UI styling. Use when implementing buttons, cards, panels, badges, typography, data displays, or any UI element. References this file for the full token system.
---

# IRONMIND UI/UX Styling — Crimson Theme

Blood, strength, sweat, growth. Pure dark with crimson fire.

## Color Tokens (Quick Reference)

```
Backgrounds: #080808 | #0D0D0D | #131313
Text:        #F0F0F0 | #9A9A9A | #5E5E5E   ← neutral grey, no blue tint
Accent:      #DC2626 (crimson) — replaces ALL gold and blue
Status:      #22C55E (good) | #F59E0B (warn) | #EF4444 (bad)
Panels:      rgba(18,14,14,0.78) blur-xl | border: rgba(65,50,50,0.40)
```

---

## Buttons

### Primary (Crimson CTA)

```tsx
<button className="px-6 py-3 rounded-lg font-semibold text-white border
  bg-gradient-to-r from-[#DC2626] to-[#B91C1C] border-[rgba(220,38,38,0.5)]
  shadow-[0_12px_22px_rgba(220,38,38,0.25)]
  hover:brightness-110 active:scale-95 transition-all duration-200">
  Action
</button>
```

### Secondary

```tsx
<button className="px-6 py-3 rounded-lg font-semibold text-[#9A9A9A]
  bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
  hover:border-[rgba(220,38,38,0.45)] hover:text-[#F0F0F0]
  active:scale-95 transition-all duration-200">
  Action
</button>
```

### Crimson Premium CTA

```tsx
<button className="px-6 py-3 rounded-lg font-semibold text-white
  bg-gradient-to-r from-[#DC2626] to-[#991B1B]
  border border-[rgba(220,38,38,0.5)] shadow-[0_8px_24px_rgba(220,38,38,0.20)]
  hover:brightness-110 active:scale-95 transition-all duration-200">
  Start Workout
</button>
```

### Ghost

```tsx
<button className="px-4 py-2 rounded-lg font-medium text-[#5E5E5E]
  hover:text-[#F0F0F0] hover:bg-[rgba(22,16,16,0.6)]
  active:scale-95 transition-all duration-200">
  Action
</button>
```

---

## Cards & Panels

### Glass Panel (standard card)

```tsx
<div className="relative rounded-[14px] p-6
  bg-[rgba(18,14,14,0.78)] backdrop-blur-xl
  border border-[rgba(65,50,50,0.40)]
  shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
  Content
</div>
```

### Hover Card (crimson border on hover)

```tsx
<div className="relative rounded-[14px] p-6
  bg-[rgba(18,14,14,0.78)] backdrop-blur-xl
  border border-[rgba(65,50,50,0.40)]
  shadow-[0_10px_24px_rgba(0,0,0,0.45)]
  hover:border-[rgba(220,38,38,0.30)] hover:shadow-[0_8px_32px_rgba(220,38,38,0.20)]
  transition-all duration-200 cursor-pointer">
  Content
</div>
```

### Strong Panel (modals, alerts)

```tsx
<div className="relative rounded-[14px] p-6
  bg-[rgba(18,14,14,0.94)] backdrop-blur-xl
  border border-[rgba(65,50,50,0.40)]
  shadow-[0_16px_40px_rgba(0,0,0,0.60)]">
  Content
</div>
```

---

## Metric / Data Cards

```tsx
<div className="rounded-[14px] p-5 flex flex-col gap-3
  bg-[rgba(18,14,14,0.78)] backdrop-blur-xl
  border border-[rgba(65,50,50,0.40)]
  shadow-[0_10px_24px_rgba(0,0,0,0.45)]">

  <div className="flex items-center justify-between">
    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#5E5E5E]">
      MUSCLE VOLUME
    </span>
    <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest
      px-3 py-1 rounded-full bg-[rgba(220,38,38,0.12)] text-[#EF4444]
      border border-[rgba(220,38,38,0.35)] [text-shadow:0_0_8px_rgba(220,38,38,0.4)]">
      ON TRACK
    </span>
  </div>

  <div className="text-4xl font-bold text-[#F0F0F0] font-mono tabular-nums">
    42
  </div>

  <div className="text-sm text-[#9A9A9A]">sets this week</div>
</div>
```

---

## Status Badges

```tsx
// Active / Good
<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md
  text-xs font-semibold uppercase tracking-wide border
  bg-emerald-500/[0.12] text-emerald-400 border-emerald-500/[0.35]">
  Done
</span>

// Warning
<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md
  text-xs font-semibold uppercase tracking-wide border
  bg-amber-500/[0.12] text-amber-400 border-amber-500/[0.35]">
  Warning
</span>

// Error
<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md
  text-xs font-semibold uppercase tracking-wide border
  bg-red-500/[0.12] text-red-400 border-red-500/[0.35]">
  Error
</span>

// Crimson / PR / KPI
<span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md
  text-xs font-semibold uppercase tracking-wide border
  bg-[rgba(220,38,38,0.12)] text-[#EF4444] border-[rgba(220,38,38,0.35)]
  [text-shadow:0_0_8px_rgba(220,38,38,0.4)]">
  PR
</span>
```

---

## Typography

```tsx
// Page title
<h1 className="text-[1.875rem] font-bold font-heading tracking-tight text-[#F0F0F0]">
  Title
</h1>

// Data label (ALL CAPS)
<span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#5E5E5E]">
  SETS / WEEK
</span>

// Large data value
<span className="text-4xl font-bold text-[#F0F0F0] font-mono tabular-nums">
  12,450
</span>

// Brand text (crimson gradient)
<span className="font-heading font-bold tracking-wide
  bg-gradient-to-r from-[#FF4040] via-[#DC2626] to-[#991B1B]
  bg-clip-text text-transparent
  [filter:drop-shadow(0_2px_12px_rgba(220,38,38,0.4))]">
  IRONMIND
</span>
```

---

## Navigation Items

```tsx
<button className="w-full h-[54px] rounded-[14px] flex items-center gap-3 px-[18px]
  bg-[rgba(28,22,22,0.55)] border border-white/[0.05]
  text-[#9A9A9A] transition-all duration-[220ms]
  hover:bg-[rgba(38,28,28,0.75)] hover:border-white/[0.10] hover:-translate-y-px
  active:scale-95
  data-[active=true]:bg-[rgba(22,10,10,0.94)]
  data-[active=true]:border-[rgba(220,38,38,0.40)]
  data-[active=true]:shadow-[0_0_14px_rgba(220,38,38,0.12)]
  data-[active=true]:text-[#EF4444]"
  data-active={isActive}>
  <Icon className="w-5 h-5" />
  <span className="text-sm font-semibold tracking-wide">Label</span>
</button>
```

---

## Divider

```tsx
<hr className="h-px my-4 border-0
  bg-gradient-to-r from-transparent via-[rgba(220,38,38,0.30)] to-transparent" />
```

---

## Form Inputs

```tsx
<input className="w-full px-4 py-3 rounded-lg
  bg-[#131313] border border-[rgba(65,50,50,0.40)]
  text-[#F0F0F0] placeholder:text-[#5E5E5E]
  focus:border-[rgba(220,38,38,0.50)]
  focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10)]
  focus:outline-none transition-all duration-200" />
```

---

## Data Tables

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-[rgba(220,38,38,0.20)]">
      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#5E5E5E]">
        Col
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-[rgba(65,50,50,0.25)]
      hover:bg-[rgba(22,16,16,0.55)] hover:border-l-2 hover:border-l-[rgba(220,38,38,0.35)]
      transition-all duration-150">
      <td className="px-4 py-4 text-[#9A9A9A]">Data</td>
    </tr>
  </tbody>
</table>
```

---

## Globals.css Additions

```css
:root {
  --bg-0: #080808;
  --bg-1: #0D0D0D;
  --bg-2: #131313;
  --panel: rgba(18, 14, 14, 0.78);
  --panel-strong: rgba(18, 14, 14, 0.94);
  --panel-border: rgba(65, 50, 50, 0.40);
  --text-0: #F0F0F0;
  --text-1: #9A9A9A;
  --text-2: #5E5E5E;
  --accent: #DC2626;
  --accent-2: #991B1B;
  --good: #22C55E;
  --bad: #EF4444;
  --warn: #F59E0B;
  --crimson: #DC2626;
  --crimson-light: #EF4444;
  --crimson-dark: #991B1B;
  --gold: #DC2626;        /* aliased — kept for back-compat */
  --gold-light: #EF4444;
  --gold-dark: #991B1B;
  --shadow-gold: 0 8px 32px rgba(220, 38, 38, 0.20);
}

body {
  background:
    radial-gradient(1200px 600px at 10% -10%, rgba(180, 20, 20, 0.06), transparent 60%),
    radial-gradient(900px 500px at 110% 10%,  rgba(120, 10, 10, 0.04), transparent 55%),
    linear-gradient(160deg, #080808, #0D0D0D 45%, #131313 100%);
  background-attachment: fixed;
}
```
