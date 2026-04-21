# IRONMIND Logo Brief

## Persona Prompt

Use this as the system or persona prompt in ChatGPT before asking it to design logo concepts:

```text
You are a senior brand identity director and elite digital product designer working on IRONMIND.

IRONMIND is not a generic fitness brand. It is a raw performance system for an elite self-coaching bodybuilder. The product should feel like a war room: precise, masculine, technical, disciplined, severe, premium, and intensely focused. Every design choice must communicate blood, strength, sweat, growth, and data-driven control.

Brand attributes:
- Strength: heavy, confident, aggressive contrast
- Precision: technical, measured, structured, intelligent
- Rawness: pure dark palette, no softness, no blue-grey corporate feel
- Masculinity: angular, sharp, industrial, restrained
- Premium focus: sparse, deliberate, not flashy or cheap

Visual language:
- Dominant colors: black, warm charcoal, deep crimson
- Accent color: crimson only where it matters
- Typography mood: strong, technical, premium, disciplined
- Forms: angular, geometric, monolithic, carved, forged, tactical
- Tone: minimal, hard, exact, intimidating in a controlled way

Avoid:
- Generic dumbbell or flexing-man logos
- Modern startup softness
- Cartoon energy
- Overly busy emblems
- Blue, cyan, gold, neon, chrome gradients, or glossy esports cliches
- Cheap "tribal gym" aesthetics
- Overuse of flames, skulls, wings, shields, crowns, or lightning unless abstracted with restraint

Your task is to create logo directions that can work in a premium app UI, favicon, sidebar wordmark, and social avatar. Prioritize clarity, memorability, scalability, and brand fit over visual noise.

When responding:
1. Start with 3 logo directions with distinct strategic concepts.
2. For each, explain the symbol logic, typography approach, and why it fits IRONMIND.
3. Keep the forms simple enough to work at small sizes.
4. Recommend one strongest direction.
5. Then write a final image-generation prompt for that direction.
```

## Requirements Outline

### Brand requirements

- Must feel like elite bodybuilding intelligence, not a mass-market gym app.
- Must align with dark, warm-black, crimson product styling.
- Must feel serious, exact, masculine, and premium.
- Must work for both software and performance identity.

### Visual requirements

- Primary palette:
  - `#080808`
  - `#0D0D0D`
  - `#131313`
  - `#DC2626`
  - optional dark crimson `#991B1B`
- Use crimson as an accent, not the whole logo.
- Forms should be:
  - angular
  - balanced
  - minimal
  - scalable
  - high-contrast
- Prefer:
  - monogram
  - abstract forged mark
  - sharp wordmark
  - subtle symbol + wordmark pairing

### Functional requirements

- Must work in:
  - app header
  - sidebar collapsed state
  - favicon / app icon
  - loading screen / splash
  - export headers
  - social profile image
- Must remain legible at:
  - `16px`
  - `24px`
  - `32px`
  - `64px`
- Must work in:
  - full color on dark background
  - 1-color crimson
  - 1-color white / light neutral
  - symbol-only version

### What to avoid

- Generic fitness logo tropes
- Bodybuilder silhouette
- Obvious dumbbell/barbell icon
- Blue tech branding
- Luxury serif excess
- Soft rounded marks
- Complex gradients
- Fine detail that disappears at small sizes

## Generation Details

### Best logo directions to explore

1. Forged Monogram
   - A severe `I` or `IM` mark
   - Feels carved, stamped, or cut from steel
   - Best for app icon and collapsed sidebar

2. Data + Iron Hybrid
   - Abstract mark combining strength and precision
   - Could hint at plates, a pillar, grid logic, or disciplined symmetry
   - Good if you want the product side to be more visible

3. Wordmark-led Identity
   - Strong custom `IRONMIND` wordmark
   - Tight tracking, angular cuts, selective crimson accent
   - Best if the brand name itself should carry most of the identity

### Best prompt for image generation

Use this in ChatGPT image generation after you pick a direction:

```text
Design a premium logo for a brand called IRONMIND.

Style: elite bodybuilding performance system, dark war-room aesthetic, masculine, precise, angular, minimal, premium, disciplined, intimidating but controlled.

Create a logo that feels forged, technical, and memorable. Avoid generic gym branding, dumbbells, bodybuilder silhouettes, blue tech branding, cartoon aesthetics, or glossy esports effects.

Visual direction:
- warm black and charcoal base
- deep crimson accent (#DC2626)
- optional deep crimson shadow (#991B1B)
- sharp geometry
- strong negative space
- simple enough to work as an app icon and sidebar mark
- scalable, flat, vector-like, clean silhouette
- suitable for dark UI

Deliver:
- one symbol + wordmark lockup
- one symbol-only version
- centered composition on dark background
- crisp, minimal, high-contrast presentation

Mood words:
forged, blood, iron, discipline, precision, strength, control, performance intelligence
```

### Strongest starting variant

```text
Create a logo for IRONMIND using a forged angular monogram. The mark should feel carved from iron and disciplined by data. Minimal, sharp, premium, masculine, warm-black and crimson palette, vector-like, no dumbbells, no silhouettes, no blue, no glossy effects, no clutter. Include a symbol-only version and a symbol + wordmark version on a dark background.
```

### Output checklist

Ask ChatGPT to generate:

- 3 distinct concepts
- 1 recommended winner
- symbol-only crop
- wordmark lockup
- monochrome version
- dark-background mockup
- favicon/app-icon crop

## Optional Next Additions

If needed, add:

1. a final one-shot logo generation prompt
2. a logo review rubric
3. a shortlist framework for picking the winning concept

---

## Production assets (in-repo)

All raster logos live under **`public/brand/`**. Runtime URLs are centralized in **`brandAssets`** (`src/lib/constants/brand-assets.ts`). **Do not** duplicate path strings in components — import **`brandAssets`** or add a new key there when introducing a file.

### Inventory

| File (`public/brand/…`) | `brandAssets` key | Typical use |
|-------------------------|-------------------|-------------|
| `ironmind_logo_male.png` | `logoMale` | **`IronmindLogo`** when theme ≠ hot-pink (sidebar, top bar, register). |
| `ironmind_logo_female.png` | `logoFemale` | **`IronmindLogo`** when theme is hot-pink (e.g. Sheri demo profile). |
| `ironmind_logo_combined.png` | `logoCombined` | **`/login`** page hero (`next/image`), layered male + female mark. |
| `ironmind_transparent_1_reverted.png` | `appleTouchIcon` | Root layout **`metadata.icons.apple`** (iOS home screen / PWA). |
| `ironmind_logo_2_top_right.png` | `alternateTopRight` | Marketing / optional UI — not wired by default. |
| `ironmind_logo_3_bottom_left.png` | `alternateBottomLeft` | Same. |
| `ironmind_logo_4_bottom_right.png` | `alternateBottomRight` | Canonical title-style crop reference (768 × 512 px). |

### UI wiring notes

- **`IronmindLogo`** (`src/components/brand/ironmind-logo.tsx`): sidebar (desktop **`lg+`**), **`top-bar.tsx`** compact mark (**`lg:hidden`**), **register** header. Uses **`object-contain object-center`** so PNG framing stays visible (avoid chaining `object-left` + `object-bottom` — Tailwind resolves to one axis and can show empty canvas).
- **`/login`**: uses **`brandAssets.logoCombined`** directly (not `IronmindLogo`) for the stacked lockup.
- **OAuth buttons** (Google; Facebook/Microsoft when enabled in UI) use text + icons only — no extra logo files.
