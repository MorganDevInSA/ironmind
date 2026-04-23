import type { NutritionDay, MacroTargetRange, DayType } from '@/lib/types';
import {
  getDocument,
  setDocument,
  deleteDocument,
  queryDocuments,
  where,
  orderBy,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { defaultMacroTargets } from '@/lib/constants/day-types';
import type { NutritionPlanSeed } from '@/lib/seed/nutrition';
import { withService } from '@/lib/errors';

const converter = createConverter<NutritionDay>();

// Get nutrition day
export async function getNutritionDay(userId: string, date: string): Promise<NutritionDay | null> {
  return withService('nutrition', 'read nutrition day', () =>
    getDocument<NutritionDay>(collections.nutritionDays(userId), date, converter),
  );
}

// Save nutrition day
export async function saveNutritionDay(
  userId: string,
  date: string,
  data: Partial<NutritionDay>,
): Promise<void> {
  return withService('nutrition', 'save nutrition day', () =>
    setDocument<NutritionDay>(
      collections.nutritionDays(userId),
      date,
      { ...data, date } as NutritionDay,
      converter,
    ),
  );
}

// Get nutrition history
export async function getNutritionHistory(
  userId: string,
  dateRange: { from: string; to: string },
): Promise<NutritionDay[]> {
  return withService('nutrition', 'read nutrition history', () =>
    queryDocuments<NutritionDay>(
      collections.nutritionDays(userId),
      [
        where('date', '>=', dateRange.from),
        where('date', '<=', dateRange.to),
        orderBy('date', 'desc'),
      ],
      converter,
    ),
  );
}

// Get recent nutrition days
export async function getRecentNutritionDays(
  userId: string,
  days: number = 14,
): Promise<NutritionDay[]> {
  return withService('nutrition', 'read recent nutrition days', () => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return queryDocuments<NutritionDay>(
      collections.nutritionDays(userId),
      [where('date', '>=', fromDate.toISOString().split('T')[0]), orderBy('date', 'desc')],
      converter,
    );
  });
}

// Save the user's nutrition plan (meal schedule + macro targets)
export async function saveNutritionPlan(userId: string, plan: NutritionPlanSeed): Promise<void> {
  return withService('nutrition', 'save nutrition plan', () => {
    const planConverter = createConverter<NutritionPlanSeed>();
    return setDocument<NutritionPlanSeed>(
      collections.nutritionPlan(userId),
      'current',
      plan,
      planConverter,
    );
  });
}

// Get the user's active nutrition plan
export async function getNutritionPlan(userId: string): Promise<NutritionPlanSeed | null> {
  return withService('nutrition', 'read nutrition plan', () => {
    const planConverter = createConverter<NutritionPlanSeed>();
    return getDocument<NutritionPlanSeed>(
      collections.nutritionPlan(userId),
      'current',
      planConverter,
    );
  });
}

// Get macro targets for a specific day type
export function getMacroTargets(dayType: DayType): MacroTargetRange {
  return defaultMacroTargets[dayType];
}

// Calculate compliance score
export function calculateCompliance(nutritionDay: NutritionDay): number {
  const { macroActuals, macroTargets } = nutritionDay;

  // Calculate protein compliance (most important)
  const proteinCompliance = Math.min(100, (macroActuals.protein / macroTargets.protein) * 100);

  // Calculate calorie compliance (within range)
  const calorieMidpoint = (macroTargets.calories[0] + macroTargets.calories[1]) / 2;
  const calorieDiff = Math.abs(macroActuals.calories - calorieMidpoint);
  const calorieRange = macroTargets.calories[1] - macroTargets.calories[0];
  const calorieCompliance = Math.max(0, 100 - (calorieDiff / calorieRange) * 100);

  // Weight protein more heavily (60/40 split)
  return Math.round(proteinCompliance * 0.6 + calorieCompliance * 0.4);
}

// Update a meal in a nutrition day
export async function updateMeal(
  userId: string,
  date: string,
  mealSlot: string,
  updates: Partial<NutritionDay['meals'][0]>,
): Promise<void> {
  return withService('nutrition', 'update meal', async () => {
    const day = await getNutritionDay(userId, date);

    if (!day) {
      throw new Error('Nutrition day not found');
    }

    const mealIndex = day.meals.findIndex((m) => m.slot === mealSlot);
    if (mealIndex === -1) {
      throw new Error('Meal slot not found');
    }

    day.meals[mealIndex] = { ...day.meals[mealIndex], ...updates };

    const { calculateCalories } = await import('@/lib/utils/calculations');
    const protein = day.meals.reduce(
      (sum, meal) => sum + meal.foods.reduce((s, f) => s + f.protein, 0),
      0,
    );
    const carbs = day.meals.reduce(
      (sum, meal) => sum + meal.foods.reduce((s, f) => s + f.carbs, 0),
      0,
    );
    const fat = day.meals.reduce((sum, meal) => sum + meal.foods.reduce((s, f) => s + f.fat, 0), 0);

    day.macroActuals = {
      protein,
      carbs,
      fat,
      calories: calculateCalories(protein, carbs, fat),
    };

    day.complianceScore = calculateCompliance(day);

    await saveNutritionDay(userId, date, day);
  });
}

// Add food to a meal
export async function addFoodToMeal(
  userId: string,
  date: string,
  mealSlot: string,
  food: NutritionDay['meals'][0]['foods'][0],
): Promise<void> {
  return withService('nutrition', 'add food to meal', async () => {
    const day = await getNutritionDay(userId, date);

    if (!day) {
      throw new Error('Nutrition day not found');
    }

    const mealIndex = day.meals.findIndex((m) => m.slot === mealSlot);
    if (mealIndex === -1) {
      throw new Error('Meal slot not found');
    }

    day.meals[mealIndex].foods.push(food);
    day.meals[mealIndex].completed = true;

    await saveNutritionDay(userId, date, day);
  });
}

// Remove food from a meal
export async function removeFoodFromMeal(
  userId: string,
  date: string,
  mealSlot: string,
  foodId: string,
): Promise<void> {
  return withService('nutrition', 'remove food from meal', async () => {
    const day = await getNutritionDay(userId, date);

    if (!day) {
      throw new Error('Nutrition day not found');
    }

    const mealIndex = day.meals.findIndex((m) => m.slot === mealSlot);
    if (mealIndex === -1) {
      throw new Error('Meal slot not found');
    }

    day.meals[mealIndex].foods = day.meals[mealIndex].foods.filter((f) => f.id !== foodId);

    await saveNutritionDay(userId, date, day);
  });
}

/** Used by import compensating rollback — removes one day doc. */
export async function deleteNutritionDay(userId: string, date: string): Promise<void> {
  return withService('nutrition', 'delete nutrition day', () =>
    deleteDocument(collections.nutritionDays(userId), date),
  );
}

/** Removes the stored plan doc (`current`) — import rollback when no prior plan existed. */
export async function deleteNutritionPlanCurrent(userId: string): Promise<void> {
  return withService('nutrition', 'delete nutrition plan', () =>
    deleteDocument(collections.nutritionPlan(userId), 'current'),
  );
}
