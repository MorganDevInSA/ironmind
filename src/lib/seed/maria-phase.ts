import type { Phase } from '@/lib/types';

export const mariaInitialPhase: Omit<Phase, 'id'> = {
  name: 'Home Strength + Pool Cardio',
  type: 'rebuild',
  startDate: new Date().toISOString().split('T')[0],
  isActive: true,
  targets: {
    startWeight: 57,
    targetWeight: 60,
    weightUnit: 'kg',
    strategy:
      'Gentle surplus on training days, 2–3 strength-focused home sessions plus pool and hill stairs for cardio. Weeks with kids use shorter “snack” sessions instead of skipping entirely.',
  },
};
