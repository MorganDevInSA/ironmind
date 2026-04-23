import type {
  AthleteProfile,
  Program,
  NutritionDay,
  RecoveryEntry,
  SupplementLog,
  SmartAlert,
} from '@/lib/types';
import { getProfile } from './profile.service';
import { getActiveProgram } from './training.service';
import { getNutritionDay } from './nutrition.service';
import { getRecoveryEntry, getLatestRecoveryEntry } from './recovery.service';
import { getSupplementLog } from './supplements.service';
import { getWeeklyVolumeSummary } from './volume.service';
import { getActiveAlerts } from './alerts.service';
import { withService } from '@/lib/errors';

/** Single round-trip payload for the main dashboard (Phase B — tighter cache + one query key). */
export interface DashboardBundle {
  profile: AthleteProfile | null;
  activeProgram: Program | null;
  todayNutrition: NutritionDay | null;
  todayRecovery: RecoveryEntry | null;
  latestRecovery: RecoveryEntry | null;
  todaySupplements: SupplementLog | null;
  weeklyVolume: Awaited<ReturnType<typeof getWeeklyVolumeSummary>>;
  alerts: SmartAlert[];
}

export async function getDashboardBundle(
  userId: string,
  calendarDate: string,
): Promise<DashboardBundle> {
  return withService('dashboard', 'load dashboard bundle', async () => {
    const [
      profile,
      activeProgram,
      todayNutrition,
      todayRecovery,
      latestRecovery,
      todaySupplements,
      weeklyVolume,
      alerts,
    ] = await Promise.all([
      getProfile(userId),
      getActiveProgram(userId),
      getNutritionDay(userId, calendarDate),
      getRecoveryEntry(userId, calendarDate),
      getLatestRecoveryEntry(userId),
      getSupplementLog(userId, calendarDate),
      getWeeklyVolumeSummary(userId),
      getActiveAlerts(userId),
    ]);

    return {
      profile,
      activeProgram,
      todayNutrition,
      todayRecovery,
      latestRecovery,
      todaySupplements,
      weeklyVolume,
      alerts,
    };
  });
}
