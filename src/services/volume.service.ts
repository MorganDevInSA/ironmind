import type { VolumeLandmarks, WeeklyVolumeRollup, Workout } from '@/lib/types';
import { getDocument, setDocument, deleteDocument, createConverter } from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { getWorkouts } from './training.service';
import { withService } from '@/lib/errors';

const converter = createConverter<VolumeLandmarks>();
const rollupConverter = createConverter<WeeklyVolumeRollup>();

/** Monday `yyyy-MM-dd` for the calendar week containing `ref` (local). */
export function getCalendarWeekStartIso(ref: Date = new Date()): string {
  const d = new Date(ref);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

function aggregateMuscleSetsFromWorkouts(
  workouts: Workout[],
  from: string,
  to: string,
): Record<string, number> {
  const volumeByMuscle: Record<string, number> = {};
  for (const workout of workouts) {
    if (workout.date < from || workout.date > to) continue;
    for (const exercise of workout.exercises ?? []) {
      const completedSets = exercise.sets.filter((s) => s.completed).length;
      if (!volumeByMuscle[exercise.muscleGroup]) {
        volumeByMuscle[exercise.muscleGroup] = 0;
      }
      volumeByMuscle[exercise.muscleGroup] += completedSets;
    }
  }
  return volumeByMuscle;
}

async function upsertWeeklyVolumeRollupDoc(
  userId: string,
  weekStartIso: string,
  muscleSets: Record<string, number>,
): Promise<void> {
  const doc: WeeklyVolumeRollup = {
    id: weekStartIso,
    weekStart: weekStartIso,
    muscleSets,
    computedAt: new Date().toISOString(),
  };
  await setDocument<WeeklyVolumeRollup>(
    collections.weeklyVolumeRollups(userId),
    weekStartIso,
    doc,
    rollupConverter,
  );
}

/** Drop persisted rollup so the next read recomputes from workouts (call after workout mutations). */
export async function deleteWeeklyVolumeRollup(
  userId: string,
  weekStartIso: string,
): Promise<void> {
  return withService('volume', 'delete weekly rollup', () =>
    deleteDocument(collections.weeklyVolumeRollups(userId), weekStartIso),
  );
}

export async function deleteCurrentWeekVolumeRollup(userId: string): Promise<void> {
  const ws = getCalendarWeekStartIso();
  return deleteWeeklyVolumeRollup(userId, ws);
}

// Get volume landmarks
export async function getVolumeLandmarks(userId: string): Promise<VolumeLandmarks | null> {
  return withService('volume', 'read volume landmarks', () =>
    getDocument<VolumeLandmarks>(collections.volumeLandmarks(userId), 'data', converter),
  );
}

// Save/update volume landmarks
export async function updateVolumeLandmarks(
  userId: string,
  landmarks: Partial<VolumeLandmarks>,
): Promise<void> {
  return withService('volume', 'update volume landmarks', () =>
    setDocument<VolumeLandmarks>(
      collections.volumeLandmarks(userId),
      'data',
      landmarks as VolumeLandmarks,
      converter,
    ),
  );
}

// Calculate weekly volume per muscle group
export async function getWeeklyVolumeSummary(
  userId: string,
  weekStart?: string,
): Promise<
  {
    muscleGroup: string;
    currentSets: number;
    targetSets: number;
    mv: number;
    mev: number;
    mav: number;
    mrv: number;
    status: 'below-mev' | 'mev-mav' | 'mav-mrv' | 'above-mrv';
  }[]
> {
  return withService('volume', 'calculate weekly volume', async () => {
    const landmarks = await getVolumeLandmarks(userId);
    if (!landmarks) return [];

    const weekStartIso = weekStart
      ? getCalendarWeekStartIso(new Date(weekStart))
      : getCalendarWeekStartIso();
    const start = new Date(weekStartIso + 'T12:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const from = weekStartIso;
    const to = end.toISOString().split('T')[0];

    const rollup = await getDocument<WeeklyVolumeRollup>(
      collections.weeklyVolumeRollups(userId),
      weekStartIso,
      rollupConverter,
    );

    let volumeByMuscle: Record<string, number>;

    if (rollup && rollup.weekStart === weekStartIso) {
      volumeByMuscle = { ...rollup.muscleSets };
    } else {
      const workouts = await getWorkouts(userId, { from, to });
      volumeByMuscle = aggregateMuscleSetsFromWorkouts(workouts, from, to);
      await upsertWeeklyVolumeRollupDoc(userId, weekStartIso, volumeByMuscle);
    }

    const { getVolumeStatus } = await import('@/lib/utils/calculations');

    return Object.entries(landmarks).map(([muscleGroup, data]) => {
      const currentSets = volumeByMuscle[muscleGroup] || 0;
      const status = getVolumeStatus(currentSets, data);

      return {
        muscleGroup,
        currentSets,
        targetSets: data.currentTarget,
        mv: data.mv,
        mev: data.mev,
        mav: data.mav,
        mrv: data.mrv,
        status: status.status,
      };
    });
  });
}

// Get volume trend over time
export async function getVolumeTrend(
  userId: string,
  muscleGroup: string,
  weeks: number = 4,
): Promise<{ week: string; sets: number }[]> {
  return withService('volume', 'read volume trend', async () => {
    const today = new Date();
    const oldestWeekStart = new Date(today);
    oldestWeekStart.setDate(oldestWeekStart.getDate() - (weeks - 1) * 7);
    const minFrom = oldestWeekStart.toISOString().split('T')[0];

    const newestWeekEnd = new Date(today);
    newestWeekEnd.setDate(newestWeekEnd.getDate() + 6);
    const maxTo = newestWeekEnd.toISOString().split('T')[0];

    const workouts = await getWorkouts(userId, { from: minFrom, to: maxTo });

    const trend: { week: string; sets: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - i * 7);

      const from = weekStart.toISOString().split('T')[0];
      const toDate = new Date(weekStart);
      toDate.setDate(toDate.getDate() + 6);
      const to = toDate.toISOString().split('T')[0];

      let sets = 0;
      for (const workout of workouts) {
        if (workout.date < from || workout.date > to) continue;
        for (const exercise of workout.exercises ?? []) {
          if (exercise.muscleGroup === muscleGroup) {
            sets += exercise.sets.filter((s) => s.completed).length;
          }
        }
      }

      trend.push({
        week: `Week ${weeks - i}`,
        sets,
      });
    }

    return trend;
  });
}

// Check if volume is within optimal range (MAV)
export async function isVolumeOptimal(userId: string, muscleGroup: string): Promise<boolean> {
  return withService('volume', 'check volume optimal', async () => {
    const summary = await getWeeklyVolumeSummary(userId);
    const muscle = summary.find((m) => m.muscleGroup === muscleGroup);

    if (!muscle) return false;

    return (
      muscle.status === 'mav-mrv' ||
      (muscle.currentSets >= muscle.mev && muscle.currentSets <= muscle.mav)
    );
  });
}

// Get volume recommendations
export async function getVolumeRecommendations(userId: string): Promise<
  {
    muscleGroup: string;
    recommendation: 'increase' | 'decrease' | 'maintain';
    reason: string;
  }[]
> {
  return withService('volume', 'calculate recommendations', async () => {
    const summary = await getWeeklyVolumeSummary(userId);

    return summary.map((muscle) => {
      let recommendation: 'increase' | 'decrease' | 'maintain';
      let reason: string;

      if (muscle.currentSets < muscle.mev) {
        recommendation = 'increase';
        reason = `Below minimum effective volume (${muscle.currentSets}/${muscle.mev} sets)`;
      } else if (muscle.currentSets > muscle.mrv) {
        recommendation = 'decrease';
        reason = `Above maximum recoverable volume (${muscle.currentSets}/${muscle.mrv} sets)`;
      } else if (muscle.currentSets < muscle.mav * 0.8) {
        recommendation = 'increase';
        reason = `Below optimal range (MAV: ${muscle.mav})`;
      } else if (muscle.currentSets > muscle.mav * 1.2) {
        recommendation = 'decrease';
        reason = `Above optimal range (MAV: ${muscle.mav})`;
      } else {
        recommendation = 'maintain';
        reason = `Within optimal range (${muscle.mev}-${muscle.mav} sets)`;
      }

      return {
        muscleGroup: muscle.muscleGroup,
        recommendation,
        reason,
      };
    });
  });
}

// Initialize volume landmarks with defaults
export async function initializeVolumeLandmarks(
  userId: string,
  defaults: VolumeLandmarks,
): Promise<void> {
  return withService('volume', 'initialize volume landmarks', async () => {
    const existing = await getVolumeLandmarks(userId);
    if (existing) return;

    await updateVolumeLandmarks(userId, defaults as unknown as VolumeLandmarks);
  });
}
