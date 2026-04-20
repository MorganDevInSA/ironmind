import type { SupplementProtocol } from '@/lib/types';

export const jordanSupplementProtocol: SupplementProtocol = {
  windows: [
    {
      timing: 'morning',
      withMeal: 'breakfast',
      time: '07:30',
      supplements: ['Multivitamin', 'Vitamin D3', 'Fish Oil'],
      optional: [],
    },
    {
      timing: 'afternoon',
      withMeal: null,
      time: '15:00',
      supplements: [],
      optional: ['Iron (if deficient — check with GP)', 'Vitamin C'],
    },
    {
      timing: 'bed',
      withMeal: null,
      time: '22:00',
      supplements: ['Magnesium'],
      optional: [],
    },
  ],
  notes: [
    'Keep it simple — basics only until habits are established.',
    'Vitamin D3 with breakfast for best absorption.',
    'Iron supplementation only if blood work confirms deficiency.',
  ],
  intent: [
    'General health maintenance',
    'Recovery and sleep quality',
    'Hormonal and energy support',
    'Micronutrient baseline coverage',
  ],
};
