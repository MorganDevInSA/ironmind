export interface NutritionPlanSeed {
  proteinTarget: number;
  coreProteinRotation: string[];
  mealSchedule: {
    slot: string;
    time: string;
    liftDay?: string;
    recoveryDay?: string;
    liftDayOnly?: boolean;
    default: string;
  }[];
  macroTargetsByDayType: {
    recovery: { calories: [number, number]; protein: number; carbs: [number, number]; fat: null };
    moderate: { calories: [number, number]; protein: number; carbs: [number, number]; fat: null };
    high: { calories: [number, number]; protein: number; carbs: [number, number]; fat: null };
    highest: { calories: [number, number]; protein: number; carbs: [number, number]; fat: null };
  };
  emergencyRule: string;
}

export const morganNutritionPlan: NutritionPlanSeed = {
  proteinTarget: 190,
  coreProteinRotation: [
    'Chicken Thighs',
    'Pork Loin',
    'Ostrich Mince',
    'Burgers',
    'Hake',
    'Eggs',
    'Yogurt',
    'Cottage Cheese',
    'Whey/Mass Gainer',
  ],
  mealSchedule: [
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
  ],
  macroTargetsByDayType: {
    recovery: {
      calories: [2500, 2900],
      protein: 190,
      carbs: [180, 250],
      fat: null,
    },
    moderate: {
      calories: [2900, 3300],
      protein: 190,
      carbs: [275, 350],
      fat: null,
    },
    high: {
      calories: [3200, 3600],
      protein: 190,
      carbs: [350, 450],
      fat: null,
    },
    highest: {
      calories: [3400, 3800],
      protein: 190,
      carbs: [400, 500],
      fat: null,
    },
  },
  emergencyRule: 'If bodyweight drops 2 consecutive mornings: add one concrete bump (+1 gainer scoop, +40-80g carbs, or +15-20g fat from nuts/oils). Reassess after 3-4 days.',
};
