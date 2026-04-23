import type {
  AthleteProfile,
  Program,
  SupplementProtocol,
  Phase,
  VolumeLandmarks,
  JournalEntry,
  NutritionDay,
} from '@/lib/types';
import type { NutritionPlanSeed } from '@/lib/seed/nutrition';
import { markUserSeeded, isUserSeeded } from './profile.service';
import { createProgram, setActiveProgram, getPrograms } from './training.service';
import { createPhase, setActivePhase, getPhases } from './coaching.service';
import { withService } from '@/lib/errors';
import { collections } from '@/lib/firebase/config';
import { addDocument, updateDocument } from '@/lib/firebase/firestore';
import { logServiceWrite } from '@/lib/logging/service-write-log';
import {
  captureImportSnapshots,
  rollbackImportArtifacts,
  type ImportArtifact,
} from './import-compensation';
import {
  commitCoachImportStaticBatch,
  commitCoachImportNutritionBatch,
  createProgramImportFirstOnly,
  createPhaseImportFirstOnly,
} from './import-firestore-batch';

export interface ImportFile {
  filename: string;
  content: string;
}

export type ImportCompletion = 'success' | 'partial' | 'failed' | 'blocked';

export interface ImportResult {
  success: boolean;
  /** Explicit outcome for UI and retry logic (principal review import contract). */
  completion: ImportCompletion;
  filesImported: string[];
  errors: { filename: string; error: string }[];
  /** Present when a Firestore `importJobs` row was created for this run (omitted for pre-check `blocked`). */
  jobId?: string;
}

/** Persisted under `users/{uid}/importJobs/{jobId}` for audit and retry UX. */
export type ImportJobStatus = 'running' | ImportCompletion;

export interface ImportJobRecord {
  status: ImportJobStatus;
  startedAt: string;
  completedAt?: string;
  force: boolean;
  filesImported: string[];
  errors: { filename: string; error: string }[];
  /** True when compensating rollback ran after a partial import failure. */
  compensationApplied?: boolean;
}

export interface ParsedCoachData {
  athleteProfile?: AthleteProfile;
  trainingProgram?: Omit<Program, 'id'>;
  nutritionPlan?: NutritionPlanSeed;
  supplementProtocol?: SupplementProtocol;
  phase?: Omit<Phase, 'id'>;
  volumeLandmarks?: VolumeLandmarks;
}

const FILE_VALIDATORS: Record<string, (data: unknown) => string | null> = {
  'athlete_profile.json': (d) => {
    const data = d as Record<string, unknown>;
    if (typeof data.age !== 'number') return 'Missing or invalid field: age';
    if (typeof data.currentWeight !== 'number') return 'Missing or invalid field: currentWeight';
    if (typeof data.targetWeight !== 'number') return 'Missing or invalid field: targetWeight';
    if (typeof data.primaryGoal !== 'string') return 'Missing or invalid field: primaryGoal';
    return null;
  },
  'training_program.json': (d) => {
    const data = d as Record<string, unknown>;
    if (typeof data.name !== 'string') return 'Missing or invalid field: name';
    if (!Array.isArray(data.sessions)) return 'Missing or invalid field: sessions';
    if (typeof data.cycleLengthDays !== 'number')
      return 'Missing or invalid field: cycleLengthDays';
    return null;
  },
  'nutrition_plan.json': (d) => {
    const data = d as Record<string, unknown>;
    if (typeof data.proteinTarget !== 'number') return 'Missing or invalid field: proteinTarget';
    if (!data.macroTargetsByDayType) return 'Missing or invalid field: macroTargetsByDayType';
    return null;
  },
  'supplement_protocol.json': (d) => {
    const data = d as Record<string, unknown>;
    if (!Array.isArray(data.windows)) return 'Missing or invalid field: windows';
    return null;
  },
  'phase.json': (d) => {
    const data = d as Record<string, unknown>;
    if (typeof data.name !== 'string') return 'Missing or invalid field: name';
    if (!data.targets) return 'Missing or invalid field: targets';
    return null;
  },
  'volume_landmarks.json': (d) => {
    const data = d as Record<string, unknown>;
    if (!data.chest) return 'Missing or invalid field: chest';
    if (!data.back) return 'Missing or invalid field: back';
    return null;
  },
};

export function parseAndValidateFiles(files: ImportFile[]): {
  data: ParsedCoachData;
  errors: { filename: string; error: string }[];
} {
  const data: ParsedCoachData = {};
  const errors: { filename: string; error: string }[] = [];

  for (const file of files) {
    const name = file.filename.toLowerCase();

    let parsed: unknown;
    try {
      parsed = JSON.parse(file.content);
    } catch {
      errors.push({ filename: file.filename, error: 'Invalid JSON — could not parse file' });
      continue;
    }

    const validator = FILE_VALIDATORS[name];
    if (validator) {
      const validationError = validator(parsed);
      if (validationError) {
        errors.push({ filename: file.filename, error: validationError });
        continue;
      }
    }

    if (name === 'athlete_profile.json') data.athleteProfile = parsed as AthleteProfile;
    else if (name === 'training_program.json') data.trainingProgram = parsed as Omit<Program, 'id'>;
    else if (name === 'nutrition_plan.json') data.nutritionPlan = parsed as NutritionPlanSeed;
    else if (name === 'supplement_protocol.json')
      data.supplementProtocol = parsed as SupplementProtocol;
    else if (name === 'phase.json') data.phase = parsed as Omit<Phase, 'id'>;
    else if (name === 'volume_landmarks.json') data.volumeLandmarks = parsed as VolumeLandmarks;
    else
      errors.push({
        filename: file.filename,
        error: 'Unrecognised filename — expected one of the 6 coach output files',
      });
  }

  return { data, errors };
}

/**
 * Applies coach JSON bundles to Firestore with batched commits where paths are independent:
 * profile + supplement protocol + volume landmarks share one `writeBatch`; nutrition plan + today’s
 * day + import journal note share one batch. First program / first phase on empty subcollections use
 * a single `batch.set` (skip the multi-doc active-pointer transaction). Force re-import with existing
 * programs/phases still uses `createProgram` + `setActiveProgram` / `createPhase` + `setActivePhase`.
 * `markUserSeeded` runs only when every step succeeds (`errors` empty); partial imports can leave data without the seeded flag.
 * Each run creates a row in `users/{uid}/importJobs` (`running` → terminal status) for audit and future resume UX.
 */
export async function importCoachData(
  userId: string,
  data: ParsedCoachData,
  force = false,
): Promise<ImportResult> {
  return withService('import', 'import coach data', async () => {
    const filesImported: string[] = [];
    const errors: { filename: string; error: string }[] = [];

    const alreadySeeded = await isUserSeeded(userId);
    if (alreadySeeded && !force) {
      const blocked: ImportResult = {
        success: false,
        completion: 'blocked',
        filesImported: [],
        errors: [
          {
            filename: 'all',
            error: 'User already has data. Use force re-import from Settings to overwrite.',
          },
        ],
      };
      logServiceWrite('info', {
        domain: 'import',
        operation: 'importCoachData',
        completion: blocked.completion,
        filesImportedCount: 0,
        errorCount: blocked.errors.length,
      });
      return blocked;
    }

    const jobPath = collections.importJobs(userId);
    const jobId = await addDocument<ImportJobRecord>(jobPath, {
      status: 'running',
      startedAt: new Date().toISOString(),
      force,
      filesImported: [],
      errors: [],
    });

    const persistJobTerminal = async (result: ImportResult, compensationApplied: boolean) => {
      const terminalStatus: ImportJobStatus = result.completion;
      await updateDocument<ImportJobRecord>(jobPath, jobId, {
        status: terminalStatus,
        completedAt: new Date().toISOString(),
        filesImported: result.filesImported,
        errors: result.errors,
        compensationApplied,
      });
      logServiceWrite(result.success ? 'info' : 'warn', {
        domain: 'import',
        operation: 'importCoachData',
        jobId,
        completion: result.completion,
        filesImportedCount: result.filesImported.length,
        errorCount: result.errors.length,
      });
    };

    const artifacts: ImportArtifact[] = [];
    const snap = await captureImportSnapshots(userId);
    const [existingPrograms, existingPhases] = await Promise.all([
      getPrograms(userId),
      getPhases(userId),
    ]);

    try {
      const hasStatic = !!(data.athleteProfile || data.supplementProtocol || data.volumeLandmarks);
      if (hasStatic) {
        try {
          await commitCoachImportStaticBatch(userId, {
            profile: data.athleteProfile,
            protocol: data.supplementProtocol,
            landmarks: data.volumeLandmarks,
          });
          if (data.athleteProfile) {
            filesImported.push('athlete_profile.json');
            artifacts.push({ type: 'profile' });
          }
          if (data.supplementProtocol) {
            filesImported.push('supplement_protocol.json');
            artifacts.push({ type: 'protocol' });
          }
          if (data.volumeLandmarks) {
            filesImported.push('volume_landmarks.json');
            artifacts.push({ type: 'landmarks' });
          }
        } catch (e) {
          const msg = String(e);
          if (data.athleteProfile) {
            errors.push({ filename: 'athlete_profile.json', error: msg });
          }
          if (data.supplementProtocol) {
            errors.push({ filename: 'supplement_protocol.json', error: msg });
          }
          if (data.volumeLandmarks) {
            errors.push({ filename: 'volume_landmarks.json', error: msg });
          }
        }
      }

      if (data.trainingProgram) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const programWithDate = { ...data.trainingProgram, startDate: today, isActive: true };
          let programId: string;
          if (existingPrograms.length === 0) {
            programId = await createProgramImportFirstOnly(userId, programWithDate);
          } else {
            programId = await createProgram(userId, programWithDate);
            await setActiveProgram(userId, programId);
          }
          filesImported.push('training_program.json');
          artifacts.push({ type: 'program', id: programId });
        } catch (e) {
          errors.push({ filename: 'training_program.json', error: String(e) });
        }
      }

      if (data.phase) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const phaseWithDate = { ...data.phase, startDate: today, isActive: true };
          let phaseId: string;
          if (existingPhases.length === 0) {
            phaseId = await createPhaseImportFirstOnly(userId, phaseWithDate);
          } else {
            phaseId = await createPhase(userId, phaseWithDate);
            await setActivePhase(userId, phaseId);
          }
          filesImported.push('phase.json');
          artifacts.push({ type: 'phase', id: phaseId });
        } catch (e) {
          errors.push({ filename: 'phase.json', error: String(e) });
        }
      }

      if (data.nutritionPlan) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const { macroTargetsByDayType } = data.nutritionPlan;
          const day: NutritionDay = {
            id: today,
            date: today,
            dayType: 'moderate',
            meals: [],
            macroTargets: macroTargetsByDayType.moderate,
            macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
            complianceScore: 0,
          };
          const note: Omit<JournalEntry, 'id'> = {
            date: today,
            title: 'Nutrition Plan — Day-Type Targets',
            content: [
              `Protein target: ${data.nutritionPlan.proteinTarget}g/day`,
              `Recovery day: ${macroTargetsByDayType.recovery.calories[0]}–${macroTargetsByDayType.recovery.calories[1]} kcal | ${macroTargetsByDayType.recovery.carbs[0]}–${macroTargetsByDayType.recovery.carbs[1]}g carbs`,
              `Moderate day: ${macroTargetsByDayType.moderate.calories[0]}–${macroTargetsByDayType.moderate.calories[1]} kcal | ${macroTargetsByDayType.moderate.carbs[0]}–${macroTargetsByDayType.moderate.carbs[1]}g carbs`,
              `High day: ${macroTargetsByDayType.high.calories[0]}–${macroTargetsByDayType.high.calories[1]} kcal | ${macroTargetsByDayType.high.carbs[0]}–${macroTargetsByDayType.high.carbs[1]}g carbs`,
              `Highest day: ${macroTargetsByDayType.highest.calories[0]}–${macroTargetsByDayType.highest.calories[1]} kcal | ${macroTargetsByDayType.highest.carbs[0]}–${macroTargetsByDayType.highest.carbs[1]}g carbs`,
              `Emergency rule: ${data.nutritionPlan.emergencyRule}`,
            ].join('\n'),
            tags: ['nutrition', 'targets', 'phase-start'],
          };
          const { journalId } = await commitCoachImportNutritionBatch(userId, {
            plan: data.nutritionPlan,
            dayDate: today,
            day,
            journal: note,
          });
          artifacts.push({ type: 'nutritionPlan' });
          artifacts.push({ type: 'nutritionDay', date: today });
          artifacts.push({ type: 'journal', id: journalId });
          filesImported.push('nutrition_plan.json');
        } catch (e) {
          errors.push({ filename: 'nutrition_plan.json', error: String(e) });
        }
      }

      let compensationApplied = false;
      if (errors.length > 0 && artifacts.length > 0) {
        try {
          await rollbackImportArtifacts(userId, artifacts, snap);
          compensationApplied = true;
          filesImported.length = 0;
        } catch (rbErr) {
          errors.push({
            filename: 'all',
            error: `Compensating rollback failed: ${String(rbErr)}`,
          });
        }
      }

      if (errors.length === 0) {
        await markUserSeeded(userId);
      }

      const success = errors.length === 0;
      const completion: ImportCompletion = success
        ? 'success'
        : filesImported.length > 0
          ? 'partial'
          : 'failed';

      const result: ImportResult = {
        success,
        completion,
        filesImported,
        errors,
        jobId,
      };
      await persistJobTerminal(result, compensationApplied);
      return result;
    } catch (e) {
      let compensationApplied = false;
      if (artifacts.length > 0) {
        try {
          await rollbackImportArtifacts(userId, artifacts, snap);
          compensationApplied = true;
          filesImported.length = 0;
        } catch (rbErr) {
          errors.push({
            filename: 'all',
            error: `Compensating rollback failed: ${String(rbErr)}`,
          });
        }
      }

      const mergedErrors = [...errors, { filename: 'all', error: String(e) }];
      await updateDocument<ImportJobRecord>(jobPath, jobId, {
        status: 'failed',
        completedAt: new Date().toISOString(),
        filesImported,
        errors: mergedErrors,
        compensationApplied,
      });
      logServiceWrite('error', {
        domain: 'import',
        operation: 'importCoachData',
        jobId,
        code: 'throw',
        completion: 'failed',
        filesImportedCount: filesImported.length,
        errorCount: mergedErrors.length,
      });
      throw e;
    }
  });
}
