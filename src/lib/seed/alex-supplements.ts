import type { SupplementProtocol } from '@/lib/types';

export const alexSupplementProtocol: SupplementProtocol = {
  windows: [
    {
      timing: 'morning',
      withMeal: 'breakfast',
      time: '07:30',
      supplements: ['Multivitamin', 'Vitamin D3', 'Fish Oil', 'Creatine Monohydrate (5g)'],
      optional: [],
    },
    {
      timing: 'preworkout',
      withMeal: null,
      time: '17:00',
      supplements: [],
      optional: ['Caffeine / pre-workout', 'Citrulline (6g)'],
    },
    {
      timing: 'postworkout',
      withMeal: 'post-training meal',
      time: '18:30',
      supplements: ['Whey Protein (if under protein target)'],
      optional: [],
    },
    {
      timing: 'bed',
      withMeal: null,
      time: '22:30',
      supplements: ['Magnesium'],
      optional: ['ZMA'],
    },
  ],
  notes: [
    'Creatine daily — timing does not matter greatly, morning is fine.',
    'Pre-workout only on training days.',
    'Whey protein is a fallback — prioritise whole food protein.',
  ],
  intent: [
    'Strength and hypertrophy support',
    'Recovery and sleep quality',
    'Micronutrient coverage',
    'Training performance',
  ],
};
