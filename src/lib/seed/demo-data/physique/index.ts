/**
 * Demo physique data — **only** read from `seedDemoHistoricalData` when the user selects
 * a demo profile (`seedMortonData`, `seedCheriData`, …). Never use for non-demo flows.
 */
import type { DemoPersonaId, DemoPhysiqueWeek } from './types';
import { mortonDemoPhysiqueWeeks } from './morton';
import { cheriDemoPhysiqueWeeks } from './cheri';
import { alexDemoPhysiqueWeeks } from './alex';
import { jordanDemoPhysiqueWeeks } from './jordan';
import { fezDemoPhysiqueWeeks } from './fez';
import { mariaDemoPhysiqueWeeks } from './maria';

export type { DemoPhysiqueWeek, DemoPersonaId } from './types';

/** Oldest → newest; last entry matches that persona’s `currentWeight` + tape story in seed profiles. */
export const DEMO_PHYSIQUE_WEEKLY_BY_PERSONA: Record<DemoPersonaId, readonly DemoPhysiqueWeek[]> = {
  morton: mortonDemoPhysiqueWeeks,
  cheri: cheriDemoPhysiqueWeeks,
  alex: alexDemoPhysiqueWeeks,
  jordan: jordanDemoPhysiqueWeeks,
  fez: fezDemoPhysiqueWeeks,
  maria: mariaDemoPhysiqueWeeks,
};

export function getDemoPhysiqueWeeks(personaId: DemoPersonaId): readonly DemoPhysiqueWeek[] {
  return DEMO_PHYSIQUE_WEEKLY_BY_PERSONA[personaId];
}
