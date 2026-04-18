'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getRecoveryEntry, saveRecoveryEntry, getRecentRecoveryEntries, getAverageReadiness } from '@/services';
import type { RecoveryEntry } from '@/lib/types';

export function useRecoveryEntry(userId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.recovery.entry(date),
    queryFn: () => getRecoveryEntry(userId, date),
    staleTime: staleTimes.recovery,
    enabled: !!userId && !!date,
  });
}

export function useRecentRecoveryEntries(userId: string, days: number = 14) {
  return useQuery({
    queryKey: queryKeys.recovery.trend(days),
    queryFn: () => getRecentRecoveryEntries(userId, days),
    staleTime: staleTimes.recoveryTrend,
    enabled: !!userId,
  });
}

export function useAverageReadiness(userId: string, days: number = 7) {
  return useQuery({
    queryKey: queryKeys.recovery.all,
    queryFn: () => getAverageReadiness(userId, days),
    staleTime: staleTimes.recoveryTrend,
    enabled: !!userId,
  });
}

export function useSaveRecoveryEntry(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, entry }: { date: string; entry: Partial<RecoveryEntry> }) =>
      saveRecoveryEntry(userId, date, entry),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recovery.entry(date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recovery.latest() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recovery.all });
    },
  });
}
