'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants';
import {
  getProfile,
  getActiveProgram,
  getNutritionDay,
  getRecoveryEntry,
  getSupplementLog,
  getWeeklyVolumeSummary,
  getActiveAlerts,
  getJournalEntries,
} from '@/services';
import { today } from '@/lib/utils';

// Composite hook that reads from multiple cache keys
// If the user has already visited training/nutrition/recovery pages,
// the dashboard renders instantly from cache with zero Firebase calls
export function useDashboardData(userId: string) {
  const todayStr = today();

  const profile = useQuery({
    queryKey: queryKeys.profile.detail(),
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  });

  const activeProgram = useQuery({
    queryKey: queryKeys.training.activeProgram(),
    queryFn: () => getActiveProgram(userId),
    enabled: !!userId,
  });

  const todayNutrition = useQuery({
    queryKey: queryKeys.nutrition.day(todayStr),
    queryFn: () => getNutritionDay(userId, todayStr),
    enabled: !!userId,
  });

  const todayRecovery = useQuery({
    queryKey: queryKeys.recovery.entry(todayStr),
    queryFn: () => getRecoveryEntry(userId, todayStr),
    enabled: !!userId,
  });

  const todaySupplements = useQuery({
    queryKey: queryKeys.supplements.log(todayStr),
    queryFn: () => getSupplementLog(userId, todayStr),
    enabled: !!userId,
  });

  const weeklyVolume = useQuery({
    queryKey: queryKeys.volume.weekly(),
    queryFn: () => getWeeklyVolumeSummary(userId),
    enabled: !!userId && !!activeProgram.data,
  });

  const alerts = useQuery({
    queryKey: queryKeys.alerts.active(),
    queryFn: () => getActiveAlerts(userId),
    enabled: !!userId,
  });

  const recentNotes = useQuery({
    queryKey: queryKeys.coaching.journal(3),
    queryFn: () => getJournalEntries(userId, 3),
    enabled: !!userId,
  });

  const isLoading =
    profile.isLoading ||
    activeProgram.isLoading ||
    todayNutrition.isLoading ||
    todayRecovery.isLoading ||
    todaySupplements.isLoading ||
    weeklyVolume.isLoading ||
    alerts.isLoading ||
    recentNotes.isLoading;

  return {
    profile: profile.data,
    activeProgram: activeProgram.data,
    todayNutrition: todayNutrition.data,
    todayRecovery: todayRecovery.data,
    todaySupplements: todaySupplements.data,
    weeklyVolume: weeklyVolume.data,
    alerts: alerts.data,
    recentNotes: recentNotes.data,
    isLoading,
    errors: {
      profile: profile.error,
      activeProgram: activeProgram.error,
      todayNutrition: todayNutrition.error,
      todayRecovery: todayRecovery.error,
      todaySupplements: todaySupplements.error,
      weeklyVolume: weeklyVolume.error,
      alerts: alerts.error,
      recentNotes: recentNotes.error,
    },
  };
}
