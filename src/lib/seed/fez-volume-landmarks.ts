import type { VolumeLandmarks } from '@/lib/types';

export const fezVolumeLandmarks: VolumeLandmarks = {
  chest: { mv: 8, mev: 10, mav: 16, mrv: 20, currentTarget: 12, unit: 'sets/week' },
  back: { mv: 8, mev: 10, mav: 16, mrv: 20, currentTarget: 14, unit: 'sets/week' },
  quads: { mv: 6, mev: 8, mav: 14, mrv: 18, currentTarget: 10, unit: 'sets/week' },
  hamstrings: { mv: 6, mev: 8, mav: 12, mrv: 16, currentTarget: 9, unit: 'sets/week' },
  delts: { mv: 6, mev: 8, mav: 12, mrv: 16, currentTarget: 8, unit: 'sets/week' },
  biceps: { mv: 4, mev: 6, mav: 10, mrv: 14, currentTarget: 6, unit: 'sets/week' },
  triceps: { mv: 4, mev: 6, mav: 10, mrv: 14, currentTarget: 6, unit: 'sets/week' },
  calves: { mv: 6, mev: 8, mav: 12, mrv: 16, currentTarget: 8, unit: 'sets/week' },
};
