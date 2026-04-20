import type { NutritionPlanSeed } from './nutrition';

export const alexNutritionPlan: NutritionPlanSeed = {
  proteinTarget: 175,
  coreProteinRotation: [
    'chicken breast',
    'lean beef mince',
    'eggs',
    'Greek yogurt',
    'cottage cheese',
    'salmon',
    'whey protein',
  ],
  mealSchedule: [
    {
      slot: 'breakfast',
      time: '07:30',
      default: '4 eggs + oats + fruit',
      liftDay: '4 eggs + oats + banana (pre-fuel)',
      recoveryDay: 'Greek yogurt + granola + fruit',
    },
    {
      slot: 'lunch',
      time: '13:00',
      default: 'Chicken + rice + veg',
      liftDay: 'Chicken + rice + veg (larger portion)',
      recoveryDay: 'Chicken salad or wrap',
    },
    {
      slot: 'preworkout',
      time: '17:00',
      liftDayOnly: true,
      default: 'Banana + rice cakes or small carb snack',
      liftDay: 'Banana + rice cakes',
    },
    {
      slot: 'postworkout',
      time: '18:30',
      liftDayOnly: true,
      default: 'Shake (whey + banana) or chicken + rice',
      liftDay: 'Shake (whey + banana) or chicken + rice',
    },
    {
      slot: 'dinner',
      time: '19:30',
      default: 'Beef mince + potato + veg',
      liftDay: 'Beef mince + potato + veg (larger portion)',
      recoveryDay: 'Salmon + rice + salad',
    },
    {
      slot: 'bed-snack',
      time: '22:00',
      default: 'Cottage cheese or Greek yogurt',
    },
  ],
  macroTargetsByDayType: {
    recovery:  { calories: [2800, 3000], protein: 175, carbs: [250, 310], fat: null },
    moderate:  { calories: [3000, 3200], protein: 175, carbs: [300, 360], fat: null },
    high:      { calories: [3200, 3500], protein: 175, carbs: [360, 420], fat: null },
    highest:   { calories: [3400, 3700], protein: 175, carbs: [400, 470], fat: null },
  },
  emergencyRule: 'If appetite is low on a lift day: prioritise protein and carbs first. Add a shake and extra rice — do not skip the post-workout window.',
};
