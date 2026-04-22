'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import {
  getProfile,
  getActiveProgram,
  getNutritionDay,
  getRecoveryEntry,
  getLatestRecoveryEntry,
  getSupplementLog,
  getWeeklyVolumeSummary,
  getActiveAlerts,
} from '@/services';
import { today } from '@/lib/utils';

// Composite hook that reads from multiple cache keys
// If the user has already visited training/nutrition/recovery pages,
// the dashboard renders instantly from cache with zero Firebase calls
export function useDashboardData(userId: string) {
  const todayStr = today();
  const qk = queryKeys(userId);

  const profile = useQuery({
    queryKey: qk.profile.detail(),
    queryFn: () => getProfile(userId),
    staleTime: staleTimes.profile,
    enabled: !!userId,
  });

  const activeProgram = useQuery({
    queryKey: qk.training.activeProgram(),
    queryFn: () => getActiveProgram(userId),
    staleTime: staleTimes.activeProgram,
    enabled: !!userId,
  });

  const todayNutrition = useQuery({
    queryKey: qk.nutrition.day(todayStr),
    queryFn: () => getNutritionDay(userId, todayStr),
    staleTime: staleTimes.nutritionDay,
    enabled: !!userId,
  });

  const todayRecovery = useQuery({
    queryKey: qk.recovery.entry(todayStr),
    queryFn: () => getRecoveryEntry(userId, todayStr),
    staleTime: staleTimes.recovery,
    enabled: !!userId,
  });

  const latestRecovery = useQuery({
    queryKey: qk.recovery.latest(),
    queryFn: () => getLatestRecoveryEntry(userId),
    staleTime: staleTimes.recovery,
    enabled: !!userId,
  });

  const todaySupplements = useQuery({
    queryKey: qk.supplements.log(todayStr),
    queryFn: () => getSupplementLog(userId, todayStr),
    staleTime: staleTimes.supplementLog,
    enabled: !!userId,
  });

  const weeklyVolume = useQuery({
    queryKey: qk.volume.weekly(),
    queryFn: () => getWeeklyVolumeSummary(userId),
    staleTime: staleTimes.weeklyVolume,
    enabled: !!userId && !!activeProgram.data,
  });

  const alerts = useQuery({
    queryKey: qk.alerts.active(),
    queryFn: () => getActiveAlerts(userId),
    staleTime: staleTimes.alerts,
    enabled: !!userId,
  });

  const isLoading =
    profile.isLoading ||
    activeProgram.isLoading ||
    todayNutrition.isLoading ||
    todayRecovery.isLoading ||
    latestRecovery.isLoading ||
    todaySupplements.isLoading ||
    weeklyVolume.isLoading ||
    alerts.isLoading;

  return {
    profile: profile.data,
    activeProgram: activeProgram.data,
    todayNutrition: todayNutrition.data,
    todayRecovery: todayRecovery.data,
    latestRecovery: latestRecovery.data,
    todaySupplements: todaySupplements.data,
    weeklyVolume: weeklyVolume.data,
    alerts: alerts.data,
    isLoading,
    errors: {
      profile: profile.error,
      activeProgram: activeProgram.error,
      todayNutrition: todayNutrition.error,
      todayRecovery: todayRecovery.error,
      latestRecovery: latestRecovery.error,
      todaySupplements: todaySupplements.error,
      weeklyVolume: weeklyVolume.error,
      alerts: alerts.error,
    },
  };
}
