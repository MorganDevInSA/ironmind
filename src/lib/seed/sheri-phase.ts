import type { Phase } from '@/lib/types';

export const sheriInitialPhase: Omit<Phase, 'id'> = {
  name: 'Foundation Rebuild Cut',
  type: 'rebuild',
  startDate: new Date().toISOString().split('T')[0],
  isActive: true,
  targets: {
    startWeight: 95,
    targetWeight: 83,
    weightUnit: 'kg',
    strategy: 'Target average loss of 0.4–0.8 kg/week via 1600–1900 kcal intake, 3 strength sessions weekly, increased steps, and progressive habit adherence.',
  },
};
