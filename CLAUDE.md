@AGENTS.md

**Demo data & personas:** `Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md` · `.cursor/skills/ironmind-demo-data/SKILL.md` · `.cursor/personas/DEMOS.MD`

**Physique History UI:** `src/app/(app)/physique/page.tsx` — scrollable `data-table`, sticky date column, tape + scale **Δ** vs next older check-in (see expert guide §3). Export table: `src/lib/export/generate-summary.ts` (`formatCheckInsTable`) may omit columns present in History until extended.

**Program cycle + dashboard trend:** `Program.startDate` anchors rotating **`dayNumber`** → calendar (`getCycleDay`). Users edit Week 1 start via `ProgramCycleStartControl` + `useUpdateProgram`. Dashboard week presets extend **forward** from that anchor; import preserves valid `YYYY-MM-DD` `startDate` from coach JSON (`import.service.ts`). See `.cursor/rules/IRONMIND.md`, `Documentation/ARCHITECTURE.md` §13.4, `ironmind-data-layer` skill.

**App shell — caption peeks:** `peek-caption.ts` (**`PEEK_CAPTION_PANEL_SKIN`**) + `globals.css` layout classes (216px, **accent border in plain CSS** = same 62% mix as `.nav-item.active`, centered). **`sidebar.tsx`** — rail peeks use **`createPortal` + `fixed`** (not in-rail `absolute`); combined **`aria-label`** when collapsed; no duplicate hover card on expand/collapse. **`plan-by-day-strip.tsx`** — same skin above day pills. Dashboard **today’s schedule** table: no redundant row-hover portal. See **ironmind-a11y**, `Documentation/ARCHITECTURE.md` §13.5, `.cursor/rules/IRONMIND.md`.

**Training day strip vs dashboard:** `useUIStore` **`dashboardTrendSelectedDate`** (persisted) mirrors the dashboard **`PlanByDayStrip`** selection. **`/training`** shows **14 calendar days forward** from that anchor (fallback: today). Changing a pill on Training updates the same store so returning to the dashboard stays aligned.
