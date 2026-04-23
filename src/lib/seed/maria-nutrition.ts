import type { NutritionPlanSeed } from './nutrition';

export const mariaNutritionPlan: NutritionPlanSeed = {
  proteinTarget: 95,
  coreProteinRotation: [
    'Greek yogurt',
    'eggs',
    'cottage cheese',
    'chicken',
    'tinned tuna',
    'lentils',
    'mince',
  ],
  mealSchedule: [
    {
      slot: 'breakfast',
      time: '08:00',
      default: 'Greek yogurt + fruit + toast',
      liftDay: 'Eggs + oats + berries',
      recoveryDay: 'Smoothie + peanut butter',
    },
    {
      slot: 'lunch',
      time: '12:30',
      default: 'Leftovers or sandwich + salad',
      liftDay: 'Chicken wrap + soup',
      recoveryDay: 'Tuna pasta salad',
    },
    {
      slot: 'snack',
      time: '15:30',
      default: 'Cheese + crackers or fruit',
      liftDay: 'Protein yogurt',
      recoveryDay: 'Handful nuts',
    },
    {
      slot: 'dinner',
      time: '19:00',
      default: 'Family-style meal — protein + veg + carbs',
      liftDay: 'Larger portion rice/pasta with lean protein',
      recoveryDay: 'Roast + veg + potato',
    },
  ],
  macroTargetsByDayType: {
    recovery: { calories: [1850, 2050], protein: 95, carbs: [160, 210], fat: null },
    moderate: { calories: [1950, 2150], protein: 95, carbs: [180, 230], fat: null },
    high: { calories: [2050, 2250], protein: 95, carbs: [200, 250], fat: null },
    highest: { calories: [2100, 2350], protein: 95, carbs: [210, 270], fat: null },
  },
  emergencyRule:
    'If the week goes sideways with social plans: hit protein at two meals minimum, then reset next day — no punishment cycles.',
};
