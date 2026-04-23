import type { SupplementProtocol } from '@/lib/types';

export const fezSupplementProtocol: SupplementProtocol = {
  windows: [
    {
      timing: 'morning',
      withMeal: 'breakfast',
      time: '06:15',
      supplements: ['Vitamin B12', 'Vitamin D3', 'Algae-based Omega-3', 'Creatine monohydrate'],
      optional: [],
    },
    {
      timing: 'afternoon',
      withMeal: null,
      time: '08:00',
      supplements: ['Plant protein shake'],
      optional: ['Electrolytes on long cardio days'],
    },
    {
      timing: 'bed',
      withMeal: null,
      time: '22:00',
      supplements: ['Magnesium glycinate'],
      optional: [],
    },
  ],
  notes: [
    'Vegan stack focused on nutrients that are harder to cover from plants alone.',
    'Creatine daily regardless of training day.',
  ],
  intent: ['Micronutrient coverage', 'Recovery and sleep', 'Training performance support'],
};
