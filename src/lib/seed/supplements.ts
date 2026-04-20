import type { SupplementProtocol } from '@/lib/types';

export const mortonSupplementProtocol: SupplementProtocol = {
  windows: [
    {
      timing: 'morning',
      withMeal: 'breakfast',
      supplements: [
        'Multivitamin',
        'Vitamin D3',
        'Astaxanthin',
        'NAC',
        'Fish Oil',
        'Liv.52',
        "Brewer's Yeast",
        'Probiotic + Prebiotic',
      ],
      optional: [],
    },
    {
      timing: 'lunch',
      withMeal: 'main meal',
      supplements: [
        'CoQ10',
        'Betaine',
        'TUDCA',
        'Fish Oil',
        'Pressure-Eeze Forte',
        'Quercetin',
        'Zinplex (Zinc + Selenium)',
        'Digestive Enzymes',
      ],
      optional: [],
    },
    {
      timing: 'afternoon',
      withMeal: null,
      time: '16:00',
      supplements: [
        'Vitamin C',
        'NAC',
      ],
      optional: ['Beetroot + Citrulline + Arginine'],
    },
    {
      timing: 'dinner',
      withMeal: 'evening meal',
      supplements: [
        'Fish Oil',
        'Calcium + D3',
        'Milk Thistle',
        'Liv.52',
      ],
      optional: ['Digestive Enzymes'],
    },
    {
      timing: 'bed',
      withMeal: null,
      supplements: [
        'Magnesium',
      ],
      optional: [
        'Ashwagandha / Valerian / GABA',
        'Pilex',
        'Probiotic + Prebiotic',
      ],
    },
  ],
  notes: [
    'Zinc/Selenium best at lunch away from high-calcium meals',
    "Brewer's Yeast supports B-vitamins and chromium",
    'Probiotic can be morning or bedtime',
    'Digestive enzymes best with larger meals',
    'Spread intake across day for absorption and tolerance',
  ],
  intent: [
    'recovery support',
    'cardiovascular support',
    'inflammation management',
    'liver support',
    'sleep quality',
    'micronutrient coverage',
  ],
};
