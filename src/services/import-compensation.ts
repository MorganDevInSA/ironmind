/**
 * Compensating rollback for coach JSON import — reverses writes in LIFO order
 * so a failed multi-step import does not leave the user in a partial domain state.
 */
import type { AthleteProfile, SupplementProtocol, VolumeLandmarks } from '@/lib/types';
import type { NutritionPlanSeed } from '@/lib/seed/nutrition';
import { deleteDocument } from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { getProfile, updateProfile } from './profile.service';
import { getActiveProgram, deleteProgram, setActiveProgram } from './training.service';
import { getProtocol, saveProtocol } from './supplements.service';
import {
  getActivePhase,
  deletePhase,
  deleteJournalEntry,
  setActivePhase,
} from './coaching.service';
import { getVolumeLandmarks, updateVolumeLandmarks } from './volume.service';
import {
  getNutritionPlan,
  deleteNutritionDay,
  deleteNutritionPlanCurrent,
  saveNutritionPlan,
} from './nutrition.service';
import { withService } from '@/lib/errors';

export type ImportArtifact =
  | { type: 'profile' }
  | { type: 'program'; id: string }
  | { type: 'protocol' }
  | { type: 'phase'; id: string }
  | { type: 'landmarks' }
  | { type: 'nutritionPlan' }
  | { type: 'nutritionDay'; date: string }
  | { type: 'journal'; id: string };

export interface ImportSnapshots {
  priorProfile: AthleteProfile | null;
  priorProtocol: SupplementProtocol | null;
  priorNutritionPlan: NutritionPlanSeed | null;
  priorLandmarks: VolumeLandmarks | null;
  priorActiveProgramId: string | null;
  priorActivePhaseId: string | null;
}

export async function captureImportSnapshots(userId: string): Promise<ImportSnapshots> {
  const [
    priorProfile,
    priorProtocol,
    priorNutritionPlan,
    priorLandmarks,
    activeProgram,
    activePhase,
  ] = await Promise.all([
    getProfile(userId),
    getProtocol(userId),
    getNutritionPlan(userId),
    getVolumeLandmarks(userId),
    getActiveProgram(userId),
    getActivePhase(userId),
  ]);

  return {
    priorProfile,
    priorProtocol,
    priorNutritionPlan,
    priorLandmarks,
    priorActiveProgramId: activeProgram?.id ?? null,
    priorActivePhaseId: activePhase?.id ?? null,
  };
}

export async function rollbackImportArtifacts(
  userId: string,
  artifacts: ImportArtifact[],
  snap: ImportSnapshots,
): Promise<void> {
  return withService('import', 'rollback import artifacts', async () => {
    for (let i = artifacts.length - 1; i >= 0; i--) {
      const a = artifacts[i];
      switch (a.type) {
        case 'journal':
          await deleteJournalEntry(userId, a.id);
          break;
        case 'nutritionDay':
          await deleteNutritionDay(userId, a.date);
          break;
        case 'nutritionPlan':
          if (snap.priorNutritionPlan) {
            await saveNutritionPlan(userId, snap.priorNutritionPlan);
          } else {
            await deleteNutritionPlanCurrent(userId);
          }
          break;
        case 'landmarks':
          if (snap.priorLandmarks) {
            await updateVolumeLandmarks(userId, snap.priorLandmarks);
          } else {
            await deleteDocument(collections.volumeLandmarks(userId), 'data');
          }
          break;
        case 'phase':
          await deletePhase(userId, a.id);
          break;
        case 'protocol':
          if (snap.priorProtocol) {
            await saveProtocol(userId, snap.priorProtocol);
          } else {
            await deleteDocument(collections.supplementProtocol(userId), 'current');
          }
          break;
        case 'program':
          await deleteProgram(userId, a.id);
          break;
        case 'profile':
          if (snap.priorProfile) {
            await updateProfile(userId, snap.priorProfile);
          } else {
            await deleteDocument(collections.profiles(userId), 'data');
          }
          break;
        default:
          break;
      }
    }

    if (snap.priorActiveProgramId) {
      await setActiveProgram(userId, snap.priorActiveProgramId);
    }
    if (snap.priorActivePhaseId) {
      await setActivePhase(userId, snap.priorActivePhaseId);
    }
  });
}
