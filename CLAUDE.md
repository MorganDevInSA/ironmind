@AGENTS.md

**Demo data & personas:** `Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md` · `.cursor/skills/ironmind-demo-data/SKILL.md` · `.cursor/personas/DEMOS.MD`

**Physique History UI:** `src/app/(app)/physique/page.tsx` — scrollable `data-table`, sticky date column, tape + scale **Δ** vs next older check-in (see expert guide §3). Export table: `src/lib/export/generate-summary.ts` (`formatCheckInsTable`) may omit columns present in History until extended.

**Program cycle + dashboard trend:** `Program.startDate` anchors rotating **`dayNumber`** → calendar (`getCycleDay`). Users edit Week 1 start via `ProgramCycleStartControl` + `useUpdateProgram`. Dashboard week presets extend **forward** from that anchor; import preserves valid `YYYY-MM-DD` `startDate` from coach JSON (`import.service.ts`). See `.cursor/rules/IRONMIND.md`, `Documentation/ARCHITECTURE.md` §13.4, `ironmind-data-layer` skill.
