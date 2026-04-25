import type { NutritionPlanSeed } from './nutrition';

export const cheriNutritionPlan: NutritionPlanSeed = {
  proteinTarget: 120,
  coreProteinRotation: [
    'chicken thighs',
    'eggs',
    'tuna',
    'yogurt',
    'cottage cheese',
    'lean mince',
    'beans',
  ],
  mealSchedule: [
    {
      slot: 'morning',
      time: '07:00',
      default: '2 boiled eggs',
      recoveryDay: 'Yogurt + fruit',
      liftDay: '2 boiled eggs + fruit',
    },
    {
      slot: 'lunch',
      time: '13:00',
      default: 'Chicken mayo sandwich',
      liftDay: 'Leftover chicken + rice + veg',
      recoveryDay: 'Tuna salad wrap',
    },
    {
      slot: 'afternoon',
      time: '16:00',
      default: 'Fruit + coffee / tea',
      liftDay: 'Banana + coffee (pre-training)',
      recoveryDay: 'Boiled eggs',
    },
    {
      slot: 'dinner',
      time: '19:00',
      default: 'Chicken thighs + veg',
      liftDay: 'Mince + rice + veg',
      recoveryDay: 'Omelette + salad',
    },
    {
      slot: 'evening',
      time: '21:00',
      default: 'Yogurt (if hungry)',
    },
  ],
  macroTargetsByDayType: {
    recovery: { calories: [1600, 1750], protein: 120, carbs: [90, 130], fat: null },
    moderate: { calories: [1600, 1800], protein: 120, carbs: [110, 150], fat: null },
    high: { calories: [1700, 1900], protein: 120, carbs: [130, 170], fat: null },
    highest: { calories: [1700, 1900], protein: 120, carbs: [140, 180], fat: null },
  },
  emergencyRule:
    'If schedule breaks: eat 1 tin tuna or 200g yogurt plus fruit immediately, then normal dinner later. Do not write off the day.',
};
