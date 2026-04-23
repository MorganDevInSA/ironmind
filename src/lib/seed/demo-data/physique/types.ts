import type { Measurements } from '@/lib/types';

/**
 * One week of demo physique data (scale + tape). ISO calendar `date` strings are **not**
 * stored here — `seedDemoHistoricalData` maps each row to the correct `YYYY-MM-DD` for the
 * active demo window when the user selects a demo profile.
 */
export type DemoPhysiqueWeek = {
  bodyweight: number;
  measurements: Measurements;
};

/** Keys aligned with `seedMortonData` … `seedMariaData` and `DemoProfileModal` ids. */
export type DemoPersonaId = 'morton' | 'sheri' | 'alex' | 'jordan' | 'fez' | 'maria';
