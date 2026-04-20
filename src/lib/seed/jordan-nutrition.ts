import type { NutritionPlanSeed } from './nutrition';

export const jordanNutritionPlan: NutritionPlanSeed = {
  proteinTarget: 125,
  coreProteinRotation: [
    'chicken breast',
    'eggs',
    'Greek yogurt',
    'cottage cheese',
    'tuna',
    'salmon',
    'lentils',
  ],
  mealSchedule: [
    {
      slot: 'breakfast',
      time: '07:30',
      default: 'Greek yogurt + berries + granola',
      liftDay: '2 eggs + toast + fruit',
      recoveryDay: 'Greek yogurt + berries',
    },
    {
      slot: 'lunch',
      time: '13:00',
      default: 'Chicken salad or wrap',
      liftDay: 'Chicken + rice + salad',
      recoveryDay: 'Tuna salad + crackers',
    },
    {
      slot: 'snack',
      time: '16:00',
      default: 'Fruit + handful of nuts',
      liftDay: 'Banana + small yogurt (pre-training fuel)',
      recoveryDay: 'Apple + nut butter',
    },
    {
      slot: 'dinner',
      time: '19:00',
      default: 'Salmon or chicken + veg + small potato or rice',
      liftDay: 'Chicken + rice + roasted veg',
      recoveryDay: 'Salmon + salad + boiled egg',
    },
  ],
  macroTargetsByDayType: {
    recovery: { calories: [1650, 1800], protein: 125, carbs: [110, 150], fat: null },
    moderate: { calories: [1750, 1900], protein: 125, carbs: [140, 180], fat: null },
    high:     { calories: [1800, 2000], protein: 125, carbs: [160, 200], fat: null },
    highest:  { calories: [1850, 2050], protein: 125, carbs: [170, 210], fat: null },
  },
  emergencyRule: 'If meal prep falls apart: Greek yogurt + fruit + nuts is always an acceptable bridge meal. Never skip protein.',
};
