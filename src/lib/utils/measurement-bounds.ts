import type { Measurements } from '@/lib/types';

/** Adult circumference guardrails (cm) — unisex, generous for outliers. */
const CM_BOUNDS: Record<
  keyof Pick<
    Measurements,
    'waist' | 'chest' | 'hips' | 'leftArm' | 'rightArm' | 'leftThigh' | 'rightThigh' | 'shoulders'
  >,
  { min: number; max: number }
> = {
  waist: { min: 48, max: 132 },
  chest: { min: 60, max: 148 },
  hips: { min: 58, max: 152 },
  leftArm: { min: 16, max: 56 },
  rightArm: { min: 16, max: 56 },
  leftThigh: { min: 34, max: 95 },
  rightThigh: { min: 34, max: 95 },
  shoulders: { min: 70, max: 165 },
};

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = parseFloat(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function inBounds(key: keyof typeof CM_BOUNDS, cm: number): boolean {
  const b = CM_BOUNDS[key];
  return cm >= b.min && cm <= b.max;
}

/**
 * Strip implausible circumference values from a partial payload before merge/persist.
 * Invalid keys are omitted so an existing good value in Firestore is not overwritten.
 */
export function sanitizeMeasurementsInput(
  input: Partial<Measurements> | undefined,
): Partial<Measurements> {
  if (!input) return {};
  const out: Partial<Measurements> = {};
  (Object.keys(CM_BOUNDS) as (keyof typeof CM_BOUNDS)[]).forEach((key) => {
    const n = toFiniteNumber(input[key]);
    if (n !== undefined && inBounds(key, n)) {
      (out as Record<string, number>)[key] = Math.round(n * 10) / 10;
    }
  });
  return out;
}

/**
 * Value safe to plot on charts — returns `undefined` if missing or outside plausible range
 * (stale/bad Firestore docs, mistaken form entry, legacy strings).
 */
export function measurementForChart(key: keyof Measurements, value: unknown): number | undefined {
  const n = toFiniteNumber(value);
  if (n === undefined) return undefined;
  if (!(key in CM_BOUNDS)) return undefined;
  if (!inBounds(key as keyof typeof CM_BOUNDS, n)) return undefined;
  return Math.round(n * 10) / 10;
}
