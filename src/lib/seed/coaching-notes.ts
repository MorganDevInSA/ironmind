import type { JournalEntry } from '@/lib/types';

export const morganInitialNotes: Omit<JournalEntry, 'id'>[] = [
  {
    date: new Date().toISOString().split('T')[0],
    title: 'Rebuild Block 1 — Opening Notes',
    content: `Shoulder spillover protocol active: Day 1 press -> Day 3 rows -> Day 5 press. If Day 5 incline stalls or front delts feel fried, drop Day 1 Lateral Raise to 1 set first.

Day 13 fatigue management: currently manageable at rebuild loads. Review after 4-6 weeks — Option A: split into two shorter sessions, Option B: drop calves or curls.

Prolapse-safe core only: dead bug, side plank, pallof press, bird dog. Rate pelvic comfort 1-5 after hardest core set; if any session scores 2 or below, reduce volume or swap.

Calorie emergency rule: if bodyweight drops 2 consecutive mornings, add one concrete bump immediately.

Volume targets per 14-day block:
- Chest: 15 sets (~7.5/wk) - intro adequate; push to 10-12/wk by block 3
- Back: 22 sets (~11/wk) - good; track pull-up total reps as KPI
- Quads: 12 sets (~6/wk) - improved; reassess after 2 cycles
- Delts: 14 sets (~7/wk) - adequate for strength, no increase needed
- Hamstrings: 6 sets (~3/wk) - monitor; add volume if recovery allows

KPIs to beat each cycle:
- DB Bench (Days 5 & 13): load x reps, best set
- Pull-ups (Days 3 & 11): total reps across 3 sets
- Walking Lunge (Days 7 & 13): load x reps/leg, best set`,
    tags: ['programming', 'safety', 'nutrition', 'phase-start', 'kpi', 'volume'],
  },
];
