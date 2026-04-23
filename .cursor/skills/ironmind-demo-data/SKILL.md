---
name: ironmind-demo-data
description: Design and tune IRONMIND demo personas, synthetic multi-week history, and coach-import alignment without breaking Firestore schemas or the seed pipeline. Use when adding demo athletes, adjusting realism, extending `demo-historical`, or editing seed modules under `src/lib/seed/`.
---

# IRONMIND demo data (personas + synthetic history)

**Canonical reference:** [`Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md`](../../../Documentation/EXPERT-DEMO-DATA-AND-STORAGE-GUIDE.md)

## Hard rules

1. **Collection paths:** only `collections.*` from [`src/lib/firebase/config.ts`](../../../src/lib/firebase/config.ts).
2. **Writes:** synthetic history must use **services** (`createWorkout`, `saveNutritionDay`, `saveRecoveryEntry`, …) as in [`src/lib/seed/demo-historical.ts`](../../../src/lib/seed/demo-historical.ts) — never raw Firestore from pages or one-off scripts.
3. **Orchestration:** any new `src/lib/seed/*.ts` module must be **imported and invoked** from [`src/lib/seed/index.ts`](../../../src/lib/seed/index.ts); demo UI flows use `seedMortonData` / `seedSheriData` / `seedAlexData` / `seedJordanData` (see [`src/components/onboarding/DemoProfileModal.tsx`](../../../src/components/onboarding/DemoProfileModal.tsx)).
4. **Types:** shapes live in [`src/lib/types/index.ts`](../../../src/lib/types/index.ts); import JSON packs must stay aligned with [`src/services/import.service.ts`](../../../src/services/import.service.ts).

## Where to edit

| Goal                                                       | Location                                                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Static profile / program / nutrition / phase for a persona | `src/lib/seed/profile.ts`, `program.ts`, `nutrition.ts`, `sheri-*.ts`, `alex-*.ts`, `jordan-*.ts`                              |
| Adherence, recovery baselines, weight drift, portions      | `personaTuning` in [`demo-historical.ts`](../../../src/lib/seed/demo-historical.ts)                                            |
| History window length (demo overwrite)                     | **`DEMO_HISTORY_DAYS`** in `demo-historical.ts` + matching program `startDate` offset in `seed/index.ts`                       |
| Mid-block story (deload, stress week, journal arc)         | Logic and `buildJournalNotes` in `demo-historical.ts` — keep **journal text consistent** with what the generator actually does |

## Realism checklist

- Imperfect adherence, macro drift, sleep/HRV waves, optional **deload** or **stress** weeks.
- Avoid impossible body composition velocity; keep **one active program / phase** per user (use existing training/coaching services when creating programs and phases).
- Do not claim events in **journal** or **coachNotes** that the seed loop does not approximate (e.g. “full miss week” without lowered session frequency).

## Re-seed

Changing TypeScript does not mutate production data. Re-run the **demo profile modal** (or a controlled dev call to `seed*Data`) against **emulator or disposable users** — see `README_DATA_LAYER.md` and the expert guide §10.
