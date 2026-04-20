import type { VolumeLandmarks } from '@/lib/types';

export const alexVolumeLandmarks: VolumeLandmarks = {
  chest:      { mv: 8,  mev: 10, mav: 16, mrv: 20, currentTarget: 12, unit: 'sets/week' },
  back:       { mv: 10, mev: 12, mav: 18, mrv: 22, currentTarget: 14, unit: 'sets/week' },
  quads:      { mv: 8,  mev: 10, mav: 16, mrv: 20, currentTarget: 12, unit: 'sets/week' },
  hamstrings: { mv: 6,  mev: 8,  mav: 14, mrv: 18, currentTarget: 10, unit: 'sets/week' },
  delts:      { mv: 8,  mev: 10, mav: 16, mrv: 20, currentTarget: 12, unit: 'sets/week' },
  biceps:     { mv: 6,  mev: 8,  mav: 14, mrv: 18, currentTarget: 10, unit: 'sets/week' },
  triceps:    { mv: 6,  mev: 8,  mav: 14, mrv: 18, currentTarget: 10, unit: 'sets/week' },
  calves:     { mv: 8,  mev: 10, mav: 16, mrv: 20, currentTarget: 12, unit: 'sets/week' },
};
