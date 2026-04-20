import type { Phase } from '@/lib/types';

export const mortonInitialPhase: Omit<Phase, 'id'> = {
  name: 'Rebuild / Rebound / Intro Block',
  type: 'rebuild',
  startDate: new Date().toISOString().split('T')[0],
  isActive: true,
  targets: {
    startWeight: 80,
    targetWeight: 85,
    weightUnit: 'kg',
    strategy: 'Consistent calorie surplus, progressive training, recovery quality',
  },
};
