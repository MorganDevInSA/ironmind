import type { MealSlot } from '@/lib/types';

export const mealSlots: MealSlot[] = [
  {
    slot: 'morning',
    time: '07:30',
    liftDay: 'USN Mass Gainer + banana',
    recoveryDay: 'Yogurt bowl',
    default: 'Yogurt bowl / Fruit + nuts',
  },
  {
    slot: 'mid-morning',
    time: '10:30',
    default: 'Yogurt bowl / Fruit + nuts (granola, mixed nuts, custard, chocolate, berries)',
  },
  {
    slot: 'lunch',
    time: '13:00',
    default: 'Main protein + rice/potato + veg',
  },
  {
    slot: 'afternoon',
    time: '16:00',
    default: 'Fruit / coffee / tea',
  },
  {
    slot: 'post-workout',
    time: '18:30',
    liftDayOnly: true,
    default: 'Shake (fast protein + carbs)',
  },
  {
    slot: 'dinner',
    time: '19:30',
    default: 'Evening protein + veg + carbs as needed',
  },
  {
    slot: 'bed-meal',
    time: '22:00',
    default: 'Cottage cheese / Yogurt / Egg mayo',
  },
];

export const coreProteinRotation = [
  'Chicken Thighs',
  'Pork Loin',
  'Ostrich Mince',
  'Burgers',
  'Hake',
  'Eggs',
  'Yogurt',
  'Cottage Cheese',
  'Whey/Mass Gainer',
];

export const coreCarbRotation = [
  'Rice',
  'Potatoes',
  'Oats',
  'Bananas',
  'Granola',
  'Fruit',
];

export const coreFatRotation = [
  'Mixed Nuts',
  'Mayo',
  'Chocolate',
  'Cooking Oils',
];
