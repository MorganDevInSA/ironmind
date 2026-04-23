import type { Program, Workout } from '@/lib/types';
import {
  getDocument,
  setDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  getDocumentRef,
  runFirestoreTransaction,
  stripUndefinedDeep,
  where,
  orderBy,
  limit,
  createConverter,
} from '@/lib/firebase';
import type { QueryConstraint } from 'firebase/firestore';
import { collections } from '@/lib/firebase/config';
import { ServiceError, withService } from '@/lib/errors';

const programConverter = createConverter<Program>();
const workoutConverter = createConverter<Workout>();

// Programs

export async function getPrograms(userId: string): Promise<Program[]> {
  return withService('training', 'read programs', () =>
    queryDocuments<Program>(
      collections.programs(userId),
      [orderBy('name', 'asc')],
      programConverter,
    ),
  );
}

export async function getProgram(userId: string, programId: string): Promise<Program | null> {
  return withService('training', 'read program', () =>
    getDocument<Program>(collections.programs(userId), programId, programConverter),
  );
}

export async function getActiveProgram(userId: string): Promise<Program | null> {
  return withService('training', 'read active program', async () => {
    const programs = await queryDocuments<Program>(
      collections.programs(userId),
      [where('isActive', '==', true), limit(1)],
      programConverter,
    );
    return programs[0] || null;
  });
}

export async function createProgram(userId: string, program: Omit<Program, 'id'>): Promise<string> {
  return withService('training', 'create program', () =>
    addDocument<Program>(collections.programs(userId), program as Program, programConverter),
  );
}

export async function updateProgram(
  userId: string,
  programId: string,
  updates: Partial<Program>,
): Promise<void> {
  return withService('training', 'update program', () =>
    updateDocument<Program>(collections.programs(userId), programId, updates),
  );
}

export async function setActiveProgram(userId: string, programId: string): Promise<void> {
  return withService('training', 'set active program', async () => {
    const programs = await getPrograms(userId);
    if (!programs.some((p) => p.id === programId)) {
      throw new ServiceError('That training program was not found.', 'NOT_FOUND', 'training');
    }

    const path = collections.programs(userId);
    await runFirestoreTransaction(async (transaction) => {
      const refs = programs.map((p) => getDocumentRef<Program>(path, p.id, programConverter));
      const snaps = await Promise.all(refs.map((r) => transaction.get(r)));
      for (let i = 0; i < snaps.length; i++) {
        if (!snaps[i].exists()) {
          throw new ServiceError(
            `Training program ${programs[i].id} is missing in the database.`,
            'NOT_FOUND',
            'training',
          );
        }
      }

      for (const program of programs) {
        const ref = getDocumentRef<Program>(path, program.id, programConverter);
        const shouldBeActive = program.id === programId;
        if (program.isActive !== shouldBeActive) {
          const patch = stripUndefinedDeep({ isActive: shouldBeActive });
          transaction.update(ref, patch as Partial<Program>);
        }
      }
    });
  });
}

/**
 * Idempotent repair when legacy or interrupted writes left **multiple** `isActive: true` programs.
 * Picks one winner (newest `updatedAt`, then `startDate`, then stable `id`) and delegates to
 * **`setActiveProgram`** so all flags are corrected in one transaction. No-op if ≤1 active.
 * Not called automatically — use from support tooling or a future Settings “repair data” action.
 */
export async function repairMultipleActivePrograms(userId: string): Promise<void> {
  return withService('training', 'repair multiple active programs', async () => {
    const programs = await getPrograms(userId);
    const active = programs.filter((p) => p.isActive);
    if (active.length <= 1) return;

    type Row = Program & { updatedAt?: string };
    const winner = [...(active as Row[])].sort((a, b) => {
      const ua = a.updatedAt ?? '';
      const ub = b.updatedAt ?? '';
      if (ua !== ub) return ub.localeCompare(ua);
      const sa = a.startDate ?? '';
      const sb = b.startDate ?? '';
      if (sa !== sb) return sb.localeCompare(sa);
      return a.id.localeCompare(b.id);
    })[0];

    await setActiveProgram(userId, winner.id);
  });
}

export async function deleteProgram(userId: string, programId: string): Promise<void> {
  return withService('training', 'delete program', () =>
    deleteDocument(collections.programs(userId), programId),
  );
}

// Workouts

export async function getWorkouts(
  userId: string,
  dateRange?: { from: string; to: string },
): Promise<Workout[]> {
  return withService('training', 'read workouts', () => {
    let constraints: QueryConstraint[] = [orderBy('date', 'desc')];

    if (dateRange) {
      constraints = [
        where('date', '>=', dateRange.from),
        where('date', '<=', dateRange.to),
        orderBy('date', 'desc'),
      ];
    }

    return queryDocuments<Workout>(collections.workouts(userId), constraints, workoutConverter);
  });
}

export async function getWorkout(userId: string, workoutId: string): Promise<Workout | null> {
  return withService('training', 'read workout', () =>
    getDocument<Workout>(collections.workouts(userId), workoutId, workoutConverter),
  );
}

/**
 * Patch one set inside a workout using a Firestore transaction.
 * When `baseUpdatedAt` matches the server `updatedAt`, prevents lost updates if another tab wrote first (retries until consistent).
 */
export async function applyWorkoutSetChange(
  userId: string,
  workoutId: string,
  args: {
    exerciseIndex: number;
    setIndex: number;
    set: Workout['exercises'][0]['sets'][0];
    baseUpdatedAt?: string | null;
  },
): Promise<Workout> {
  const { exerciseIndex, setIndex, set, baseUpdatedAt } = args;
  return withService('training', 'apply workout set', async () => {
    const path = collections.workouts(userId);
    const ref = getDocumentRef<Workout>(path, workoutId, workoutConverter);

    return runFirestoreTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) {
        throw new ServiceError('Workout not found.', 'NOT_FOUND', 'training');
      }

      const workout = snap.data() as Workout;
      if (
        baseUpdatedAt != null &&
        baseUpdatedAt !== '' &&
        workout.updatedAt != null &&
        workout.updatedAt !== baseUpdatedAt
      ) {
        throw new ServiceError(
          'This workout changed elsewhere. Try the set again after the latest data loads.',
          'CONFLICT',
          'training',
        );
      }

      if (exerciseIndex < 0 || exerciseIndex >= workout.exercises.length) {
        throw new ServiceError('Invalid exercise index.', 'VALIDATION', 'training');
      }

      const exercises = workout.exercises.map((ex) => ({
        ...ex,
        sets: [...ex.sets],
      }));

      const ex = exercises[exerciseIndex];
      if (setIndex < 0 || setIndex >= ex.sets.length) {
        throw new ServiceError('Invalid set index.', 'VALIDATION', 'training');
      }
      ex.sets[setIndex] = set;

      const next: Workout = { ...workout, exercises };
      // Let the converter assign a fresh `updatedAt` (server timestamp); do not resend stale client value.
      const forWrite = { ...next } as Workout & { updatedAt?: string };
      delete forWrite.updatedAt;
      const safe = stripUndefinedDeep(forWrite as Workout);
      transaction.set(ref, safe);
      return next;
    });
  });
}

export async function getWorkoutByDate(userId: string, date: string): Promise<Workout | null> {
  return withService('training', 'read workout by date', async () => {
    const workouts = await queryDocuments<Workout>(
      collections.workouts(userId),
      [where('date', '==', date)],
      workoutConverter,
    );
    return workouts[0] || null;
  });
}

export async function createWorkout(userId: string, workout: Omit<Workout, 'id'>): Promise<string> {
  return withService('training', 'create workout', () =>
    addDocument<Workout>(collections.workouts(userId), workout as Workout, workoutConverter),
  );
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  updates: Partial<Workout>,
): Promise<void> {
  return withService('training', 'update workout', () =>
    updateDocument<Workout>(collections.workouts(userId), workoutId, updates),
  );
}

export async function saveWorkout(userId: string, workout: Workout): Promise<void> {
  return withService('training', 'save workout', async () => {
    if (workout.id) {
      await setDocument<Workout>(
        collections.workouts(userId),
        workout.id,
        workout,
        workoutConverter,
      );
    } else {
      await createWorkout(userId, workout);
    }
  });
}

export async function deleteWorkout(userId: string, workoutId: string): Promise<void> {
  return withService('training', 'delete workout', () =>
    deleteDocument(collections.workouts(userId), workoutId),
  );
}

// Get recent workouts (default 14 days for one full cycle)
export async function getRecentWorkouts(userId: string, days: number = 14): Promise<Workout[]> {
  return withService('training', 'read recent workouts', () => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return queryDocuments<Workout>(
      collections.workouts(userId),
      [where('date', '>=', fromDate.toISOString().split('T')[0]), orderBy('date', 'desc')],
      workoutConverter,
    );
  });
}
