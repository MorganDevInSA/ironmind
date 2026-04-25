import { isUserSeeded, markUserSeeded } from '@/services/profile.service';
import { updateProfile } from '@/services/profile.service';
import { createProgram, setActiveProgram } from '@/services/training.service';
import { saveProtocol } from '@/services/supplements.service';
import { createPhase, setActivePhase, createJournalEntry } from '@/services/coaching.service';
import { updateVolumeLandmarks } from '@/services/volume.service';
import { saveNutritionDay, saveNutritionPlan } from '@/services/nutrition.service';
import { today } from '@/lib/utils';
import {
  DEMO_HISTORY_DAYS,
  getDemoHistoryStartDateString,
  seedDemoHistoricalData,
} from './demo-historical';
import { logServiceWrite } from '@/lib/logging/service-write-log';
import { collections } from '@/lib/firebase/config';
import { addDocument, updateDocument } from '@/lib/firebase/firestore';
import {
  captureImportSnapshots,
  rollbackImportArtifacts,
  type ImportArtifact,
} from '@/services/import-compensation';

import { mortonProfile } from './profile';
import { mortonProgram } from './program';
import { mortonNutritionPlan } from './nutrition';
import { mortonSupplementProtocol } from './supplements';
import { mortonInitialPhase } from './phase';
import { mortonVolumeLandmarks } from './volume-landmarks';
import { mortonInitialNotes } from './coaching-notes';

import { cheriProfile } from './cheri-profile';
import { cheriProgram } from './cheri-program';
import { cheriNutritionPlan } from './cheri-nutrition';
import { cheriSupplementProtocol } from './cheri-supplements';
import { cheriInitialPhase } from './cheri-phase';
import { cheriVolumeLandmarks } from './cheri-volume-landmarks';

import { alexProfile } from './alex-profile';
import { alexProgram } from './alex-program';
import { alexNutritionPlan } from './alex-nutrition';
import { alexSupplementProtocol } from './alex-supplements';
import { alexInitialPhase } from './alex-phase';
import { alexVolumeLandmarks } from './alex-volume-landmarks';

import { jordanProfile } from './jordan-profile';
import { jordanProgram } from './jordan-program';
import { jordanNutritionPlan } from './jordan-nutrition';
import { jordanSupplementProtocol } from './jordan-supplements';
import { jordanInitialPhase } from './jordan-phase';
import { jordanVolumeLandmarks } from './jordan-volume-landmarks';

import { fezProfile } from './fez-profile';
import { fezProgram } from './fez-program';
import { fezNutritionPlan } from './fez-nutrition';
import { fezSupplementProtocol } from './fez-supplements';
import { fezInitialPhase } from './fez-phase';
import { fezVolumeLandmarks } from './fez-volume-landmarks';

import { mariaProfile } from './maria-profile';
import { mariaProgram } from './maria-program';
import { mariaNutritionPlan } from './maria-nutrition';
import { mariaSupplementProtocol } from './maria-supplements';
import { mariaInitialPhase } from './maria-phase';
import { mariaVolumeLandmarks } from './maria-volume-landmarks';

export type SeedJobStatus = 'running' | 'success' | 'failed';

export interface SeedJobRecord {
  status: SeedJobStatus;
  startedAt: string;
  completedAt?: string;
  compensationApplied?: boolean;
  errorMessage?: string;
}

export interface SeedUserDataResult {
  seeded: boolean;
  jobId?: string;
}

/**
 * Seed data for new users — runs once on first login after Firebase Auth is initialized.
 * Writes Morton's baseline domain data in sequence; **`markUserSeeded` runs only after all steps succeed**.
 * Creates a **`seedJobs`** audit row (`running` → `success` | `failed`) and runs the same **compensating rollback**
 * as coach import on uncaught failure so first-login orchestration matches import semantics.
 */
export async function seedUserData(userId: string): Promise<SeedUserDataResult> {
  const alreadySeeded = await isUserSeeded(userId);
  if (alreadySeeded) {
    console.log('User already seeded, skipping...');
    return { seeded: false };
  }

  const jobPath = collections.seedJobs(userId);
  const jobId = await addDocument<SeedJobRecord>(jobPath, {
    status: 'running',
    startedAt: new Date().toISOString(),
  });

  const artifacts: ImportArtifact[] = [];
  const snap = await captureImportSnapshots(userId);

  try {
    console.log('Seeding user data for:', userId);

    await updateProfile(userId, mortonProfile);
    artifacts.push({ type: 'profile' });
    console.log('✓ Profile seeded');

    const programId = await createProgram(userId, mortonProgram);
    await setActiveProgram(userId, programId);
    artifacts.push({ type: 'program', id: programId });
    console.log('✓ Program seeded');

    await saveProtocol(userId, mortonSupplementProtocol);
    artifacts.push({ type: 'protocol' });
    console.log('✓ Supplement protocol seeded');

    const phaseId = await createPhase(userId, mortonInitialPhase);
    await setActivePhase(userId, phaseId);
    artifacts.push({ type: 'phase', id: phaseId });
    console.log('✓ Phase seeded');

    await updateVolumeLandmarks(userId, mortonVolumeLandmarks);
    artifacts.push({ type: 'landmarks' });
    console.log('✓ Volume landmarks seeded');

    await saveNutritionPlan(userId, mortonNutritionPlan);
    artifacts.push({ type: 'nutritionPlan' });
    const todayStr = today();
    const { macroTargetsByDayType } = mortonNutritionPlan;
    await saveNutritionDay(userId, todayStr, {
      date: todayStr,
      dayType: 'moderate',
      meals: [],
      macroTargets: macroTargetsByDayType.moderate,
      macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      complianceScore: 0,
    });
    artifacts.push({ type: 'nutritionDay', date: todayStr });
    console.log('✓ Nutrition plan seeded');

    for (const note of mortonInitialNotes) {
      const entryId = await createJournalEntry(userId, note);
      artifacts.push({ type: 'journal', id: entryId });
    }
    console.log('✓ Coaching notes seeded');

    await markUserSeeded(userId);
    await updateDocument<SeedJobRecord>(jobPath, jobId, {
      status: 'success',
      completedAt: new Date().toISOString(),
      compensationApplied: false,
    });
    console.log('✓ User marked as seeded');
    console.log('Seeding complete!');
    return { seeded: true, jobId };
  } catch (error) {
    console.error('Error seeding user data:', error);
    let compensationApplied = false;
    if (artifacts.length > 0) {
      try {
        await rollbackImportArtifacts(userId, artifacts, snap);
        compensationApplied = true;
      } catch (rbErr) {
        console.error('Seed compensating rollback failed:', rbErr);
      }
    }
    await updateDocument<SeedJobRecord>(jobPath, jobId, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      compensationApplied,
      errorMessage: String(error),
    });
    logServiceWrite('error', {
      domain: 'seed',
      operation: 'seedUserData',
      code: 'throw',
      errorCount: 1,
      jobId,
    });
    throw error;
  }
}

/**
 * Seed Morton's data — always overwrites existing data for userId
 */
export async function seedMortonData(userId: string): Promise<void> {
  await updateProfile(userId, mortonProfile);
  const historyStartStr = getDemoHistoryStartDateString();
  const programId = await createProgram(userId, {
    ...mortonProgram,
    startDate: historyStartStr,
  });
  await setActiveProgram(userId, programId);
  await saveProtocol(userId, mortonSupplementProtocol);
  const phaseId = await createPhase(userId, mortonInitialPhase);
  await setActivePhase(userId, phaseId);
  await updateVolumeLandmarks(userId, mortonVolumeLandmarks);

  await saveNutritionPlan(userId, mortonNutritionPlan);
  const todayStr = today();
  await saveNutritionDay(userId, todayStr, {
    date: todayStr,
    dayType: 'moderate',
    meals: [],
    macroTargets: mortonNutritionPlan.macroTargetsByDayType.moderate,
    macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    complianceScore: 0,
  });
  await seedDemoHistoricalData({
    personaId: 'morton',
    userId,
    profile: mortonProfile,
    programId,
    program: {
      ...mortonProgram,
      startDate: historyStartStr,
    },
    nutritionPlan: mortonNutritionPlan,
    supplementProtocol: mortonSupplementProtocol,
    days: DEMO_HISTORY_DAYS,
    historyStartDate: historyStartStr,
  });
  await markUserSeeded(userId);
}

/**
 * Seed Cheri's data — overwrites any existing data for userId
 */
export async function seedCheriData(userId: string): Promise<void> {
  await updateProfile(userId, cheriProfile);
  const historyStartStr = getDemoHistoryStartDateString();
  const programId = await createProgram(userId, {
    ...cheriProgram,
    startDate: historyStartStr,
  });
  await setActiveProgram(userId, programId);
  await saveProtocol(userId, cheriSupplementProtocol);
  const phaseId = await createPhase(userId, cheriInitialPhase);
  await setActivePhase(userId, phaseId);
  await updateVolumeLandmarks(userId, cheriVolumeLandmarks);

  await saveNutritionPlan(userId, cheriNutritionPlan);
  const todayStr = today();
  await saveNutritionDay(userId, todayStr, {
    date: todayStr,
    dayType: 'moderate',
    meals: [],
    macroTargets: cheriNutritionPlan.macroTargetsByDayType.moderate,
    macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    complianceScore: 0,
  });
  await seedDemoHistoricalData({
    personaId: 'cheri',
    userId,
    profile: cheriProfile,
    programId,
    program: {
      ...cheriProgram,
      startDate: historyStartStr,
    },
    nutritionPlan: cheriNutritionPlan,
    supplementProtocol: cheriSupplementProtocol,
    days: DEMO_HISTORY_DAYS,
    historyStartDate: historyStartStr,
  });
  await markUserSeeded(userId);
}

/**
 * Seed Alex's data — overwrites any existing data for userId
 */
export async function seedAlexData(userId: string): Promise<void> {
  await updateProfile(userId, alexProfile);
  const historyStartStr = getDemoHistoryStartDateString();
  const programId = await createProgram(userId, {
    ...alexProgram,
    startDate: historyStartStr,
  });
  await setActiveProgram(userId, programId);
  await saveProtocol(userId, alexSupplementProtocol);
  const phaseId = await createPhase(userId, alexInitialPhase);
  await setActivePhase(userId, phaseId);
  await updateVolumeLandmarks(userId, alexVolumeLandmarks);

  await saveNutritionPlan(userId, alexNutritionPlan);
  const todayStr = today();
  await saveNutritionDay(userId, todayStr, {
    date: todayStr,
    dayType: 'high',
    meals: [],
    macroTargets: alexNutritionPlan.macroTargetsByDayType.high,
    macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    complianceScore: 0,
  });
  await seedDemoHistoricalData({
    personaId: 'alex',
    userId,
    profile: alexProfile,
    programId,
    program: {
      ...alexProgram,
      startDate: historyStartStr,
    },
    nutritionPlan: alexNutritionPlan,
    supplementProtocol: alexSupplementProtocol,
    days: DEMO_HISTORY_DAYS,
    historyStartDate: historyStartStr,
  });
  await markUserSeeded(userId);
}

/**
 * Seed Jordan's data — overwrites any existing data for userId
 */
export async function seedJordanData(userId: string): Promise<void> {
  await updateProfile(userId, jordanProfile);
  const historyStartStr = getDemoHistoryStartDateString();
  const programId = await createProgram(userId, {
    ...jordanProgram,
    startDate: historyStartStr,
  });
  await setActiveProgram(userId, programId);
  await saveProtocol(userId, jordanSupplementProtocol);
  const phaseId = await createPhase(userId, jordanInitialPhase);
  await setActivePhase(userId, phaseId);
  await updateVolumeLandmarks(userId, jordanVolumeLandmarks);

  await saveNutritionPlan(userId, jordanNutritionPlan);
  const todayStr = today();
  await saveNutritionDay(userId, todayStr, {
    date: todayStr,
    dayType: 'moderate',
    meals: [],
    macroTargets: jordanNutritionPlan.macroTargetsByDayType.moderate,
    macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    complianceScore: 0,
  });
  await seedDemoHistoricalData({
    personaId: 'jordan',
    userId,
    profile: jordanProfile,
    programId,
    program: {
      ...jordanProgram,
      startDate: historyStartStr,
    },
    nutritionPlan: jordanNutritionPlan,
    supplementProtocol: jordanSupplementProtocol,
    days: DEMO_HISTORY_DAYS,
    historyStartDate: historyStartStr,
  });
  await markUserSeeded(userId);
}

/**
 * Seed Fez's data — overwrites any existing data for userId
 */
export async function seedFezData(userId: string): Promise<void> {
  await updateProfile(userId, fezProfile);
  const historyStartStr = getDemoHistoryStartDateString();
  const programId = await createProgram(userId, {
    ...fezProgram,
    startDate: historyStartStr,
  });
  await setActiveProgram(userId, programId);
  await saveProtocol(userId, fezSupplementProtocol);
  const phaseId = await createPhase(userId, fezInitialPhase);
  await setActivePhase(userId, phaseId);
  await updateVolumeLandmarks(userId, fezVolumeLandmarks);

  await saveNutritionPlan(userId, fezNutritionPlan);
  const todayStr = today();
  await saveNutritionDay(userId, todayStr, {
    date: todayStr,
    dayType: 'high',
    meals: [],
    macroTargets: fezNutritionPlan.macroTargetsByDayType.high,
    macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    complianceScore: 0,
  });
  await seedDemoHistoricalData({
    personaId: 'fez',
    userId,
    profile: fezProfile,
    programId,
    program: {
      ...fezProgram,
      startDate: historyStartStr,
    },
    nutritionPlan: fezNutritionPlan,
    supplementProtocol: fezSupplementProtocol,
    days: DEMO_HISTORY_DAYS,
    historyStartDate: historyStartStr,
  });
  await markUserSeeded(userId);
}

/**
 * Seed Maria's data — overwrites any existing data for userId
 */
export async function seedMariaData(userId: string): Promise<void> {
  await updateProfile(userId, mariaProfile);
  const historyStartStr = getDemoHistoryStartDateString();
  const programId = await createProgram(userId, {
    ...mariaProgram,
    startDate: historyStartStr,
  });
  await setActiveProgram(userId, programId);
  await saveProtocol(userId, mariaSupplementProtocol);
  const phaseId = await createPhase(userId, mariaInitialPhase);
  await setActivePhase(userId, phaseId);
  await updateVolumeLandmarks(userId, mariaVolumeLandmarks);

  await saveNutritionPlan(userId, mariaNutritionPlan);
  const todayStr = today();
  await saveNutritionDay(userId, todayStr, {
    date: todayStr,
    dayType: 'moderate',
    meals: [],
    macroTargets: mariaNutritionPlan.macroTargetsByDayType.moderate,
    macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    complianceScore: 0,
  });
  await seedDemoHistoricalData({
    personaId: 'maria',
    userId,
    profile: mariaProfile,
    programId,
    program: {
      ...mariaProgram,
      startDate: historyStartStr,
    },
    nutritionPlan: mariaNutritionPlan,
    supplementProtocol: mariaSupplementProtocol,
    days: DEMO_HISTORY_DAYS,
    historyStartDate: historyStartStr,
  });
  await markUserSeeded(userId);
}

// Re-export all seed data for reference
export { mortonProfile } from './profile';
export { mortonProgram } from './program';
export { mortonNutritionPlan } from './nutrition';
export { mortonSupplementProtocol } from './supplements';
export { mortonInitialPhase } from './phase';
export { mortonVolumeLandmarks } from './volume-landmarks';
export { mortonInitialNotes } from './coaching-notes';
export { DEMO_HISTORY_DAYS } from './demo-historical';
export {
  DEMO_THEME_BY_PROFILE_ID,
  getDemoThemeForClientName,
  getDemoThemeForProfileId,
} from './demo-theme';
export {
  DEMO_PHYSIQUE_WEEKLY_BY_PERSONA,
  getDemoPhysiqueWeeks,
  type DemoPersonaId,
  type DemoPhysiqueWeek,
} from './demo-data/physique';
