import type { SupplementProtocol } from '@/lib/types';

export const mariaSupplementProtocol: SupplementProtocol = {
  windows: [
    {
      timing: 'morning',
      withMeal: 'breakfast',
      time: '08:00',
      supplements: ['Multivitamin', 'Vitamin D3'],
      optional: [],
    },
    {
      timing: 'afternoon',
      withMeal: null,
      time: '15:00',
      supplements: [],
      optional: ['Fish oil (when remembered)', 'Vitamin C'],
    },
    {
      timing: 'bed',
      withMeal: null,
      time: '22:30',
      supplements: ['Magnesium'],
      optional: [],
    },
  ],
  notes: [
    'Keep the stack minimal — consistency beats complexity.',
    'Hydrate extra on pool + stairs combo days.',
  ],
  intent: ['General health', 'Sleep support', 'Low-friction habit'],
};
