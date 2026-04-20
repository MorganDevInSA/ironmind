import type { Phase } from '@/lib/types';

export const jordanInitialPhase: Omit<Phase, 'id'> = {
  name: 'Foundation Fitness Block',
  type: 'rebuild',
  startDate: new Date().toISOString().split('T')[0],
  isActive: true,
  targets: {
    startWeight: 72,
    targetWeight: 66,
    weightUnit: 'kg',
    strategy: 'Moderate deficit of ~300–400 kcal/day, 3 full-body sessions/week with progressive loading, prioritise habit formation and movement quality over intensity.',
  },
};
