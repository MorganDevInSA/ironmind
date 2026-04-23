import type { VolumeLandmarks } from '@/lib/types';

export const mariaVolumeLandmarks: VolumeLandmarks = {
  chest: { mv: 2, mev: 4, mav: 8, mrv: 10, currentTarget: 5, unit: 'sets/week' },
  back: { mv: 2, mev: 4, mav: 8, mrv: 10, currentTarget: 5, unit: 'sets/week' },
  quads: { mv: 2, mev: 4, mav: 8, mrv: 10, currentTarget: 6, unit: 'sets/week' },
  hamstrings: { mv: 2, mev: 4, mav: 8, mrv: 10, currentTarget: 5, unit: 'sets/week' },
  delts: { mv: 2, mev: 4, mav: 8, mrv: 10, currentTarget: 4, unit: 'sets/week' },
  biceps: { mv: 0, mev: 2, mav: 6, mrv: 8, currentTarget: 2, unit: 'sets/week' },
  triceps: { mv: 0, mev: 2, mav: 6, mrv: 8, currentTarget: 2, unit: 'sets/week' },
  calves: { mv: 2, mev: 4, mav: 8, mrv: 10, currentTarget: 4, unit: 'sets/week' },
};
