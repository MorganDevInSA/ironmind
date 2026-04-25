import type { SupplementProtocol } from '@/lib/types';

export const cheriSupplementProtocol: SupplementProtocol = {
  windows: [
    {
      timing: 'morning',
      withMeal: 'breakfast containing some fat',
      time: '07:00',
      supplements: ['Multivitamin', 'Vitamin D3', 'Fish Oil'],
      optional: [],
    },
    {
      timing: 'lunch',
      withMeal: 'largest meal',
      time: '13:00',
      supplements: [],
      optional: ['Digestive Enzymes', 'Fish Oil'],
    },
    {
      timing: 'afternoon',
      withMeal: null,
      time: '17:00',
      supplements: [],
      optional: ['Coffee'],
    },
    {
      timing: 'bed',
      withMeal: null,
      time: '21:30',
      supplements: ['Magnesium'],
      optional: [],
    },
  ],
  notes: [
    'Take Vitamin D3 and fish oil with meals.',
    'Digestive enzymes only with larger meals.',
    'Keep supplement budget secondary to food adherence.',
  ],
  intent: [
    'General health',
    'Recovery support',
    'Micronutrient coverage',
    'Training energy adherence',
  ],
};
