import type {
  AthleteProfile,
  Program,
  SupplementProtocol,
  Phase,
  VolumeLandmarks,
  JournalEntry,
} from '@/lib/types';
import type { NutritionPlanSeed } from '@/lib/seed/nutrition';
import { updateProfile, markUserSeeded, isUserSeeded } from './profile.service';
import { createProgram, setActiveProgram } from './training.service';
import { saveProtocol } from './supplements.service';
import { createPhase, setActivePhase, createJournalEntry } from './coaching.service';
import { updateVolumeLandmarks } from './volume.service';
import { saveNutritionDay, saveNutritionPlan } from './nutrition.service';
import { withService } from '@/lib/errors';

export interface ImportFile {
  filename: string;
  content: string;
}

export interface ImportResult {
  success: boolean;
  filesImported: string[];
  errors: { filename: string; error: string }[];
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
    if (typeof data.cycleLengthDays !== 'number') return 'Missing or invalid field: cycleLengthDays';
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
    else if (name === 'supplement_protocol.json') data.supplementProtocol = parsed as SupplementProtocol;
    else if (name === 'phase.json') data.phase = parsed as Omit<Phase, 'id'>;
    else if (name === 'volume_landmarks.json') data.volumeLandmarks = parsed as VolumeLandmarks;
    else errors.push({ filename: file.filename, error: 'Unrecognised filename — expected one of the 6 coach output files' });
  }

  return { data, errors };
}

export async function importCoachData(
  userId: string,
  data: ParsedCoachData,
  force = false
): Promise<ImportResult> {
  return withService('import', 'import coach data', async () => {
    const filesImported: string[] = [];
    const errors: { filename: string; error: string }[] = [];

    const alreadySeeded = await isUserSeeded(userId);
    if (alreadySeeded && !force) {
      return {
        success: false,
        filesImported: [],
        errors: [{ filename: 'all', error: 'User already has data. Use force re-import from Settings to overwrite.' }],
      };
    }

  if (data.athleteProfile) {
    try {
      await updateProfile(userId, data.athleteProfile);
      filesImported.push('athlete_profile.json');
    } catch (e) {
      errors.push({ filename: 'athlete_profile.json', error: String(e) });
    }
  }

  if (data.trainingProgram) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const programWithDate = { ...data.trainingProgram, startDate: today, isActive: true };
      const programId = await createProgram(userId, programWithDate);
      await setActiveProgram(userId, programId);
      filesImported.push('training_program.json');
    } catch (e) {
      errors.push({ filename: 'training_program.json', error: String(e) });
    }
  }

  if (data.supplementProtocol) {
    try {
      await saveProtocol(userId, data.supplementProtocol);
      filesImported.push('supplement_protocol.json');
    } catch (e) {
      errors.push({ filename: 'supplement_protocol.json', error: String(e) });
    }
  }

  if (data.phase) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const phaseWithDate = { ...data.phase, startDate: today, isActive: true };
      const phaseId = await createPhase(userId, phaseWithDate);
      await setActivePhase(userId, phaseId);
      filesImported.push('phase.json');
    } catch (e) {
      errors.push({ filename: 'phase.json', error: String(e) });
    }
  }

  if (data.volumeLandmarks) {
    try {
      await updateVolumeLandmarks(userId, data.volumeLandmarks);
      filesImported.push('volume_landmarks.json');
    } catch (e) {
      errors.push({ filename: 'volume_landmarks.json', error: String(e) });
    }
  }

  if (data.nutritionPlan) {
    try {
      await saveNutritionPlan(userId, data.nutritionPlan);

      const today = new Date().toISOString().split('T')[0];
      const { macroTargetsByDayType } = data.nutritionPlan;
      await saveNutritionDay(userId, today, {
        date: today,
        dayType: 'moderate',
        meals: [],
        macroTargets: macroTargetsByDayType.moderate,
        macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        complianceScore: 0,
      });

      // Seed a coaching note with nutrition targets
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
      await createJournalEntry(userId, note);
      filesImported.push('nutrition_plan.json');
    } catch (e) {
      errors.push({ filename: 'nutrition_plan.json', error: String(e) });
    }
  }

    if (errors.length === 0) {
      await markUserSeeded(userId);
    }

    return {
      success: errors.length === 0,
      filesImported,
      errors,
    };
  });
}
