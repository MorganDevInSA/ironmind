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
import { saveCheckIn } from '@/services/physique.service';
import { createJournalEntry } from '@/services/coaching.service';
import { calculateCalories, calculateComplianceScore } from '@/lib/utils/calculations';

type DemoPersonaId = 'morton' | 'sheri' | 'alex' | 'jordan';

/**
 * Demo overwrite seeds (`seedMortonData`, etc.) align program `startDate` and
 * `seedDemoHistoricalData` to this window. Keep bounded (writes scale linearly).
 */
export const DEMO_HISTORY_DAYS = 84;

interface HistoricalSeedContext {
  personaId: DemoPersonaId;
  userId: string;
  profile: AthleteProfile;
  programId: string;
  program: Omit<Program, 'id'>;
  nutritionPlan: NutritionPlanSeed;
  supplementProtocol: SupplementProtocol;
  days?: number;
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
  weeklyWeightDelta: number;
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
    weeklyWeightDelta: 0.14,
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
    weeklyWeightDelta: -0.28,
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
    weeklyWeightDelta: 0.2,
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
    weeklyWeightDelta: -0.16,
    mealPortionMultiplier: 0.94,
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const historyStart = addDays(today, -days + 1);
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

    let workoutP = tuning.workoutAdherence;
    if (isDeloadWeek)
      workoutP *= ctx.personaId === 'morton' || ctx.personaId === 'alex' ? 0.86 : 0.78;
    if (isStressWeekSheri) workoutP *= 0.88;

    let nutritionP = tuning.nutritionAdherence;
    if (isDeloadWeek) nutritionP *= 0.93;
    if (isStressWeekSheri) nutritionP *= 0.89;

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
      stressBump: isStressWeekSheri ? 1.4 : isDeloadWeek ? -0.35 : 0,
    });
    await saveRecoveryEntry(ctx.userId, date, recovery);

    if (i % 7 === 0) {
      checkInDates.push(date);
    }
  }

  for (let i = 0; i < checkInDates.length; i++) {
    const date = checkInDates[i];
    const checkIn = buildCheckIn({
      profile: ctx.profile,
      date,
      weekIndex: i,
      weeklyWeightDelta: tuning.weeklyWeightDelta,
      personaId: ctx.personaId,
      totalCheckInWeeks: checkInDates.length,
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

function buildCheckIn(args: {
  profile: AthleteProfile;
  date: string;
  weekIndex: number;
  weeklyWeightDelta: number;
  personaId: DemoPersonaId;
  totalCheckInWeeks: number;
}): Partial<CheckIn> {
  const base = args.profile.currentWeight;
  const mid = Math.max(1, Math.floor(args.totalCheckInWeeks / 2));
  const drift = args.weeklyWeightDelta * (args.weekIndex - mid);
  const waveNoise = wave(args.weekIndex * 2, 0.35);
  const bodyweight = round1(base + drift + waveNoise);

  const conditioningByPersona: Record<DemoPersonaId, number> = {
    morton: 7,
    alex: 7,
    sheri: 5,
    jordan: 6,
  };
  const conditioningScore = clamp(
    conditioningByPersona[args.personaId] + jitter(args.weekIndex, -1, 1),
    3,
    9,
  );

  return {
    date: args.date,
    bodyweight,
    measurements: {
      waist: round1(82 + drift * -1.1 + wave(args.weekIndex + 2, 0.9)),
      chest: round1(103 + drift * 0.6 + wave(args.weekIndex + 1, 0.8)),
      shoulders: round1(118 + drift * 0.4 + wave(args.weekIndex + 3, 0.7)),
    },
    photoUrls: [],
    conditioningScore,
    symmetryNotes: 'Stable symmetry. Minor right-left fatigue differences noted post-session.',
    coachNotes: checkInCoachNotes(args.personaId, args.weekIndex, args.totalCheckInWeeks),
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
  return undefined;
}

function checkInCoachNotes(
  personaId: DemoPersonaId,
  weekIndex: number,
  totalWeeks: number,
): string {
  const late = weekIndex >= totalWeeks - 2;
  if (personaId === 'sheri') {
    return late
      ? 'Scale trend and tape measures align; next focus is tightening weekend structure.'
      : 'Technique and routine are trending in the right direction.';
  }
  if (personaId === 'jordan') {
    return late
      ? 'Momentum returned after the compressed week; keep loads honest, not heroic.'
      : 'Technique and routine are trending in the right direction.';
  }
  return late
    ? 'Final weeks show better consistency and improved fatigue management.'
    : 'Technique and routine are trending in the right direction.';
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
  const base = personaId === 'sheri' || personaId === 'jordan' ? 0.5 : 1;
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
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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
