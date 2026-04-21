'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getActiveAlerts, getAlertSummary } from '@/services';

export function useActiveAlerts(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).alerts.active(),
    queryFn: () => getActiveAlerts(userId),
    staleTime: staleTimes.alerts,
    enabled: !!userId,
  });
}

export function useAlertSummary(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).alerts.summary(),
    queryFn: () => getAlertSummary(userId),
    staleTime: staleTimes.alerts,
    enabled: !!userId,
  });
}
