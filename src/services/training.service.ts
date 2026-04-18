import type { Program, Workout } from '@/lib/types';
import {
  getDocument,
  setDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  where,
  orderBy,
  limit,
  createConverter,
} from '@/lib/firebase';
import type { QueryConstraint } from 'firebase/firestore';
import { collections } from '@/lib/firebase/config';

const programConverter = createConverter<Program>();
const workoutConverter = createConverter<Workout>();

// Programs

export async function getPrograms(userId: string): Promise<Program[]> {
  return queryDocuments<Program>(
    collections.programs(userId),
    [orderBy('name', 'asc')],
    programConverter
  );
}

export async function getProgram(userId: string, programId: string): Promise<Program | null> {
  return getDocument<Program>(
    collections.programs(userId),
    programId,
    programConverter
  );
}

export async function getActiveProgram(userId: string): Promise<Program | null> {
  const programs = await queryDocuments<Program>(
    collections.programs(userId),
    [where('isActive', '==', true)],
    programConverter
  );
  return programs[0] || null;
}

export async function createProgram(
  userId: string,
  program: Omit<Program, 'id'>
): Promise<string> {
  return addDocument<Program>(
    collections.programs(userId),
    program as Program,
    programConverter
  );
}

export async function updateProgram(
  userId: string,
  programId: string,
  updates: Partial<Program>
): Promise<void> {
  await updateDocument<Program>(
    collections.programs(userId),
    programId,
    updates
  );
}

export async function setActiveProgram(
  userId: string,
  programId: string
): Promise<void> {
  // First, deactivate all programs
  const programs = await getPrograms(userId);
  for (const program of programs) {
    if (program.id !== programId && program.isActive) {
      await updateProgram(userId, program.id, { isActive: false });
    }
  }
  // Then activate the selected one
  await updateProgram(userId, programId, { isActive: true });
}

export async function deleteProgram(userId: string, programId: string): Promise<void> {
  await deleteDocument(collections.programs(userId), programId);
}

// Workouts

export async function getWorkouts(
  userId: string,
  dateRange?: { from: string; to: string }
): Promise<Workout[]> {
  let constraints: QueryConstraint[] = [orderBy('date', 'desc')];

  if (dateRange) {
    constraints = [
      where('date', '>=', dateRange.from),
      where('date', '<=', dateRange.to),
      orderBy('date', 'desc'),
    ];
  }

  return queryDocuments<Workout>(
    collections.workouts(userId),
    constraints,
    workoutConverter
  );
}

export async function getWorkout(
  userId: string,
  workoutId: string
): Promise<Workout | null> {
  return getDocument<Workout>(
    collections.workouts(userId),
    workoutId,
    workoutConverter
  );
}

export async function getWorkoutByDate(
  userId: string,
  date: string
): Promise<Workout | null> {
  const workouts = await queryDocuments<Workout>(
    collections.workouts(userId),
    [where('date', '==', date)],
    workoutConverter
  );
  return workouts[0] || null;
}

export async function createWorkout(
  userId: string,
  workout: Omit<Workout, 'id'>
): Promise<string> {
  return addDocument<Workout>(
    collections.workouts(userId),
    workout as Workout,
    workoutConverter
  );
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  updates: Partial<Workout>
): Promise<void> {
  await updateDocument<Workout>(
    collections.workouts(userId),
    workoutId,
    updates
  );
}

export async function saveWorkout(
  userId: string,
  workout: Workout
): Promise<void> {
  if (workout.id) {
    await setDocument<Workout>(
      collections.workouts(userId),
      workout.id,
      workout,
      workoutConverter
    );
  } else {
    await createWorkout(userId, workout);
  }
}

export async function deleteWorkout(userId: string, workoutId: string): Promise<void> {
  await deleteDocument(collections.workouts(userId), workoutId);
}

// Get recent workouts (default 14 days for one full cycle)
export async function getRecentWorkouts(
  userId: string,
  days: number = 14
): Promise<Workout[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  return queryDocuments<Workout>(
    collections.workouts(userId),
    [
      where('date', '>=', fromDate.toISOString().split('T')[0]),
      orderBy('date', 'desc'),
    ],
    workoutConverter
  );
}

