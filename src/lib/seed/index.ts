import { isUserSeeded, markUserSeeded } from '@/services/profile.service';
import { updateProfile } from '@/services/profile.service';
import { createProgram, setActiveProgram } from '@/services/training.service';
import { saveProtocol } from '@/services/supplements.service';
import { createPhase, setActivePhase } from '@/services/coaching.service';
import { updateVolumeLandmarks } from '@/services/volume.service';
import { createJournalEntry } from '@/services/coaching.service';
import { saveNutritionDay, saveNutritionPlan } from '@/services/nutrition.service';
import { today } from '@/lib/utils';
import { seedDemoHistoricalData } from './demo-historical';

import { mortonProfile } from './profile';
import { mortonProgram } from './program';
import { mortonNutritionPlan } from './nutrition';
import { mortonSupplementProtocol } from './supplements';
import { mortonInitialPhase } from './phase';
import { mortonVolumeLandmarks } from './volume-landmarks';
import { mortonInitialNotes } from './coaching-notes';

import { sheriProfile } from './sheri-profile';
import { sheriProgram } from './sheri-program';
import { sheriNutritionPlan } from './sheri-nutrition';
import { sheriSupplementProtocol } from './sheri-supplements';
import { sheriInitialPhase } from './sheri-phase';
import { sheriVolumeLandmarks } from './sheri-volume-landmarks';

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

/**
 * Seed data for new users
 * This runs once on first login after Firebase Auth is initialized
 * Writes all Morton's real data to Firestore
 */
export async function seedUserData(userId: string): Promise<boolean> {
  try {
    // Check if already seeded
    const alreadySeeded = await isUserSeeded(userId);
    if (alreadySeeded) {
      console.log('User already seeded, skipping...');
      return false;
    }

    console.log('Seeding user data for:', userId);

    // 1. Profile
    await updateProfile(userId, mortonProfile);
    console.log('✓ Profile seeded');

    // 2. Program (14-day rotating cycle)
    const programId = await createProgram(userId, mortonProgram);
    await setActiveProgram(userId, programId);
    console.log('✓ Program seeded');

    // 3. Supplement Protocol
    await saveProtocol(userId, mortonSupplementProtocol);
    console.log('✓ Supplement protocol seeded');

    // 4. Phase
    const phaseId = await createPhase(userId, mortonInitialPhase);
    await setActivePhase(userId, phaseId);
    console.log('✓ Phase seeded');

    // 5. Volume Landmarks
    await updateVolumeLandmarks(userId, mortonVolumeLandmarks);
    console.log('✓ Volume landmarks seeded');

    // 6. Nutrition plan — save full plan doc + seed today's moderate day
    await saveNutritionPlan(userId, mortonNutritionPlan);
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
    console.log('✓ Nutrition plan seeded');

    // 7. Initial Coaching Notes
    for (const note of mortonInitialNotes) {
      await createJournalEntry(userId, note);
    }
    console.log('✓ Coaching notes seeded');

    // Mark user as seeded
    await markUserSeeded(userId);
    console.log('✓ User marked as seeded');

    console.log('Seeding complete!');
    return true;
  } catch (error) {
    console.error('Error seeding user data:', error);
    throw error;
  }
}

/**
 * Seed Morton's data — always overwrites existing data for userId
 */
export async function seedMortonData(userId: string): Promise<void> {
  await updateProfile(userId, mortonProfile);
  const historyStart = new Date();
  historyStart.setDate(historyStart.getDate() - 41);
  const programId = await createProgram(userId, {
    ...mortonProgram,
    startDate: historyStart.toISOString().split('T')[0],
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
      startDate: historyStart.toISOString().split('T')[0],
    },
    nutritionPlan: mortonNutritionPlan,
    supplementProtocol: mortonSupplementProtocol,
  });
  await markUserSeeded(userId);
}

/**
 * Seed Sheri's data — overwrites any existing data for userId
 */
export async function seedSheriData(userId: string): Promise<void> {
  await updateProfile(userId, sheriProfile);
  const historyStart = new Date();
  historyStart.setDate(historyStart.getDate() - 41);
  const programId = await createProgram(userId, {
    ...sheriProgram,
    startDate: historyStart.toISOString().split('T')[0],
  });
  await setActiveProgram(userId, programId);
  await saveProtocol(userId, sheriSupplementProtocol);
  const phaseId = await createPhase(userId, sheriInitialPhase);
  await setActivePhase(userId, phaseId);
  await updateVolumeLandmarks(userId, sheriVolumeLandmarks);

  await saveNutritionPlan(userId, sheriNutritionPlan);
  const todayStr = today();
  await saveNutritionDay(userId, todayStr, {
    date: todayStr,
    dayType: 'moderate',
    meals: [],
    macroTargets: sheriNutritionPlan.macroTargetsByDayType.moderate,
    macroActuals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    complianceScore: 0,
  });
  await seedDemoHistoricalData({
    personaId: 'sheri',
    userId,
    profile: sheriProfile,
    programId,
    program: {
      ...sheriProgram,
      startDate: historyStart.toISOString().split('T')[0],
    },
    nutritionPlan: sheriNutritionPlan,
    supplementProtocol: sheriSupplementProtocol,
  });
  await markUserSeeded(userId);
}

/**
 * Seed Alex's data — overwrites any existing data for userId
 */
export async function seedAlexData(userId: string): Promise<void> {
  await updateProfile(userId, alexProfile);
  const historyStart = new Date();
  historyStart.setDate(historyStart.getDate() - 41);
  const programId = await createProgram(userId, {
    ...alexProgram,
    startDate: historyStart.toISOString().split('T')[0],
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
      startDate: historyStart.toISOString().split('T')[0],
    },
    nutritionPlan: alexNutritionPlan,
    supplementProtocol: alexSupplementProtocol,
  });
  await markUserSeeded(userId);
}

/**
 * Seed Jordan's data — overwrites any existing data for userId
 */
export async function seedJordanData(userId: string): Promise<void> {
  await updateProfile(userId, jordanProfile);
  const historyStart = new Date();
  historyStart.setDate(historyStart.getDate() - 41);
  const programId = await createProgram(userId, {
    ...jordanProgram,
    startDate: historyStart.toISOString().split('T')[0],
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
      startDate: historyStart.toISOString().split('T')[0],
    },
    nutritionPlan: jordanNutritionPlan,
    supplementProtocol: jordanSupplementProtocol,
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
