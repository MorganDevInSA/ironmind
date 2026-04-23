import type { Phase } from '@/lib/types';

export const fezInitialPhase: Omit<Phase, 'id'> = {
  name: 'Vegan Lean Bulk + Shoulder-Safe Hypertrophy',
  type: 'rebuild',
  startDate: new Date().toISOString().split('T')[0],
  isActive: true,
  targets: {
    startWeight: 73,
    targetWeight: 80,
    weightUnit: 'kg',
    strategy:
      'Small weekly surplus (~250–350 kcal), 4–5 lifting mornings/week in commercial gym, 2 low-impact cardio blocks, neutral-grip pressing priority, weekly shoulder tolerance check.',
  },
};
