import type { VolumeLandmarks, Workout } from '@/lib/types';
import {
  getDocument,
  setDocument,
  queryDocuments,
  orderBy,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { getWorkouts } from './training.service';
import { withService } from '@/lib/errors';

const converter = createConverter<VolumeLandmarks>();

// Get volume landmarks
export async function getVolumeLandmarks(
  userId: string
): Promise<VolumeLandmarks | null> {
  return withService('volume', 'read volume landmarks', () =>
    getDocument<VolumeLandmarks>(
      collections.volumeLandmarks(userId),
      'data',
      converter
    )
  );
}

// Save/update volume landmarks
export async function updateVolumeLandmarks(
  userId: string,
  landmarks: Partial<VolumeLandmarks>
): Promise<void> {
  return withService('volume', 'update volume landmarks', () =>
    setDocument<VolumeLandmarks>(
      collections.volumeLandmarks(userId),
      'data',
      landmarks as VolumeLandmarks,
      converter
    )
  );
}

// Calculate weekly volume per muscle group
export async function getWeeklyVolumeSummary(
  userId: string,
  weekStart?: string
): Promise<{
  muscleGroup: string;
  currentSets: number;
  targetSets: number;
  mv: number;
  mev: number;
  mav: number;
  mrv: number;
  status: 'below-mev' | 'mev-mav' | 'mav-mrv' | 'above-mrv';
}[]> {
  return withService('volume', 'calculate weekly volume', async () => {
    const landmarks = await getVolumeLandmarks(userId);
    if (!landmarks) return [];

    const start = weekStart ? new Date(weekStart) : getWeekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);

    const from = start.toISOString().split('T')[0];
    const to = end.toISOString().split('T')[0];

    const workouts = await getWorkouts(userId, { from, to });

    const volumeByMuscle: Record<string, number> = {};

    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const completedSets = exercise.sets.filter(s => s.completed).length;

        if (!volumeByMuscle[exercise.muscleGroup]) {
          volumeByMuscle[exercise.muscleGroup] = 0;
        }
        volumeByMuscle[exercise.muscleGroup] += completedSets;
      }
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
  weeks: number = 4
): Promise<{ week: string; sets: number }[]> {
  return withService('volume', 'read volume trend', async () => {
    const trend: { week: string; sets: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - i * 7);

      const from = weekStart.toISOString().split('T')[0];
      const toDate = new Date(weekStart);
      toDate.setDate(toDate.getDate() + 6);
      const to = toDate.toISOString().split('T')[0];

      const workouts = await getWorkouts(userId, { from, to });

      let sets = 0;
      for (const workout of workouts) {
        for (const exercise of workout.exercises) {
          if (exercise.muscleGroup === muscleGroup) {
            sets += exercise.sets.filter(s => s.completed).length;
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
export async function isVolumeOptimal(
  userId: string,
  muscleGroup: string
): Promise<boolean> {
  return withService('volume', 'check volume optimal', async () => {
    const summary = await getWeeklyVolumeSummary(userId);
    const muscle = summary.find(m => m.muscleGroup === muscleGroup);

    if (!muscle) return false;

    return muscle.status === 'mav-mrv' ||
      (muscle.currentSets >= muscle.mev && muscle.currentSets <= muscle.mav);
  });
}

// Get volume recommendations
export async function getVolumeRecommendations(
  userId: string
): Promise<{
  muscleGroup: string;
  recommendation: 'increase' | 'decrease' | 'maintain';
  reason: string;
}[]> {
  return withService('volume', 'calculate recommendations', async () => {
    const summary = await getWeeklyVolumeSummary(userId);

    return summary.map(muscle => {
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
  defaults: VolumeLandmarks
): Promise<void> {
  return withService('volume', 'initialize volume landmarks', async () => {
    const existing = await getVolumeLandmarks(userId);
    if (existing) return;

    await updateVolumeLandmarks(userId, defaults as unknown as VolumeLandmarks);
  });
}

// Helper to get week start (Monday)
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const weekStart = new Date(now.setDate(diff));
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}
