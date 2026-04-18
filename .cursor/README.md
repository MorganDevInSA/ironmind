# IRONMIND — Cursor context

This directory is the **authoritative agent context** for the `ironmind` repo: rules the editor can load, skills (workflows and patterns), and the senior architect persona. Substantive app changes should stay aligned with these files plus `Documentation/` at the repo root.

| Path | Role |
|------|------|
| **`rules/IRONMIND.md`** | Enforced project rules — architecture stack, Firebase naming, seeds, alerts, routing, CSS import order, design tokens, checklist |
| **`personas/SENIOR-ARCHITECT.md`** | Mindset, domain vocabulary, twin mandates (UX vs data substrate), navigation map |
| **`skills/ironmind-typescript-patterns/SKILL.md`** | TS strict conventions, imports, unions |
| **`skills/ironmind-firebase-patterns/SKILL.md`** | Firestore helpers, converters, constraints, **`undefined`** write hygiene |
| **`skills/ironmind-data-layer/SKILL.md`** | Controllers/services, **`queryKeys`**, dashboard composites, mutations, seed |
| **`skills/ironmind-styling/SKILL.md`** | Buttons, panels, typography, mono numerics |
| **`skills/ironmind-visual-persona/SKILL.md`** | Brand voice, forbidden palettes, hierarchy |
| **`skills/ironmind-animations/SKILL.md`** | Motion; prefer **crimson** token colors in snippets |

Skills use **YAML frontmatter** (`name`, `description`) so Cursor can attach them when relevant.

Last consolidated review: **2026-04-18** — seed/nutrition note corrected, recovery `latest` query documented, Firestore `undefined` rule linked, typography aligned to `globals.css` (Rajdhani), animation examples moved off legacy gold/blue. **Dashboard** — `.dashboard-overview` centered shell (`4px` full border, `1.25rem` radius) and `.exercise-index-badge` contrast pattern documented in **`IRONMIND.md`**, **`ironmind-styling`**, **`Documentation/ARCHITECTURE.md` §13.4**. **App chrome** — `--chrome-bg` / `--chrome-bg-topbar` / `--chrome-bg-toggle` for header, sidebar, and mobile nav (warm darks; no `#2e2e2e` bars); documented in **`IRONMIND.md`**, **`ironmind-styling`**, **`ironmind-visual-persona`**, **`Documentation/ARCHITECTURE.md` §13.5**.
