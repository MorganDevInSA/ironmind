import { isUserSeeded, markUserSeeded } from '@/services/profile.service';
import { updateProfile } from '@/services/profile.service';
import { createProgram, setActiveProgram } from '@/services/training.service';
import { saveProtocol } from '@/services/supplements.service';
import { createPhase, setActivePhase } from '@/services/coaching.service';
import { updateVolumeLandmarks } from '@/services/volume.service';
import { createJournalEntry } from '@/services/coaching.service';
import { saveNutritionDay } from '@/services/nutrition.service';
import { today } from '@/lib/utils';

import { morganProfile } from './profile';
import { morganProgram } from './program';
import { morganNutritionPlan } from './nutrition';
import { morganSupplementProtocol } from './supplements';
import { morganInitialPhase } from './phase';
import { morganVolumeLandmarks } from './volume-landmarks';
import { morganInitialNotes } from './coaching-notes';

/**
 * Seed data for new users
 * This runs once on first login after Firebase Auth is initialized
 * Writes all Morgan's real data to Firestore
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
    await updateProfile(userId, morganProfile);
    console.log('✓ Profile seeded');

    // 2. Program (14-day rotating cycle)
    const programId = await createProgram(userId, morganProgram);
    await setActiveProgram(userId, programId);
    console.log('✓ Program seeded');

    // 3. Supplement Protocol
    await saveProtocol(userId, morganSupplementProtocol);
    console.log('✓ Supplement protocol seeded');

    // 4. Phase
    const phaseId = await createPhase(userId, morganInitialPhase);
    await setActivePhase(userId, phaseId);
    console.log('✓ Phase seeded');

    // 5. Volume Landmarks
    await updateVolumeLandmarks(userId, morganVolumeLandmarks);
    console.log('✓ Volume landmarks seeded');

    // 6. Nutrition plan — seed today's moderate day as a placeholder
    const todayStr = today();
    const { macroTargetsByDayType } = morganNutritionPlan;
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
    for (const note of morganInitialNotes) {
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

// Re-export all seed data for reference
export { morganProfile } from './profile';
export { morganProgram } from './program';
export { morganNutritionPlan } from './nutrition';
export { morganSupplementProtocol } from './supplements';
export { morganInitialPhase } from './phase';
export { morganVolumeLandmarks } from './volume-landmarks';
export { morganInitialNotes } from './coaching-notes';
