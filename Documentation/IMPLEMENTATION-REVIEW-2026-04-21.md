# Implementation Review — 2026-04-21

This document records the full request set, accepted decisions, and shipped implementation for the latest UI/UX and data-flow retrofit.

---

## 1) Decision log (accepted answers)

### A. Coaching notes direction

- **User concern:** coaching notes did not work reliably.
- **Accepted decision:** delete both coaching-note surfaces and keep note capture available for export.
- **Shipped outcome:** `/coaching` route removed; dashboard coaching-note card removed; note entry moved to `/export` and persisted as journal entries.

### B. Onboarding theme selection placement

- **Question asked:** where should theme selection live?
- **Accepted decision:** dedicated onboarding step early in the flow.
- **Shipped outcome:** new `StepTheme` inserted after overview.

### C. Notes-for-export behavior

- **Question asked:** how should notes remain available after deleting coaching UI?
- **Accepted decision:** add a composer on `/export` that persists notes (journal-backed), not temporary one-off text.
- **Shipped outcome:** export page now supports save + recent notes list.

---

## 2) Request-to-implementation matrix

| Request | Status | Implementation |
|--------|--------|----------------|
| Coaching notes does not work; maybe delete | Completed | Deleted `src/app/(app)/coaching/page.tsx`, removed sidebar `/coaching` link, removed dashboard coaching note card/modal. |
| Keep option to enter notes for export | Completed | Added persisted note composer to `src/app/(app)/export/page.tsx` using `useCreateJournalEntry` + recent list via `useJournalEntries`. |
| Dashboard selected day + selected panel synchronized glow/border/button glow | Completed | Added shared `.is-selected` utility in `src/app/globals.css`; applied to cycle-day tabs and selected session panel in `src/app/(app)/dashboard/page.tsx`. |
| Nutrition day type styling mismatch | Completed | Updated day-type selected/unselected styling in `src/app/(app)/nutrition/page.tsx` to theme-token + `.is-selected` treatment. |
| Recovery header needs same styling language | Completed | Tokenized header/tabs in `src/app/(app)/recovery/page.tsx`, applied `.is-selected` for active tab. |
| Coaching training journal text formatting | Superseded by accepted deletion decision | Coaching journal UI removed with `/coaching`; note functionality retained in export workflow. |
| Onboard theme option (crimson/hot pink/custom) | Completed | Added `src/components/onboarding/StepTheme.tsx`; wired into `src/app/(onboarding)/onboarding/page.tsx`; updated step indices. |
| Expand demo profiles with professional coach form details | Completed | Extended `src/components/onboarding/DemoProfileModal.tsx` profile model and card UI with lifestyle, history, genetics, equipment, coach summary for Morton, Sheri, Alex, Jordan. |

---

## 3) Files changed by feature area

### Coaching removal + export-note continuity

- `src/app/(app)/coaching/page.tsx` (deleted)
- `src/components/layout/sidebar.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/controllers/use-dashboard.ts`
- `src/app/(app)/export/page.tsx`
- `src/controllers/use-coaching.ts`

### Selected-state synchronization and styling polish

- `src/app/globals.css` (`.is-selected` added)
- `src/app/(app)/dashboard/page.tsx`
- `src/app/(app)/nutrition/page.tsx`
- `src/app/(app)/recovery/page.tsx`

### Onboarding theme + profile depth

- `src/components/onboarding/StepTheme.tsx` (new)
- `src/app/(onboarding)/onboarding/page.tsx`
- `src/components/onboarding/StepProcessMap.tsx`
- `src/components/onboarding/StepCoachPersona.tsx`
- `src/components/onboarding/StepQuestionnaire.tsx`
- `src/components/onboarding/StepGenerateJson.tsx`
- `src/components/onboarding/StepAnalysisSetup.tsx`
- `src/components/onboarding/StepImportFiles.tsx`
- `src/components/onboarding/DemoProfileModal.tsx`

---

## 4) Behavioral summary (what users now experience)

1. Coaching is no longer a standalone navigation route.
2. Export becomes the note capture hub: users can write/save context and include it in markdown exports.
3. Selected UI states share a common visual language across dashboard, nutrition, recovery, and onboarding profile selection.
4. Onboarding includes explicit theme choice before coach setup flow continues.
5. Demo profiles read as coach-ready briefs rather than short one-line placeholders.

---

## 5) Documentation impact

This implementation required documentation corrections because earlier docs still referenced:

- `/coaching` as an active route
- old sample seed names (`morganProfile`, `morganProgram`)
- stale styling guidance (blue/gold-first legacy tables)

These are now updated in:

- `Documentation/ARCHITECTURE.md`
- `Documentation/STYLE-GUIDE.md`
- `Documentation/README.md` (index includes this review)

---

## 6) Optional follow-up (naming consistency)

If product copy should match stakeholder naming exactly, update visible profile labels from:

- `Morton` -> `Morgan`
- `Sheri` -> `Keri`

Current implementation keeps codebase seed names as-is and maps requested detail to those existing demo personas.

