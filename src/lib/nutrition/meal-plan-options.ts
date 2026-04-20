import type { NutritionPlanSeed } from '@/lib/seed/nutrition';

export type MealScheduleSlot = NutritionPlanSeed['mealSchedule'][number];

/** Ordered unique strings from the seed slot (default, lift, recovery). */
export function getPlanLineOptions(
  slot: MealScheduleSlot,
  _isLiftDay: boolean
): string[] {
  const raw = [slot.default, slot.liftDay, slot.recoveryDay].filter(
    (s): s is string => typeof s === 'string' && s.trim().length > 0
  );
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw) {
    if (!seen.has(line)) {
      seen.add(line);
      out.push(line);
    }
  }
  return out;
}

/** Default plan line for the slot given lift vs recovery context. */
export function getDefaultPlanLine(
  slot: MealScheduleSlot,
  isLiftDay: boolean
): string {
  if (slot.liftDayOnly && !isLiftDay) return '';
  if (isLiftDay && slot.liftDay) return slot.liftDay;
  if (!isLiftDay && slot.recoveryDay) return slot.recoveryDay;
  return slot.default;
}

/** Ensure the active selection appears in the dropdown list. */
export function mergePlanLineOptions(
  options: string[],
  current: string
): string[] {
  if (!current.trim()) return options;
  if (options.includes(current)) return options;
  return [current, ...options];
}
