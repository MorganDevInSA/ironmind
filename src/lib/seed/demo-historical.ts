import type {
  AthleteProfile,
  CheckIn,
  DayType,
  Food,
  JournalEntry,
  Meal,
  NutritionDay,
  Program,
  RecoveryEntry,
  SessionExercise,
  SupplementProtocol,
  Workout,
  WorkoutExercise,
} from '@/lib/types';
import type { NutritionPlanSeed } from './nutrition';
import { createWorkout } from '@/services/training.service';
import { saveNutritionDay } from '@/services/nutrition.service';
import { saveSupplementLog } from '@/services/supplements.service';
import { saveRecoveryEntry } from '@/services/recovery.service';
import { deleteAllCheckIns, saveCheckIn } from '@/services/physique.service';
import { createJournalEntry } from '@/services/coaching.service';
import { calculateCalories, calculateComplianceScore } from '@/lib/utils/calculations';
import { addDays, format, parseISO, startOfDay } from 'date-fns';
import {
  DEMO_PHYSIQUE_WEEKLY_BY_PERSONA,
  type DemoPersonaId,
  type DemoPhysiqueWeek,
} from './demo-data/physique';

/**
 * Demo overwrite seeds (`seedMortonData`, etc.) align program `startDate` and
 * `seedDemoHistoricalData` to this window. Keep bounded (writes scale linearly).
 *
 * 84 is a multiple of 7 and 14 so the calendar last day of the window (inclusive
 * of "today") is always the final day of the program cycle when `startDate` matches
 * the first seeded day.
 */
export const DEMO_HISTORY_DAYS = 84;

/** First calendar day of the demo history window (local), as `YYYY-MM-DD`. */
export function getDemoHistoryStartDateString(days: number = DEMO_HISTORY_DAYS): string {
  return format(addDays(startOfDay(new Date()), -days + 1), 'yyyy-MM-dd');
}

interface HistoricalSeedContext {
  personaId: DemoPersonaId;
  userId: string;
  profile: AthleteProfile;
  programId: string;
  program: Omit<Program, 'id'>;
  nutritionPlan: NutritionPlanSeed;
  supplementProtocol: SupplementProtocol;
  days?: number;
  /** Must match active program `startDate` — single source of truth with overwrite seeds. */
  historyStartDate?: string;
}

interface PersonaTuning {
  workoutAdherence: number;
  nutritionAdherence: number;
  supplementAdherence: number;
  avgSleepHours: number;
  avgSleepQuality: number;
  avgHrv: number;
  avgStress: number;
  avgEnergy: number;
  avgMood: number;
  avgDomsOnLift: number;
  mealPortionMultiplier: number;
}

const personaTuning: Record<DemoPersonaId, PersonaTuning> = {
  morton: {
    workoutAdherence: 0.93,
    nutritionAdherence: 0.87,
    supplementAdherence: 0.84,
    avgSleepHours: 7.2,
    avgSleepQuality: 7.2,
    avgHrv: 70,
    avgStress: 4.6,
    avgEnergy: 7.5,
    avgMood: 7.4,
    avgDomsOnLift: 5.5,
    mealPortionMultiplier: 1.05,
  },
  sheri: {
    workoutAdherence: 0.78,
    nutritionAdherence: 0.74,
    supplementAdherence: 0.68,
    avgSleepHours: 6.6,
    avgSleepQuality: 6.4,
    avgHrv: 58,
    avgStress: 6,
    avgEnergy: 6.1,
    avgMood: 6.4,
    avgDomsOnLift: 4.7,
    mealPortionMultiplier: 0.92,
  },
  alex: {
    workoutAdherence: 0.9,
    nutritionAdherence: 0.85,
    supplementAdherence: 0.82,
    avgSleepHours: 7,
    avgSleepQuality: 6.9,
    avgHrv: 68,
    avgStress: 5.1,
    avgEnergy: 7.2,
    avgMood: 7.1,
    avgDomsOnLift: 5.8,
    mealPortionMultiplier: 1.02,
  },
  jordan: {
    workoutAdherence: 0.76,
    nutritionAdherence: 0.77,
    supplementAdherence: 0.72,
    avgSleepHours: 6.7,
    avgSleepQuality: 6.5,
    avgHrv: 62,
    avgStress: 5.5,
    avgEnergy: 6.2,
    avgMood: 6.6,
    avgDomsOnLift: 4.8,
    mealPortionMultiplier: 0.94,
  },
  fez: {
    workoutAdherence: 0.91,
    nutritionAdherence: 0.86,
    supplementAdherence: 0.84,
    avgSleepHours: 7.5,
    avgSleepQuality: 7.6,
    avgHrv: 74,
    avgStress: 4.2,
    avgEnergy: 7.8,
    avgMood: 7.6,
    avgDomsOnLift: 5.2,
    mealPortionMultiplier: 1.06,
  },
  maria: {
    workoutAdherence: 0.72,
    nutritionAdherence: 0.78,
    supplementAdherence: 0.7,
    avgSleepHours: 6.5,
    avgSleepQuality: 6.3,
    avgHrv: 60,
    avgStress: 5.8,
    avgEnergy: 6.4,
    avgMood: 6.5,
    avgDomsOnLift: 4.5,
    mealPortionMultiplier: 1,
  },
};

const foodTemplates = {
  proteins: [
    {
      name: 'Chicken Breast',
      protein: 31,
      carbs: 0,
      fat: 4,
      calories: 165,
      quantity: 150,
      unit: 'g',
    },
    { name: 'Eggs', protein: 12, carbs: 1, fat: 10, calories: 143, quantity: 2, unit: 'units' },
    {
      name: 'Greek Yogurt',
      protein: 17,
      carbs: 6,
      fat: 4,
      calories: 120,
      quantity: 170,
      unit: 'g',
    },
    { name: 'Lean Mince', protein: 26, carbs: 0, fat: 10, calories: 190, quantity: 140, unit: 'g' },
    { name: 'Tuna', protein: 24, carbs: 0, fat: 1, calories: 110, quantity: 120, unit: 'g' },
    {
      name: 'Whey Shake',
      protein: 25,
      carbs: 5,
      fat: 2,
      calories: 140,
      quantity: 1,
      unit: 'serving',
    },
  ],
  carbs: [
    { name: 'Rice', protein: 4, carbs: 45, fat: 1, calories: 210, quantity: 180, unit: 'g cooked' },
    { name: 'Oats', protein: 8, carbs: 42, fat: 5, calories: 255, quantity: 70, unit: 'g' },
    { name: 'Potato', protein: 4, carbs: 36, fat: 0, calories: 150, quantity: 220, unit: 'g' },
    { name: 'Banana', protein: 1, carbs: 27, fat: 0, calories: 105, quantity: 1, unit: 'unit' },
    { name: 'Granola', protein: 5, carbs: 28, fat: 7, calories: 190, quantity: 55, unit: 'g' },
  ],
  fats: [
    { name: 'Mixed Nuts', protein: 5, carbs: 6, fat: 16, calories: 180, quantity: 28, unit: 'g' },
    { name: 'Olive Oil', protein: 0, carbs: 0, fat: 14, calories: 126, quantity: 14, unit: 'g' },
    { name: 'Nut Butter', protein: 4, carbs: 4, fat: 8, calories: 95, quantity: 16, unit: 'g' },
  ],
};

export async function seedDemoHistoricalData(ctx: HistoricalSeedContext): Promise<void> {
  const days = ctx.days ?? DEMO_HISTORY_DAYS;
  const tuning = personaTuning[ctx.personaId];
  const historyStart = ctx.historyStartDate
    ? startOfDay(parseISO(ctx.historyStartDate))
    : addDays(startOfDay(new Date()), -days + 1);

  await deleteAllCheckIns(ctx.userId);

  const checkInDates: string[] = [];
  const totalWeeks = Math.max(1, Math.ceil(days / 7));
  const midDeloadWeek = Math.max(1, Math.floor(totalWeeks / 2) - 1);

  for (let i = 0; i < days; i++) {
    const dateObj = addDays(historyStart, i);
    const date = toDateOnly(dateObj);
    const cycleDay = (i % ctx.program.cycleLengthDays) + 1;
    const session = ctx.program.sessions.find((s) => s.dayNumber === cycleDay) ?? null;
    const isLift = session?.type === 'lift';
    const weekNum = Math.floor(i / 7);
    const isDeloadWeek = weekNum === midDeloadWeek;
    const isStressWeekSheri = ctx.personaId === 'sheri' && weekNum === 3;
    const isStressWeekMaria = ctx.personaId === 'maria' && weekNum === 5;

    let workoutP = tuning.workoutAdherence;
    if (isDeloadWeek)
      workoutP *=
        ctx.personaId === 'morton' || ctx.personaId === 'alex' || ctx.personaId === 'fez'
          ? 0.86
          : 0.78;
    if (isStressWeekSheri) workoutP *= 0.88;
    if (isStressWeekMaria) workoutP *= 0.85;

    let nutritionP = tuning.nutritionAdherence;
    if (isDeloadWeek) nutritionP *= 0.93;
    if (isStressWeekSheri) nutritionP *= 0.89;
    if (isStressWeekMaria) nutritionP *= 0.9;

    const didWorkout = Boolean(isLift && chance(workoutP, i, 11));
    const dayType = resolveDayType(session?.type, i);

    if (didWorkout && session?.exercises?.length) {
      const workout = buildWorkout({
        personaId: ctx.personaId,
        programId: ctx.programId,
        date,
        cycleDay,
        sessionName: session.name,
        sessionExercises: session.exercises,
        weekIndex: weekNum,
        isDeloadWeek,
      });
      await createWorkout(ctx.userId, workout);
    }

    const nutritionDay = buildNutritionDay({
      personaId: ctx.personaId,
      date,
      dayType,
      isLiftDay: Boolean(isLift),
      plan: ctx.nutritionPlan,
      adherence: nutritionP,
      portionMultiplier: tuning.mealPortionMultiplier,
      dayIndex: i,
    });
    await saveNutritionDay(ctx.userId, date, nutritionDay);

    const supplementLog = buildSupplementLog({
      date,
      protocol: ctx.supplementProtocol,
      adherence: tuning.supplementAdherence,
      dayIndex: i,
    });
    await saveSupplementLog(ctx.userId, date, supplementLog);

    const recovery = buildRecoveryEntry({
      date,
      isLiftDay: Boolean(isLift),
      tuning,
      dayIndex: i,
      personaId: ctx.personaId,
      stressBump: isStressWeekSheri ? 1.4 : isStressWeekMaria ? 1.1 : isDeloadWeek ? -0.35 : 0,
    });
    await saveRecoveryEntry(ctx.userId, date, recovery);

    if (i % 7 === 0) {
      checkInDates.push(date);
    }
  }

  const weeklySeries = DEMO_PHYSIQUE_WEEKLY_BY_PERSONA[ctx.personaId];
  for (let i = 0; i < checkInDates.length; i++) {
    const date = checkInDates[i];
    const rawRow = weeklySeries[Math.min(i, weeklySeries.length - 1)];
    const isAnchorWeek = i === checkInDates.length - 1;
    const row = isAnchorWeek
      ? rawRow
      : applyDemoPhysiquePresentationNoise(rawRow, ctx.personaId, i);
    const checkIn = buildStaticDemoCheckIn({
      personaId: ctx.personaId,
      date,
      weekIndex: i,
      row,
    });
    await saveCheckIn(ctx.userId, date, checkIn);
  }

  const notes = buildJournalNotes(ctx.personaId, historyStart, days);
  for (const note of notes) {
    await createJournalEntry(ctx.userId, note);
  }
}

function buildWorkout(args: {
  personaId: DemoPersonaId;
  programId: string;
  date: string;
  cycleDay: number;
  sessionName: string;
  sessionExercises: SessionExercise[];
  weekIndex: number;
  isDeloadWeek: boolean;
}): Omit<Workout, 'id'> {
  const exercises: WorkoutExercise[] = args.sessionExercises.map((exercise, exerciseIndex) => {
    const baseWeight = inferBaseWeight(args.personaId, exercise.name);
    const progressiveLoad = Math.max(
      0,
      args.weekIndex * progressionStep(args.personaId, exercise.name),
    );
    const setCompletionP = args.isDeloadWeek ? 0.88 : 0.94;
    const sets = Array.from({ length: exercise.sets }).map((_, setIdx) => {
      const reps = parseRepTarget(exercise.reps);
      const completed = chance(setCompletionP, setIdx + exerciseIndex, args.weekIndex + 5);
      const deloadScale = args.isDeloadWeek ? 0.92 : 1;
      const weight = Math.max(0, (baseWeight + progressiveLoad + setIdx * 0.5) * deloadScale);
      return {
        setNumber: setIdx + 1,
        type: 'working' as const,
        weight: round1(weight),
        reps: reps + jitter(setIdx + args.weekIndex, 0, 2),
        completed,
        rpe: completed ? clamp(7 + jitter(setIdx + exerciseIndex, 0, 2), 6, 10) : undefined,
      };
    });

    return {
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: inferMuscleGroup(exercise.name),
      sets,
      notes: exercise.notes,
    };
  });

  const completedSets = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0,
  );
  const durationMinutes = Math.max(35, Math.round(completedSets * (args.isDeloadWeek ? 2.8 : 3.2)));

  const notes = workoutSessionNotes(args.personaId, args.weekIndex, args.isDeloadWeek);

  return {
    programId: args.programId,
    cycleDayNumber: args.cycleDay,
    sessionName: args.sessionName,
    sessionType: 'lift',
    date: args.date,
    exercises,
    durationMinutes,
    notes,
    startedAt: `${args.date}T16:30:00.000Z`,
    completedAt: `${args.date}T17:45:00.000Z`,
  };
}

function buildNutritionDay(args: {
  personaId: DemoPersonaId;
  date: string;
  dayType: DayType;
  isLiftDay: boolean;
  plan: NutritionPlanSeed;
  adherence: number;
  portionMultiplier: number;
  dayIndex: number;
}): Partial<NutritionDay> {
  const target = args.plan.macroTargetsByDayType[args.dayType];
  const meals = buildMeals(
    args.plan,
    args.dayType,
    args.isLiftDay,
    args.portionMultiplier,
    args.dayIndex,
  );
  const totals = meals.reduce(
    (acc, meal) => {
      meal.foods.forEach((food) => {
        acc.protein += food.protein;
        acc.carbs += food.carbs;
        acc.fat += food.fat;
      });
      return acc;
    },
    { protein: 0, carbs: 0, fat: 0 },
  );
  totals.protein = Math.round(
    totals.protein * adherenceVariance(args.adherence, args.dayIndex + 3),
  );
  totals.carbs = Math.round(totals.carbs * adherenceVariance(args.adherence, args.dayIndex + 7));
  totals.fat = Math.round(totals.fat * adherenceVariance(args.adherence, args.dayIndex + 11));
  const calories = calculateCalories(totals.protein, totals.carbs, totals.fat);

  const proteinScore = calculateComplianceScore(
    Math.min(totals.protein, target.protein),
    target.protein,
  );
  const midpointCalories = Math.round((target.calories[0] + target.calories[1]) / 2);
  const calorieScore = calculateComplianceScore(
    Math.max(0, midpointCalories - Math.abs(midpointCalories - calories)),
    midpointCalories,
  );

  return {
    date: args.date,
    dayType: args.dayType,
    meals,
    macroTargets: target,
    macroActuals: {
      calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    },
    complianceScore: Math.round(proteinScore * 0.6 + calorieScore * 0.4),
  };
}

function buildSupplementLog(args: {
  date: string;
  protocol: SupplementProtocol;
  adherence: number;
  dayIndex: number;
}) {
  const windows: Record<string, Record<string, boolean>> = {};
  let total = 0;
  let taken = 0;

  for (const window of args.protocol.windows) {
    const windowRecord: Record<string, boolean> = {};
    for (let i = 0; i < window.supplements.length; i++) {
      total += 1;
      const didTake = chance(args.adherence, args.dayIndex + i, window.timing.length);
      if (didTake) taken += 1;
      windowRecord[window.supplements[i]] = didTake;
    }
    windows[window.timing] = windowRecord;
  }

  return {
    date: args.date,
    windows,
    compliancePercent: total === 0 ? 0 : Math.round((taken / total) * 100),
  };
}

function buildRecoveryEntry(args: {
  date: string;
  isLiftDay: boolean;
  tuning: PersonaTuning;
  dayIndex: number;
  personaId: DemoPersonaId;
  stressBump?: number;
}): Partial<RecoveryEntry> {
  const sleepHours = round1(args.tuning.avgSleepHours + wave(args.dayIndex, 0.45));
  const sleepQuality = clamp(
    Math.round(args.tuning.avgSleepQuality + wave(args.dayIndex + 2, 1.2)),
    4,
    9,
  );
  const hrv = clamp(Math.round(args.tuning.avgHrv + wave(args.dayIndex + 5, 8)), 45, 95);
  const stressBump = args.stressBump ?? 0;
  const stress = clamp(
    Math.round(args.tuning.avgStress + wave(args.dayIndex + 1, 2) + stressBump),
    2,
    9,
  );
  const energy = clamp(Math.round(args.tuning.avgEnergy + wave(args.dayIndex + 4, 2)), 3, 9);
  const mood = clamp(Math.round(args.tuning.avgMood + wave(args.dayIndex + 3, 2)), 3, 9);
  const domsBase = args.isLiftDay ? args.tuning.avgDomsOnLift : args.tuning.avgDomsOnLift - 2;
  const doms = clamp(Math.round(domsBase + wave(args.dayIndex, 1.6)), 1, 9);

  return {
    date: args.date,
    sleepHours,
    sleepQuality,
    hrv,
    mood,
    stress,
    energy,
    doms,
    pelvicComfort:
      args.personaId === 'morton' ? clamp(4 + jitter(args.dayIndex, -1, 1), 2, 5) : undefined,
  };
}

/** FNV-1a 32-bit → [0, 1) — deterministic micro-variation on demo check-ins (anchor week excluded). */
function demoSeededUnit(personaId: DemoPersonaId, weekIndex: number, field: string): number {
  let h = 2166136261;
  const s = `${personaId}\0${weekIndex}\0${field}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

function demoSeededSigned(
  personaId: DemoPersonaId,
  weekIndex: number,
  field: string,
  magnitude: number,
): number {
  const u = demoSeededUnit(personaId, weekIndex, field);
  return (u * 2 - 1) * magnitude;
}

function roundMeasurement(n: number): number {
  return Math.round(n * 10) / 10;
}

function applyDemoPhysiquePresentationNoise(
  row: DemoPhysiqueWeek,
  personaId: DemoPersonaId,
  weekIndex: number,
): DemoPhysiqueWeek {
  const m = row.measurements;
  const keys = [
    'waist',
    'chest',
    'hips',
    'leftArm',
    'rightArm',
    'leftThigh',
    'rightThigh',
    'shoulders',
  ] as const;
  const measurements = { ...m };
  for (const k of keys) {
    const v = m[k];
    if (typeof v === 'number') {
      const maxJ =
        k === 'waist' || k === 'hips' ? 0.28 : k === 'chest' || k === 'shoulders' ? 0.22 : 0.18;
      measurements[k] = roundMeasurement(v + demoSeededSigned(personaId, weekIndex, k, maxJ));
    }
  }
  return {
    bodyweight: roundMeasurement(
      row.bodyweight + demoSeededSigned(personaId, weekIndex, 'bodyweight', 0.14),
    ),
    measurements,
  };
}

function buildStaticDemoCheckIn(args: {
  personaId: DemoPersonaId;
  date: string;
  weekIndex: number;
  row: DemoPhysiqueWeek;
}): Partial<CheckIn> {
  const conditioningByPersona: Record<DemoPersonaId, number> = {
    morton: 7,
    alex: 7,
    sheri: 5,
    jordan: 6,
    fez: 8,
    maria: 5,
  };
  const conditioningScore = clamp(
    conditioningByPersona[args.personaId] + jitter(args.weekIndex, -1, 1),
    3,
    9,
  );

  return {
    date: args.date,
    bodyweight: args.row.bodyweight,
    measurements: args.row.measurements,
    photoUrls: [],
    conditioningScore,
    symmetryNotes: demoSymmetryNotesForWeek(args.personaId, args.weekIndex),
    coachNotes: checkInCoachNotes(args.personaId, args.weekIndex),
  };
}

function journalMilestoneDate(historyStart: Date, days: number, dayOffset: number): string {
  return toDateOnly(addDays(historyStart, Math.min(Math.max(0, dayOffset), days - 1)));
}

function buildJournalNotes(
  personaId: DemoPersonaId,
  historyStart: Date,
  days: number,
): Omit<JournalEntry, 'id'>[] {
  const d1 = journalMilestoneDate(historyStart, days, 0);
  const d2 = journalMilestoneDate(historyStart, days, Math.floor(days * 0.28));
  const d3 = journalMilestoneDate(historyStart, days, Math.floor(days * 0.58));
  const d4 = journalMilestoneDate(historyStart, days, Math.max(0, days - 4));

  const byPersona: Record<DemoPersonaId, Omit<JournalEntry, 'id'>[]> = {
    morton: [
      {
        date: d1,
        title: 'Block Start',
        content:
          'Energy high, execution sharp. Prioritising chest/back quality and recovery consistency.',
        tags: ['training', 'block-start'],
      },
      {
        date: d2,
        title: 'Mid-Block Adjustment',
        content:
          'Slight shoulder fatigue after push sessions. Reduced one accessory set; performance remains stable.',
        tags: ['fatigue', 'adjustments'],
      },
      {
        date: d3,
        title: 'Deload Week Intent',
        content:
          'Planned pull-back week: same patterns, slightly lower top sets. Pelvic comfort holding steady.',
        tags: ['deload', 'pelvic'],
      },
      {
        date: d4,
        title: 'Block Review',
        content:
          'Twelve-week arc: weight up modestly, strength retained, fatigue lower than mid-block spike. Ready to re-ramp.',
        tags: ['summary', 'progress'],
      },
    ],
    sheri: [
      {
        date: d1,
        title: 'Routine Kickoff',
        content:
          'Main objective is adherence: complete sessions, keep meals repeatable, and protect sleep windows.',
        tags: ['habit', 'consistency'],
      },
      {
        date: d2,
        title: 'Workday Strategy',
        content:
          'Prepared two lunch options and pre-packed snacks. Reduced decision fatigue significantly.',
        tags: ['nutrition', 'schedule'],
      },
      {
        date: d3,
        title: 'High-Stress Week',
        content:
          'Work volume spiked; sleep fragmented two nights. Kept protein high, shortened one session, no guilt spiral.',
        tags: ['stress', 'adherence'],
      },
      {
        date: d4,
        title: 'Phase Check-In',
        content:
          'Trend is down on scale with normal water noise. Confidence on lower-body patterns improved.',
        tags: ['summary', 'fat-loss'],
      },
    ],
    alex: [
      {
        date: d1,
        title: 'Hypertrophy Block Start',
        content:
          'Bench and pull-up KPIs established. Focus is controlled overload and quality execution.',
        tags: ['hypertrophy', 'kpi'],
      },
      {
        date: d2,
        title: 'Volume Check',
        content:
          'Upper-body volume is tolerable. Slight elbow stress managed with tempo and exercise order tweaks.',
        tags: ['volume', 'recovery'],
      },
      {
        date: d3,
        title: 'Intensification Gate',
        content:
          'Two lifts plateaued on paper but bar speed improved. Holding volume, nudging top-set quality.',
        tags: ['plateau', 'progress'],
      },
      {
        date: d4,
        title: 'Mesocycle Close',
        content:
          'Bodyweight and e1RM trends align. Next block can bias either strength expression or added volume.',
        tags: ['summary', 'strength'],
      },
    ],
    jordan: [
      {
        date: d1,
        title: 'Foundation Start',
        content:
          'Priority is consistency over intensity. Three quality sessions and simple meals each week.',
        tags: ['foundation', 'habits'],
      },
      {
        date: d2,
        title: 'Momentum Week',
        content:
          'Training confidence improved. Added short walks on non-lift days without extra fatigue.',
        tags: ['confidence', 'cardio'],
      },
      {
        date: d3,
        title: 'Schedule Friction',
        content:
          'School holiday week: two sessions shortened, one moved to early morning. Kept protein and steps on track.',
        tags: ['schedule', 'adherence'],
      },
      {
        date: d4,
        title: 'Habit Solidification',
        content:
          'Compliance back in range. Small wins on waist trend; focus stays on repeatable week template.',
        tags: ['summary', 'progress'],
      },
    ],
    fez: [
      {
        date: d1,
        title: 'Lean Bulk + Cardio Base',
        content:
          'Vegan fueling locked in; early AM sessions suit work. Shoulder hardware respected — neutral pressing only.',
        tags: ['vegan', 'shoulder'],
      },
      {
        date: d2,
        title: 'Load Audit',
        content:
          'Back and legs taking overload well; chest volume via machines and cables. Added one low-impact cardio finisher.',
        tags: ['volume', 'cardio'],
      },
      {
        date: d3,
        title: 'Deload + Surf Fitness',
        content:
          'Pull-back week on pressing; kept leg intensity moderate. Pool and board prep on weekends without junk volume.',
        tags: ['deload', 'sport'],
      },
      {
        date: d4,
        title: 'Quarter Check',
        content:
          'Weight creeping toward 80 kg goal — slow is correct for this metabolism. Strength logs show honest progression.',
        tags: ['summary', 'hypertrophy'],
      },
    ],
    maria: [
      {
        date: d1,
        title: 'Home + Pool Start',
        content:
          'Three quality windows per week when custody allows; stairs and pool for low-joint-impact cardio.',
        tags: ['home', 'habits'],
      },
      {
        date: d2,
        title: 'Kid-Friendly Week',
        content:
          'Shortened sessions with bodyweight circuits; hit step target on hill repeats twice. Nutrition stayed relaxed but protein first.',
        tags: ['schedule', 'family'],
      },
      {
        date: d3,
        title: 'Stress + Social',
        content:
          'More social drinking this week; sleep ok but HRV dipped. Kept training modest and added an extra pool recovery day.',
        tags: ['stress', 'recovery'],
      },
      {
        date: d4,
        title: 'Recomposition Note',
        content:
          'Scale barely moved but tape trending better — expected for a fast burner adding strength. Next block nudges stair density.',
        tags: ['summary', 'strength'],
      },
    ],
  };

  return byPersona[personaId];
}

function workoutSessionNotes(
  personaId: DemoPersonaId,
  weekIndex: number,
  isDeloadWeek: boolean,
): string | undefined {
  if (isDeloadWeek) {
    return 'Deload: trimmed top-end sets, kept technique work and pump work in range.';
  }
  if (personaId === 'morton' && weekIndex >= 9) {
    return 'Late block: effort high but controlled; monitoring shoulder and pelvic response.';
  }
  if (personaId === 'sheri' && weekIndex === 3) {
    return 'Stress week — reduced accessories, protected main lifts.';
  }
  if (personaId === 'alex' && weekIndex >= 8) {
    return 'Progressing where joint tolerance allows; left a rep in the tank on pressing.';
  }
  if (personaId === 'jordan' && weekIndex >= 7) {
    return 'Time-capped session; prioritized compounds and single top set per pattern.';
  }
  if (personaId === 'fez' && weekIndex >= 2) {
    return 'Pinned shoulder work: neutral grips, stop short of pain; log overhead tolerance.';
  }
  if (personaId === 'maria' && weekIndex === 5) {
    return 'Custody swap week — shorter sessions, kept pool laps and stairs easy.';
  }
  return undefined;
}

/** One coaching note per check-in week (oldest → newest). Avoids copy-paste “generic progress” copy. */
const DEMO_CHECK_IN_COACH_NOTES: Record<DemoPersonaId, readonly string[]> = {
  morton: [
    'Baseline tape + photos locked in; trust the trend line, not single-meal scale noise.',
    'Pelvic tolerance holding; kept hinge top sets conservative after a heavy pull day.',
    'Minor R–L difference after push day — no pain, log rear-delt balance for next block.',
    'Higher-sodium weekend; scale jumped while waist still cooperated — sanity check passed.',
    'Short sleep once; dropped one pump finish, kept KPI sets crisp and honest on RIR.',
    'Entering planned deload — reps in reserve, ego stays out of the working sets.',
    'Deload executed; shoulders feel less packed, bar speed on benchmarks already cleaner.',
    'Re-ramp week one: extra warm-up sets on bench until the groove feels automatic again.',
    'Upper-back tightness from volume — face pulls + thoracic work already helping.',
    'Leg-day appetite up; peri timing consistent, digestion cooperating on training days.',
    'Late-block tissue check: dull fatigue ok — flag anything sharp or nerve-like early.',
    'Twelve-week close: strength retained, waist tighter vs week 0 — easy week before next bias.',
  ],
  sheri: [
    'Foundation: repeatable week template beats one heroic week you cannot repeat.',
    'Steps creeping up; keep protein anchored on the busiest workdays first.',
    'Weekend structure is still the lever — pre-portion Sat/Sun when you can.',
    'Stress week: shortened accessories, protected your staple lifts — smart trade.',
    'Sleep fragmented; hydration steady — expect a noisy scale without changing the plan.',
    'Routine back; waist responding again after the dip — behaviours over panic cuts.',
    'Hunger spikes normal mid-run — volume foods added, not deprivation math.',
    'Energy returning; celebrate consistency, not chasing a new low every morning.',
    'Social calendar busy — pre-log drinks or shift meal timing, not both blind.',
    'Training confidence rebuilt; one push session felt strong without anxiety.',
    'Tape catching up to intention; next phase can tighten weekend guardrails.',
    'Close-out: trend and story match — maintainable habits over sprint perfection.',
  ],
  alex: [
    'KPIs set; execution quality is the product — not just load on the bar.',
    'Elbow tolerating tempo tweaks; extension work after pressing, not before.',
    'Upper volume tolerable — trap awareness, no sharp insertion symptoms.',
    'Plateau “on paper” but bar speed up — trust process metrics, not one bad day.',
    'One missed session; made it up without stacking two heavy lowers same week.',
    'Optional cardio day used as real Zone 2 — recovery markers bounced next morning.',
    'Intensification gate: hold volume, nudge top-set intent week to week.',
    'Weak-point slot worked without trashing joints — log RIR like a coach would.',
    'Digestion steady on surplus; fibre unchanged despite appetite swings.',
    'Pull width improving; lockout still the limiter on pressing — noted for bias.',
    'Pre-test week: fewer novel exercises; baseline KPI attempts when fresh.',
    'Mesocycle close: weight and e1RM direction align — pick strength vs volume next.',
  ],
  jordan: [
    'Three lifts + simple meals beats a complicated plan you cannot repeat weekly.',
    'Home setup dialed; warm-up now standard before goblet and hinge patterns.',
    'Time-capped day: compounds only — still a green week, not a failed one.',
    'Holiday friction: shorter sessions, protein still hit — huge adherence win.',
    'Steps back after a structured week — waist agrees before the scale does.',
    'Confidence up on patterns; tempted to add load — held the technique standard.',
    'School week chaos; one session moved to early AM, no all-or-nothing spiral.',
    'Beginner DOMS noise; sleep + meal timing fixed the “fried” feeling fast.',
    'Easy walks on off days without junk fatigue — habits stacking quietly.',
    'Second tape read same time of day — less fake “progress” from measurement noise.',
    'Small waist move finally visible; celebrate behaviours, not mirror days only.',
    'Habit block done; loads honest, not heroic — ready for the next repeatable template.',
  ],
  fez: [
    'Vegan fuel locked; AM sessions suit — log shoulder tolerance after every press variant.',
    'Neutral-grip bias week; stop short on overhead extension, no hero reps on pins.',
    'Legs taking overload; chest via machines/cables — beach muscle lives in safety.',
    'Pool finisher once; surf prep without junk volume through the shoulder.',
    'Higher-sodium day; scale bounced, tape on story — vegan mass is inherently noisy.',
    'Pull week on pressing volume; legs moderate, cardio kept easy on joints.',
    'Shoulder-friendly row angles trialled; pain diary shows improving overhead numbers.',
    'Travel week sleep dip; reduced accessory density, not main movement patterns.',
    'Back thickness improving; pressing cap still rule #0 on any joint complaint.',
    'Plant protein spread daytime — leucine anchors still hugging training windows.',
    'Slow gain correct for this metabolism; strength logs honest vs scale fairy tales.',
    'Quarter close: drift toward goal weight — protect hardware on the next ramp.',
  ],
  maria: [
    'Three windows when custody allows; stairs + pool for low-impact cardio base.',
    'Home circuit template repeated; kid interruptions logged, not hidden from the coach.',
    'Protein-first breakfast stuck on rush mornings — small but compounding win.',
    'Custody handoff week: shorter sessions, easy pool laps, no guilt spiral.',
    'Stress + social week; HRV dipped — modest training, extra easy pool recovery day.',
    '“Big kid week” once; knees tolerated stairs after a longer warm-up block.',
    'Scale flat expected; tape trending — fast-burner recomp story still intact.',
    'Sleep ok after a late social; rehydration day reduced puff without panic cuts.',
    'Hill repeats twice; step target hit without joint complaint — durable volume.',
    'Pool warm-ups carried better posture into DB work — less neck-dominant shrug.',
    'Stairs density nudge next block; this week stayed conservative post busy weekend.',
    'Close-out: strength markers up while scale behaved — smart stair repeats next.',
  ],
};

function demoSymmetryNotesForWeek(personaId: DemoPersonaId, weekIndex: number): string {
  if (personaId === 'fez') {
    const lines = [
      'Post-surgical shoulder: mild R–L pressing tolerance; legs and back tracking evenly.',
      'Overhead path still capped — rows and legs show clean bilateral progress.',
      'Neutral-grip week: watch old compensation patterns on fatigued pressing sets.',
    ];
    return lines[weekIndex % lines.length];
  }
  if (personaId === 'maria') {
    const lines = [
      'Home training bias; watch knee tracking on stairs volume — otherwise symmetrical.',
      'Pool warm-ups helping posture; less neck-dominant shrug on light pressing.',
      'Single-leg work: L leg slightly stronger on stairs — note for next block balance.',
    ];
    return lines[weekIndex % lines.length];
  }
  const lines = [
    'Stable symmetry. Minor right-left fatigue differences noted post-session.',
    'No acute asymmetry flags; trivial DOMS side-to-side differences only.',
    'Tape checkpoints: L–R limbs within normal measurement-variance window.',
    'Daily steps: no favouring one side during warm-up or casual walking.',
  ];
  return lines[weekIndex % lines.length];
}

function checkInCoachNotes(personaId: DemoPersonaId, weekIndex: number): string {
  const list = DEMO_CHECK_IN_COACH_NOTES[personaId];
  return list[Math.min(weekIndex, list.length - 1)] ?? list[0];
}

function buildMeals(
  plan: NutritionPlanSeed,
  dayType: DayType,
  isLiftDay: boolean,
  multiplier: number,
  dayIndex: number,
): Meal[] {
  const source = plan.mealSchedule.filter((slot) => !slot.liftDayOnly || isLiftDay);
  const meals: Meal[] = source.map((slot, idx) => {
    const protein = pick(foodTemplates.proteins, dayIndex + idx);
    const carb = pick(foodTemplates.carbs, dayIndex + idx + 2);
    const fat = pick(foodTemplates.fats, dayIndex + idx + 4);

    const foods: Food[] = [
      scaleFood(protein, multiplier),
      scaleFood(
        carb,
        multiplier * (dayType === 'highest' ? 1.2 : dayType === 'recovery' ? 0.85 : 1),
      ),
    ];
    if (idx % 2 === 0) {
      foods.push(scaleFood(fat, multiplier * 0.8));
    }

    return {
      slot: slot.slot,
      time: slot.time,
      foods,
      completed: true,
      planLine: slot.byDayType?.[dayType] ?? slot.default,
    };
  });
  return meals;
}

function scaleFood(input: Omit<Food, 'id'>, multiplier: number): Food {
  return {
    ...input,
    id: `${slug(input.name)}-${Math.round(multiplier * 100)}-${Math.random().toString(36).slice(2, 8)}`,
    protein: round1(input.protein * multiplier),
    carbs: round1(input.carbs * multiplier),
    fat: round1(input.fat * multiplier),
    calories: Math.round(input.calories * multiplier),
    quantity: round1(input.quantity * multiplier),
  };
}

function resolveDayType(
  sessionType: Program['sessions'][number]['type'] | undefined,
  dayIndex: number,
): DayType {
  if (sessionType === 'recovery') return 'recovery';
  if (sessionType === 'cardio') return 'moderate';
  if (sessionType === 'lift') return dayIndex % 5 === 0 ? 'highest' : 'high';
  return 'recovery';
}

function parseRepTarget(reps: number | string): number {
  if (typeof reps === 'number') return reps;
  const firstNumber = reps.match(/\d+/);
  return firstNumber ? Number(firstNumber[0]) : 10;
}

function inferBaseWeight(personaId: DemoPersonaId, exerciseName: string): number {
  const n = exerciseName.toLowerCase();
  const baseByPersona: Record<DemoPersonaId, number> = {
    morton: 30,
    sheri: 14,
    alex: 42,
    jordan: 16,
    fez: 38,
    maria: 8,
  };
  let adjustment = 0;
  if (n.includes('squat')) adjustment += 16;
  if (n.includes('deadlift')) adjustment += 28;
  if (n.includes('bench')) adjustment += 12;
  if (n.includes('row') || n.includes('pull')) adjustment += 10;
  if (n.includes('lateral') || n.includes('curl') || n.includes('extension')) adjustment -= 12;
  if (n.includes('plank') || n.includes('bird') || n.includes('dead bug')) adjustment = 0;
  return Math.max(0, baseByPersona[personaId] + adjustment);
}

function progressionStep(personaId: DemoPersonaId, exerciseName: string): number {
  const n = exerciseName.toLowerCase();
  const base = personaId === 'sheri' || personaId === 'jordan' || personaId === 'maria' ? 0.5 : 1;
  if (n.includes('deadlift') || n.includes('squat')) return base + 0.7;
  if (n.includes('bench') || n.includes('row') || n.includes('pull')) return base + 0.4;
  return base;
}

function inferMuscleGroup(exerciseName: string): string {
  const n = exerciseName.toLowerCase();
  if (/(bench|chest|fly|press)/.test(n)) return 'chest';
  if (/(row|pull|lat|chin|rear delt)/.test(n)) return 'back';
  if (/(squat|lunge|quad|leg press|split squat|leg ext)/.test(n)) return 'quads';
  if (/(rdl|hamstring|nordic|curl)/.test(n)) return 'hamstrings';
  if (/(ohp|delt|lateral|shoulder|shrug)/.test(n)) return 'delts';
  if (/bicep|curl/.test(n)) return 'biceps';
  if (/tricep|pushdown|extension|close grip/.test(n)) return 'triceps';
  if (/calf/.test(n)) return 'calves';
  return 'other';
}

function toDateOnly(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function chance(probability: number, a: number, b: number): boolean {
  const pseudo = Math.abs(Math.sin((a + 1) * 12.9898 + (b + 1) * 78.233)) % 1;
  return pseudo <= probability;
}

function wave(index: number, amplitude: number): number {
  return Math.sin(index * 0.85) * amplitude;
}

function jitter(seed: number, min: number, max: number): number {
  const pseudo = Math.abs(Math.sin((seed + 3) * 19.73)) % 1;
  return Math.round((min + pseudo * (max - min)) * 10) / 10;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function adherenceVariance(adherence: number, seed: number): number {
  const spread = (1 - adherence) * 0.8;
  const pseudo = Math.abs(Math.sin((seed + 5) * 0.77));
  return clamp(adherence + (pseudo - 0.5) * spread, 0.65, 1.08);
}
