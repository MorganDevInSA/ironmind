import type { NutritionPlanSeed } from './nutrition';

export const fezNutritionPlan: NutritionPlanSeed = {
  proteinTarget: 155,
  coreProteinRotation: [
    'firm tofu',
    'tempeh',
    'TVP / soy mince',
    'lentils + rice',
    'black beans',
    'pea + rice protein powder',
    'high-protein soy yogurt',
  ],
  mealSchedule: [
    {
      slot: 'pre-training',
      time: '05:45',
      default: 'Dates + small banana + electrolyte water',
      liftDay: 'Rice cake + jam + half scoop plant protein',
      recoveryDay: 'Fruit + handful nuts',
    },
    {
      slot: 'breakfast',
      time: '07:30',
      default: 'Tofu scramble + wholegrain toast + spinach',
      liftDay: 'Large smoothie: soy milk, oats, berries, 2 scoops protein',
      recoveryDay: 'Tempeh bowl + quinoa + greens',
    },
    {
      slot: 'lunch',
      time: '13:00',
      default: 'Lentil pasta + roasted veg + olive oil',
      liftDay: 'Burrito bowl: rice, beans, salsa, guac, extra tofu',
      recoveryDay: 'Chickpea salad + pita + tahini',
    },
    {
      slot: 'snack',
      time: '16:30',
      default: 'Soy yogurt + granola + flax',
      liftDay: 'Protein bar (vegan) or edamame',
      recoveryDay: 'Hummus + crackers + cucumber',
    },
    {
      slot: 'dinner',
      time: '19:30',
      default: 'Tempeh stir-fry + noodles or rice + veg',
      liftDay: 'Seitan or tofu satay + jasmine rice + broccoli',
      recoveryDay: 'Bean chili + cornbread (vegan)',
    },
  ],
  macroTargetsByDayType: {
    recovery: { calories: [2550, 2750], protein: 155, carbs: [280, 340], fat: null },
    moderate: { calories: [2650, 2850], protein: 155, carbs: [300, 360], fat: null },
    high: { calories: [2800, 3000], protein: 155, carbs: [320, 400], fat: null },
    highest: { calories: [2900, 3150], protein: 155, carbs: [340, 420], fat: null },
  },
  emergencyRule:
    'If calories fall short: add a second shake (soy milk + oats + protein + peanut butter). Never skip the post-training liquid meal on double-session days.',
};
