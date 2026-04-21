'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getCheckIns, getRecentCheckIns, saveCheckIn, getWeightTrend, getLatestCheckIn } from '@/services';
import type { CheckIn } from '@/lib/types';

export function useCheckIns(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).physique.checkIns(),
    queryFn: () => getCheckIns(userId),
    staleTime: staleTimes.checkIns,
    enabled: !!userId,
  });
}

export function useRecentCheckIns(userId: string, limit: number = 10) {
  return useQuery({
    queryKey: queryKeys(userId).physique.recentCheckIns(limit),
    queryFn: () => getRecentCheckIns(userId, limit),
    staleTime: staleTimes.checkIns,
    enabled: !!userId,
  });
}

export function useWeightTrend(userId: string, days: number = 30) {
  return useQuery({
    queryKey: queryKeys(userId).physique.weightTrend(days),
    queryFn: () => getWeightTrend(userId, days),
    staleTime: staleTimes.weightTrend,
    enabled: !!userId,
  });
}

export function useLatestCheckIn(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).physique.latestCheckIn(),
    queryFn: () => getLatestCheckIn(userId),
    staleTime: staleTimes.checkIns,
    enabled: !!userId,
  });
}

export function useSaveCheckIn(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, checkIn }: { date: string; checkIn: Partial<CheckIn> }) =>
      saveCheckIn(userId, date, checkIn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).physique.all });
    },
  });
}
