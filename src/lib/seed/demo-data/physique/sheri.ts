/**
 * **Sheri** — foundation fat-loss: scale drifts down from a heavier start toward `sheriProfile` (95 kg).
 * Waist/hips contract; arms hold; last row matches current profile weight for dashboard parity.
 *
 * Demo-only — consumed exclusively when `seedSheriData` → `seedDemoHistoricalData` runs.
 */
import type { DemoPhysiqueWeek } from './types';

export const sheriDemoPhysiqueWeeks: readonly DemoPhysiqueWeek[] = [
  {
    bodyweight: 96.8,
    measurements: {
      waist: 94.5,
      chest: 102.9,
      hips: 111,
      leftArm: 30.8,
      rightArm: 30.5,
      leftThigh: 58,
      rightThigh: 57.6,
      shoulders: 113.2,
    },
  },
  {
    bodyweight: 96.6,
    measurements: {
      waist: 94.3,
      chest: 102.9,
      hips: 110.8,
      leftArm: 30.8,
      rightArm: 30.5,
      leftThigh: 57.9,
      rightThigh: 57.5,
      shoulders: 113.2,
    },
  },
  {
    bodyweight: 96.5,
    measurements: {
      waist: 94,
      chest: 103,
      hips: 110.6,
      leftArm: 30.9,
      rightArm: 30.6,
      leftThigh: 57.9,
      rightThigh: 57.5,
      shoulders: 113.1,
    },
  },
  {
    bodyweight: 96.3,
    measurements: {
      waist: 93.8,
      chest: 103,
      hips: 110.3,
      leftArm: 30.9,
      rightArm: 30.6,
      leftThigh: 57.8,
      rightThigh: 57.4,
      shoulders: 113.1,
    },
  },
  {
    bodyweight: 96.1,
    measurements: {
      waist: 93.5,
      chest: 103.1,
      hips: 110.1,
      leftArm: 30.9,
      rightArm: 30.7,
      leftThigh: 57.8,
      rightThigh: 57.3,
      shoulders: 113.1,
    },
  },
  {
    bodyweight: 96,
    measurements: {
      waist: 93.3,
      chest: 103.1,
      hips: 109.9,
      leftArm: 31,
      rightArm: 30.7,
      leftThigh: 57.7,
      rightThigh: 57.3,
      shoulders: 113,
    },
  },
  {
    bodyweight: 95.8,
    measurements: {
      waist: 93,
      chest: 103.2,
      hips: 109.7,
      leftArm: 31,
      rightArm: 30.8,
      leftThigh: 57.7,
      rightThigh: 57.2,
      shoulders: 113,
    },
  },
  {
    bodyweight: 95.7,
    measurements: {
      waist: 92.8,
      chest: 103.2,
      hips: 109.5,
      leftArm: 31.1,
      rightArm: 30.8,
      leftThigh: 57.6,
      rightThigh: 57.2,
      shoulders: 112.9,
    },
  },
  {
    bodyweight: 95.5,
    measurements: {
      waist: 92.5,
      chest: 103.3,
      hips: 109.3,
      leftArm: 31.1,
      rightArm: 30.9,
      leftThigh: 57.6,
      rightThigh: 57.1,
      shoulders: 112.9,
    },
  },
  {
    bodyweight: 95.3,
    measurements: {
      waist: 92.3,
      chest: 103.3,
      hips: 109,
      leftArm: 31.1,
      rightArm: 30.9,
      leftThigh: 57.5,
      rightThigh: 57,
      shoulders: 112.9,
    },
  },
  {
    bodyweight: 95.2,
    measurements: {
      waist: 92,
      chest: 103.4,
      hips: 108.8,
      leftArm: 31.2,
      rightArm: 31,
      leftThigh: 57.5,
      rightThigh: 57,
      shoulders: 112.8,
    },
  },
  {
    bodyweight: 95,
    measurements: {
      waist: 91.8,
      chest: 103.4,
      hips: 108.6,
      leftArm: 31.2,
      rightArm: 31,
      leftThigh: 57.4,
      rightThigh: 56.9,
      shoulders: 112.8,
    },
  },
];
