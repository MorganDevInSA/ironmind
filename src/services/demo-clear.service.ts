/**
 * Removes coach/demo-generated Firestore domain data so a real coach pack or manual reset
 * can replace Morton demo overlays (workouts, trends, profile shell) without orphan documents.
 */
import type {
  Workout,
  NutritionDay,
  RecoveryEntry,
  SupplementLog,
  JournalEntry,
  WeeklyVolumeRollup,
} from '@/lib/types';
import { deleteDocument, getAllDocuments, createConverter } from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { withService } from '@/lib/errors';
import { deleteProgram, getPrograms } from './training.service';
import { deletePhase, getPhases } from './coaching.service';
import { deleteAllCheckIns } from './physique.service';
import { deleteNutritionPlanCurrent } from './nutrition.service';

const workoutConverter = createConverter<Workout>();
const nutritionDayConverter = createConverter<NutritionDay>();
const recoveryConverter = createConverter<RecoveryEntry>();
const supplementLogConverter = createConverter<SupplementLog>();
const journalConverter = createConverter<JournalEntry>();
const rollupConverter = createConverter<WeeklyVolumeRollup>();

const CHUNK = 40;

async function deleteAllInCollection<T extends { id: string }>(
  collectionPath: string,
  converter: ReturnType<typeof createConverter<T>>,
): Promise<void> {
  const rows = await getAllDocuments<T>(collectionPath, converter);
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    await Promise.all(slice.map((r) => deleteDocument(collectionPath, r.id)));
  }
}

/** Deletes workouts, logs, charts data, programs/phases, and profile/protocol/plan shells for this user. */
export async function clearCoachDemoOverlay(userId: string): Promise<void> {
  return withService('import', 'clear coach demo overlay', async () => {
    if (!userId) {
      throw new Error('clearCoachDemoOverlay requires a signed-in user');
    }

    await deleteAllInCollection(collections.workouts(userId), workoutConverter);
    await deleteAllInCollection(collections.nutritionDays(userId), nutritionDayConverter);
    await deleteAllInCollection(collections.recoveryEntries(userId), recoveryConverter);
    await deleteAllInCollection(collections.supplementLogs(userId), supplementLogConverter);
    await deleteAllInCollection(collections.journalEntries(userId), journalConverter);
    await deleteAllInCollection(collections.weeklyVolumeRollups(userId), rollupConverter);

    await deleteAllCheckIns(userId);

    const programs = await getPrograms(userId);
    for (const p of programs) {
      await deleteProgram(userId, p.id);
    }

    const phases = await getPhases(userId);
    for (const ph of phases) {
      await deletePhase(userId, ph.id);
    }

    await deleteDocument(collections.volumeLandmarks(userId), 'data');
    await deleteDocument(collections.supplementProtocol(userId), 'current');
    await deleteNutritionPlanCurrent(userId);
    await deleteDocument(collections.profiles(userId), 'data');
  });
}
