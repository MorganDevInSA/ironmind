import type { ExerciseSet, Workout, RecoveryEntry, LandmarkRange } from '@/lib/types';

// 1RM Estimation using Epley formula
export function estimate1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

// Volume calculations
export function calculateWorkoutVolume(workout: Workout): number {
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter((s) => s.completed).length;
  }, 0);
}

export function calculateExerciseVolume(sets: ExerciseSet[]): number {
  return sets.filter((s) => s.completed).length;
}

// Progressive overload check
export function isProgressiveOverload(
  current: { weight: number; reps: number },
  previous: { weight: number; reps: number },
  threshold = 0,
): boolean {
  const currentVolume = current.weight * current.reps;
  const previousVolume = previous.weight * previous.reps;
  return currentVolume > previousVolume + threshold;
}

// Readiness score calculation
export function calculateReadinessScore(entry: RecoveryEntry): number {
  // Base calculation from plan
  const baseScore =
    (entry.sleepQuality * 0.25 +
      normalizeSleepHours(entry.sleepHours) * 0.2 +
      normalizeHRV(entry.hrv) * 0.15 +
      entry.mood * 0.1 +
      (10 - entry.stress) * 0.1 +
      entry.energy * 0.1 +
      (10 - entry.doms) * 0.1) *
    10;

  // Legacy pelvic comfort penalty — only applied for historical entries that have it
  if (entry.pelvicComfort != null) {
    if (entry.pelvicComfort <= 2) return baseScore * 0.7;
    if (entry.pelvicComfort === 3) return baseScore * 0.85;
  }
  return baseScore;
}

function normalizeSleepHours(hours: number): number {
  // 7-9 hours is optimal (score 10), less or more decreases
  if (hours >= 7 && hours <= 9) return 10;
  if (hours < 7) return Math.max(0, hours * 1.43); // Scale 0-7 to 0-10
  return Math.max(0, 10 - (hours - 9) * 2); // Penalty for >9 hours
}

function normalizeHRV(hrv: number): number {
  // Normalize HRV to 0-10 scale
  // Assuming 60-100 is a good range for Morton's age
  if (hrv >= 60 && hrv <= 100) return 10;
  if (hrv < 60) return Math.max(0, hrv / 6);
  return Math.max(0, 10 - (hrv - 100) / 10);
}

// Nutrition calculations
export function calculateCalories(protein: number, carbs: number, fat: number): number {
  return protein * 4 + carbs * 4 + fat * 9;
}

export function calculateMacroCompliance(actual: number, target: number): number {
  if (target === 0) return 100;
  return Math.min(100, (actual / target) * 100);
}

// Volume landmark analysis
export function getVolumeStatus(
  current: number,
  landmarks: LandmarkRange,
): {
  status: 'below-mev' | 'mev-mav' | 'mav-mrv' | 'above-mrv';
  progress: number;
} {
  if (current < landmarks.mev) {
    return { status: 'below-mev', progress: (current / landmarks.mev) * 100 };
  } else if (current < landmarks.mav) {
    return {
      status: 'mev-mav',
      progress: ((current - landmarks.mev) / (landmarks.mav - landmarks.mev)) * 100,
    };
  } else if (current < landmarks.mrv) {
    return {
      status: 'mav-mrv',
      progress: ((current - landmarks.mav) / (landmarks.mrv - landmarks.mav)) * 100,
    };
  } else {
    return { status: 'above-mrv', progress: 100 };
  }
}

// Compliance scoring
export function calculateComplianceScore(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

// TDEE estimation (simplified)
export function estimateTDEE(
  weight: number, // kg
  height: number, // cm
  age: number,
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active',
): number {
  // Mifflin-St Jeor Equation
  const bmr = 10 * weight + 6.25 * height - 5 * age + 5; // Male

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    'very-active': 1.9,
  };

  return Math.round(bmr * activityMultipliers[activityLevel]);
}

// Weight trend calculation (7-day average)
export function calculateWeightTrend(weights: { date: string; weight: number }[]): {
  trend: number;
  change: number;
} {
  if (weights.length < 7) {
    return { trend: weights[weights.length - 1]?.weight || 0, change: 0 };
  }

  const last7 = weights.slice(-7);
  const avg = last7.reduce((sum, w) => sum + w.weight, 0) / 7;

  const previous7 = weights.slice(-14, -7);
  const prevAvg =
    previous7.length === 7 ? previous7.reduce((sum, w) => sum + w.weight, 0) / 7 : avg;

  return {
    trend: avg,
    change: avg - prevAvg,
  };
}

// PR detection
export function detectPersonalRecord(
  exerciseId: string,
  currentSet: ExerciseSet,
  history: ExerciseSet[],
): boolean {
  const previousBest = history
    .filter((s) => s.completed && s.type === 'working')
    .reduce((best, set) => {
      const setVolume = set.weight * set.reps;
      return setVolume > best ? setVolume : best;
    }, 0);

  const currentVolume = currentSet.weight * currentSet.reps;
  return currentVolume > previousBest;
}

// Calculate trend from array of numbers
export function calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
  if (values.length < 3) return 'stable';

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const threshold = 0.05; // 5% change threshold
  const change = (secondAvg - firstAvg) / firstAvg;

  if (change > threshold) return 'improving';
  if (change < -threshold) return 'declining';
  return 'stable';
}

// Set performance rating
export function rateSetPerformance(
  weight: number,
  reps: number,
  rpe: number,
): 'excellent' | 'good' | 'acceptable' | 'poor' {
  // Based on RPE - lower is better (more reps in reserve)
  if (rpe <= 7) return 'excellent';
  if (rpe <= 8) return 'good';
  if (rpe <= 9) return 'acceptable';
  return 'poor';
}
