'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getVolumeLandmarks, getWeeklyVolumeSummary, getVolumeTrend } from '@/services';

export function useVolumeLandmarks(userId: string) {
  return useQuery({
    queryKey: queryKeys.volume.landmarks(),
    queryFn: () => getVolumeLandmarks(userId),
    staleTime: staleTimes.landmarks,
    enabled: !!userId,
  });
}

export function useWeeklyVolumeSummary(userId: string) {
  return useQuery({
    queryKey: queryKeys.volume.weekly(),
    queryFn: () => getWeeklyVolumeSummary(userId),
    staleTime: staleTimes.weeklyVolume,
    enabled: !!userId,
  });
}

export function useVolumeTrend(userId: string, muscleGroup: string, weeks: number = 4) {
  return useQuery({
    queryKey: [...queryKeys.volume.all, 'trend', muscleGroup, weeks],
    queryFn: () => getVolumeTrend(userId, muscleGroup, weeks),
    staleTime: staleTimes.weeklyVolume,
    enabled: !!userId && !!muscleGroup,
  });
}
