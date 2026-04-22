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
    /** Per-day-type portion descriptions. Overrides default/liftDay/recoveryDay when present. */
    byDayType?: Partial<Record<'recovery' | 'moderate' | 'high' | 'highest', string>>;
  }[];
  macroTargetsByDayType: {
    recovery: { calories: [number, number]; protein: number; carbs: [number, number]; fat: null };
    moderate: { calories: [number, number]; protein: number; carbs: [number, number]; fat: null };
    high: { calories: [number, number]; protein: number; carbs: [number, number]; fat: null };
    highest: { calories: [number, number]; protein: number; carbs: [number, number]; fat: null };
  };
  emergencyRule: string;
}

export const mortonNutritionPlan: NutritionPlanSeed = {
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
      byDayType: {
        recovery: 'Yogurt bowl (small)',
        moderate: '2 boiled eggs + fruit',
        high: 'USN Mass Gainer + banana',
        highest: 'USN Mass Gainer + banana + oats',
      },
    },
    {
      slot: 'mid-morning',
      time: '10:30',
      default: 'Yogurt bowl / Fruit + nuts (granola, mixed nuts, custard, chocolate, berries)',
      byDayType: {
        recovery: 'Fruit + small handful nuts',
        moderate: 'Yogurt bowl + granola + berries',
        high: 'Yogurt bowl + granola + nuts + custard',
        highest: 'Large yogurt bowl + granola + nuts + chocolate + berries',
      },
    },
    {
      slot: 'lunch',
      time: '13:00',
      default: 'Main protein + rice/potato + veg',
      byDayType: {
        recovery: 'Protein + veg (light carbs)',
        moderate: 'Protein + 1 cup rice + veg',
        high: 'Protein + 1.5 cups rice + veg',
        highest: 'Double protein + 2 cups rice + veg',
      },
    },
    {
      slot: 'afternoon',
      time: '16:00',
      default: 'Fruit / coffee / tea',
      byDayType: {
        recovery: 'Coffee / tea',
        moderate: 'Banana + coffee (pre-training)',
        high: 'Banana + rice cake + coffee (pre-training)',
        highest: 'Banana + PB toast + coffee (pre-training)',
      },
    },
    {
      slot: 'post-workout',
      time: '18:30',
      liftDayOnly: true,
      default: 'Shake (fast protein + carbs)',
      byDayType: {
        high: 'Whey shake + banana',
        highest: 'Mass gainer shake + banana + oats',
      },
    },
    {
      slot: 'dinner',
      time: '19:30',
      default: 'Evening protein + veg + carbs as needed',
      byDayType: {
        recovery: 'Mince + veg (no starch)',
        moderate: 'Mince + rice + veg',
        high: 'Large protein + rice + veg + gravy',
        highest: 'Double protein + 2 cups rice + veg + extras',
      },
    },
    {
      slot: 'bed-meal',
      time: '22:00',
      default: 'Cottage cheese / Yogurt / Egg mayo',
      byDayType: {
        recovery: 'Yogurt (if hungry)',
        moderate: 'Cottage cheese + berries',
        high: 'Cottage cheese + granola + honey',
        highest: 'Cottage cheese + PB + granola + honey',
      },
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
