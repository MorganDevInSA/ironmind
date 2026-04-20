import { differenceInDays, startOfDay, parseISO } from 'date-fns';

/**
 * Determine the current day in an N-day rotating cycle
 * @param startDate - The date when the cycle started (ISO string)
 * @param currentDate - The current date (ISO string)
 * @param cycleLengthDays - Length of the cycle (e.g., 14 for Morton's program)
 * @returns Day number in the cycle (1 to cycleLengthDays)
 */
export function getCycleDay(
  startDate: string,
  currentDate: string,
  cycleLengthDays: number
): number {
  const start = startOfDay(parseISO(startDate));
  const current = startOfDay(parseISO(currentDate));
  const daysDiff = differenceInDays(current, start);

  // Use modulo to wrap around, handle negative days for dates before start
  const dayInCycle = ((daysDiff % cycleLengthDays) + cycleLengthDays) % cycleLengthDays;

  // Return 1-indexed day
  return dayInCycle + 1;
}

/**
 * Get the week number within a cycle
 * @param dayInCycle - Current day in cycle (1 to cycleLengthDays)
 * @param daysPerWeek - Number of days per week (default 7)
 * @returns Week number in the cycle
 */
export function getCycleWeek(
  dayInCycle: number,
  daysPerWeek = 7
): number {
  return Math.ceil(dayInCycle / daysPerWeek);
}

/**
 * Check if a day is a repeat/progression day
 * For Morton's 14-day cycle: Days 1-7 are Week 1, Days 9-13 are Week 2 (repeats with progression)
 * @param dayInCycle - Current day in cycle
 * @returns Whether this day should apply progression rules
 */
export function isProgressionDay(dayInCycle: number): boolean {
  // Days 9-13 in a 14-day cycle are progression days
  return dayInCycle >= 9 && dayInCycle <= 13;
}

/**
 * Get the "base" day for a progression day
 * For example, Day 9 corresponds to Day 1, Day 11 corresponds to Day 3
 * @param dayInCycle - Current day in cycle
 * @param cycleLengthDays - Length of the cycle
 * @returns The base day number that this progression day corresponds to
 */
export function getBaseDayForProgression(
  dayInCycle: number,
  cycleLengthDays: number
): number {
  const halfCycle = Math.floor(cycleLengthDays / 2);

  if (dayInCycle <= halfCycle) {
    return dayInCycle; // Not a progression day
  }

  // Progression day - subtract half cycle
  return dayInCycle - halfCycle;
}

/**
 * Get all dates for a specific cycle day across multiple cycles
 * Useful for tracking KPI performance across weeks
 * @param startDate - When the cycle started
 * @param targetCycleDay - Which day in the cycle (1 to cycleLengthDays)
 * @param cycleLengthDays - Length of the cycle
 * @param numberOfCycles - How many cycles to look back
 * @returns Array of ISO date strings
 */
export function getDatesForCycleDay(
  startDate: string,
  targetCycleDay: number,
  cycleLengthDays: number,
  numberOfCycles: number
): string[] {
  const dates: string[] = [];
  const start = parseISO(startDate);

  for (let cycle = 0; cycle < numberOfCycles; cycle++) {
    const dayOffset = cycle * cycleLengthDays + (targetCycleDay - 1);
    const date = new Date(start);
    date.setDate(date.getDate() + dayOffset);
    dates.push(date.toISOString().split('T')[0]);
  }

  return dates;
}

/**
 * Check if today should be a specific session type
 * @param startDate - When the cycle started
 * @param currentDate - Today's date
 * @param cycleLengthDays - Length of the cycle
 * @param targetCycleDay - The day number to check for
 * @returns Whether today matches the target cycle day
 */
export function isSpecificCycleDay(
  startDate: string,
  currentDate: string,
  cycleLengthDays: number,
  targetCycleDay: number
): boolean {
  const currentDay = getCycleDay(startDate, currentDate, cycleLengthDays);
  return currentDay === targetCycleDay;
}

/**
 * Get session type for a specific day in Morton's 14-day cycle
 * @param dayInCycle - Day number (1-14)
 * @returns Session type
 */
export function getSessionTypeForDay(dayInCycle: number): 'lift' | 'cardio' | 'recovery' {
  // Morton's 14-day split:
  // Days 1, 3, 5, 7, 9, 11, 13 are various lift sessions
  // Days 2, 4, 6, 8, 10, 12 are cardio/breath/abs
  // Day 14 is full recovery

  const liftDays = [1, 3, 5, 7, 9, 11, 13];
  const cardioDays = [2, 4, 6, 8, 10, 12];

  if (liftDays.includes(dayInCycle)) return 'lift';
  if (cardioDays.includes(dayInCycle)) return 'cardio';
  return 'recovery';
}

/**
 * Get the day type (for nutrition targets) based on session type
 * @param sessionType - Type of session
 * @returns Day type for macro targets
 */
export function getDayTypeFromSessionType(
  sessionType: 'lift' | 'cardio' | 'recovery'
): 'recovery' | 'moderate' | 'high' | 'highest' {
  switch (sessionType) {
    case 'lift':
      return 'high';
    case 'cardio':
      return 'moderate';
    case 'recovery':
      return 'recovery';
    default:
      return 'moderate';
  }
}

/**
 * Generate a cycle summary for display
 * @param dayInCycle - Current day
 * @param cycleLengthDays - Total cycle length
 * @returns Human-readable summary
 */
export function getCycleSummary(dayInCycle: number, cycleLengthDays: number): string {
  const week = getCycleWeek(dayInCycle);
  const isProgression = isProgressionDay(dayInCycle);

  return `Week ${week}, Day ${dayInCycle}/${cycleLengthDays}${isProgression ? ' (Progression)' : ''}`;
}
