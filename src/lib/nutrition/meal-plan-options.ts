import type { NutritionPlanSeed } from '@/lib/seed/nutrition';
import type { DayType } from '@/lib/types';

export type MealScheduleSlot = NutritionPlanSeed['mealSchedule'][number];

/** Ordered unique strings from the seed slot — includes byDayType variants when present. */
export function getPlanLineOptions(
  slot: MealScheduleSlot,
  _isLiftDay: boolean,
  dayType?: DayType
): string[] {
  const raw: string[] = [];
  if (dayType && slot.byDayType?.[dayType]) raw.push(slot.byDayType[dayType]!);
  raw.push(slot.default);
  if (slot.liftDay) raw.push(slot.liftDay);
  if (slot.recoveryDay) raw.push(slot.recoveryDay);
  if (slot.byDayType) {
    for (const v of Object.values(slot.byDayType)) {
      if (v) raw.push(v);
    }
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of raw) {
    if (line.trim() && !seen.has(line)) {
      seen.add(line);
      out.push(line);
    }
  }
  return out;
}

/** Default plan line for the slot given lift/recovery + day-type context. */
export function getDefaultPlanLine(
  slot: MealScheduleSlot,
  isLiftDay: boolean,
  dayType?: DayType
): string {
  if (slot.liftDayOnly && !isLiftDay) return '';
  if (dayType && slot.byDayType?.[dayType]) return slot.byDayType[dayType]!;
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
