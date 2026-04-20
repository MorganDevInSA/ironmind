import type { Phase } from '@/lib/types';

export const alexInitialPhase: Omit<Phase, 'id'> = {
  name: 'Hypertrophy Block I',
  type: 'rebuild',
  startDate: new Date().toISOString().split('T')[0],
  isActive: true,
  targets: {
    startWeight: 82,
    targetWeight: 88,
    weightUnit: 'kg',
    strategy: 'Moderate caloric surplus (~300–400 kcal/day), 4-day upper/lower split with double-progression, targeting 0.25–0.5 kg/week gain.',
  },
};
