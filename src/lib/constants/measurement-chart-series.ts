import type { Measurements } from '@/lib/types';

/** Circumference keys shown on dashboard + Physique measurement line charts (order = legend order). */
export type MeasurementChartKey = keyof Pick<
  Measurements,
  'waist' | 'chest' | 'hips' | 'leftArm' | 'rightArm' | 'leftThigh' | 'rightThigh'
>;

export const MEASUREMENT_CHART_SERIES: readonly {
  key: MeasurementChartKey;
  label: string;
  /** Recharts `strokeDasharray` — distinct pattern per series (same accent color). */
  dash: string;
}[] = [
  { key: 'waist', label: 'Waist', dash: '0' },
  { key: 'chest', label: 'Chest', dash: '8 3' },
  { key: 'hips', label: 'Hips', dash: '1 4' },
  { key: 'leftArm', label: 'L arm', dash: '12 3 2 3' },
  { key: 'rightArm', label: 'R arm', dash: '3 3 1 3' },
  { key: 'leftThigh', label: 'L thigh', dash: '2 2 10 2' },
  { key: 'rightThigh', label: 'R thigh', dash: '10 2 4 2' },
] as const;
