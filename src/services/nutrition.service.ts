import type { NutritionDay, MacroTargetRange, DayType } from '@/lib/types';
import {
  getDocument,
  setDocument,
  queryDocuments,
  where,
  orderBy,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { defaultMacroTargets } from '@/lib/constants/day-types';
import type { NutritionPlanSeed } from '@/lib/seed/nutrition';

const converter = createConverter<NutritionDay>();

// Get nutrition day
export async function getNutritionDay(
  userId: string,
  date: string
): Promise<NutritionDay | null> {
  return getDocument<NutritionDay>(
    collections.nutritionDays(userId),
    date,
    converter
  );
}

// Save nutrition day
export async function saveNutritionDay(
  userId: string,
  date: string,
  data: Partial<NutritionDay>
): Promise<void> {
  await setDocument<NutritionDay>(
    collections.nutritionDays(userId),
    date,
    { ...data, date } as NutritionDay,
    converter
  );
}

// Get nutrition history
export async function getNutritionHistory(
  userId: string,
  dateRange: { from: string; to: string }
): Promise<NutritionDay[]> {
  return queryDocuments<NutritionDay>(
    collections.nutritionDays(userId),
    [
      where('date', '>=', dateRange.from),
      where('date', '<=', dateRange.to),
      orderBy('date', 'desc'),
    ],
    converter
  );
}

// Get recent nutrition days
export async function getRecentNutritionDays(
  userId: string,
  days: number = 14
): Promise<NutritionDay[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  return queryDocuments<NutritionDay>(
    collections.nutritionDays(userId),
    [
      where('date', '>=', fromDate.toISOString().split('T')[0]),
      orderBy('date', 'desc'),
    ],
    converter
  );
}

// Save the user's nutrition plan (meal schedule + macro targets)
export async function saveNutritionPlan(
  userId: string,
  plan: NutritionPlanSeed
): Promise<void> {
  const planConverter = createConverter<NutritionPlanSeed>();
  await setDocument<NutritionPlanSeed>(
    collections.nutritionPlan(userId),
    'current',
    plan,
    planConverter
  );
}

// Get the user's active nutrition plan
export async function getNutritionPlan(
  userId: string
): Promise<NutritionPlanSeed | null> {
  const planConverter = createConverter<NutritionPlanSeed>();
  return getDocument<NutritionPlanSeed>(
    collections.nutritionPlan(userId),
    'current',
    planConverter
  );
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
  return Math.round((proteinCompliance * 0.6) + (calorieCompliance * 0.4));
}

// Check if consecutive days had weight drops (calorie emergency rule)
export async function checkCalorieEmergency(
  userId: string,
  daysToCheck: number = 2
): Promise<{ triggered: boolean; dates: string[]; weights: number[] }> {
  const history = await getRecentNutritionDays(userId, daysToCheck + 1);

  if (history.length < daysToCheck) {
    return { triggered: false, dates: [], weights: [] };
  }

  // Sort by date ascending
  const sorted = history.sort((a, b) => a.date.localeCompare(b.date));

  const recentWeights = sorted.slice(-daysToCheck);
  const weights = recentWeights.map(day => day.macroActuals.calories);

  // Check if each day is lower than the previous
  let allDropping = true;
  for (let i = 1; i < weights.length; i++) {
    if (weights[i] >= weights[i - 1]) {
      allDropping = false;
      break;
    }
  }

  return {
    triggered: allDropping && weights.length >= daysToCheck,
    dates: recentWeights.map(day => day.date),
    weights,
  };
}

// Update a meal in a nutrition day
export async function updateMeal(
  userId: string,
  date: string,
  mealSlot: string,
  updates: Partial<NutritionDay['meals'][0]>
): Promise<void> {
  const day = await getNutritionDay(userId, date);

  if (!day) {
    // Create new day if not exists
    throw new Error('Nutrition day not found');
  }

  const mealIndex = day.meals.findIndex(m => m.slot === mealSlot);
  if (mealIndex === -1) {
    throw new Error('Meal slot not found');
  }

  day.meals[mealIndex] = { ...day.meals[mealIndex], ...updates };

  // Recalculate macros
  const { calculateCalories } = await import('@/lib/utils/calculations');
  const protein = day.meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + f.protein, 0), 0);
  const carbs = day.meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + f.carbs, 0), 0);
  const fat = day.meals.reduce((sum, meal) =>
    sum + meal.foods.reduce((s, f) => s + f.fat, 0), 0);

  day.macroActuals = {
    protein,
    carbs,
    fat,
    calories: calculateCalories(protein, carbs, fat),
  };

  day.complianceScore = calculateCompliance(day);

  await saveNutritionDay(userId, date, day);
}

// Add food to a meal
export async function addFoodToMeal(
  userId: string,
  date: string,
  mealSlot: string,
  food: NutritionDay['meals'][0]['foods'][0]
): Promise<void> {
  const day = await getNutritionDay(userId, date);

  if (!day) {
    throw new Error('Nutrition day not found');
  }

  const mealIndex = day.meals.findIndex(m => m.slot === mealSlot);
  if (mealIndex === -1) {
    throw new Error('Meal slot not found');
  }

  day.meals[mealIndex].foods.push(food);
  day.meals[mealIndex].completed = true;

  await saveNutritionDay(userId, date, day);
}

// Remove food from a meal
export async function removeFoodFromMeal(
  userId: string,
  date: string,
  mealSlot: string,
  foodId: string
): Promise<void> {
  const day = await getNutritionDay(userId, date);

  if (!day) {
    throw new Error('Nutrition day not found');
  }

  const mealIndex = day.meals.findIndex(m => m.slot === mealSlot);
  if (mealIndex === -1) {
    throw new Error('Meal slot not found');
  }

  day.meals[mealIndex].foods = day.meals[mealIndex].foods.filter(f => f.id !== foodId);

  await saveNutritionDay(userId, date, day);
}
