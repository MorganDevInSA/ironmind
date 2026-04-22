'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getActiveAlerts, summarizeAlerts } from '@/services';

export function useActiveAlerts(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).alerts.active(),
    queryFn: () => getActiveAlerts(userId),
    staleTime: staleTimes.alerts,
    enabled: !!userId,
  });
}

/** Derived — zero extra fetches. Reads from the active alerts cache. */
export function useAlertSummary(userId: string) {
  const query = useActiveAlerts(userId);
  return {
    ...query,
    data: query.data ? summarizeAlerts(query.data) : undefined,
  };
}
