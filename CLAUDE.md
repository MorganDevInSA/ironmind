@AGENTS.md

**Demo data & personas:** `Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md` · `.cursor/skills/ironmind-demo-data/SKILL.md` · `.cursor/personas/DEMOS.MD`

**Physique History UI:** `src/app/(app)/physique/page.tsx` — scrollable `data-table`, sticky date column, tape + scale **Δ** vs next older check-in (see expert guide §3). Export table: `src/lib/export/generate-summary.ts` (`formatCheckInsTable`) may omit columns present in History until extended.
