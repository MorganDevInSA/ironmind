'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getDashboardBundle } from '@/services/dashboard.service';
import { today } from '@/lib/utils';

/**
 * Single TanStack query for the main dashboard shell (Phase B).
 * Under the hood still issues parallel Firestore reads once per fetch, but:
 * - one cache key + one loading / error surface
 * - invalidation via `[userId, 'dashboard']` prefix
 */
export function useDashboardData(userId: string) {
  const todayStr = today();
  const qk = queryKeys(userId);

  const bundle = useQuery({
    queryKey: qk.dashboard.bundle(todayStr),
    queryFn: () => getDashboardBundle(userId, todayStr),
    staleTime: staleTimes.dashboardBundle,
    enabled: !!userId,
  });

  const data = bundle.data;
  const err = bundle.error;

  const isLoading = bundle.isLoading;

  return {
    profile: data?.profile,
    activeProgram: data?.activeProgram,
    todayNutrition: data?.todayNutrition,
    todayRecovery: data?.todayRecovery,
    latestRecovery: data?.latestRecovery,
    todaySupplements: data?.todaySupplements,
    weeklyVolume: data?.weeklyVolume,
    alerts: data?.alerts,
    isLoading,
    errors: {
      profile: err,
      activeProgram: err,
      todayNutrition: err,
      todayRecovery: err,
      latestRecovery: err,
      todaySupplements: err,
      weeklyVolume: err,
      alerts: err,
    },
  };
}
