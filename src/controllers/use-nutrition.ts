'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import {
  getNutritionDay,
  saveNutritionDay,
  getNutritionHistory,
  getRecentNutritionDays,
  getNutritionPlan,
} from '@/services';
import type { NutritionDay } from '@/lib/types';
import { onMutationError } from './_shared/on-error';
import { invalidateDashboardBundle } from './_shared/invalidate-dashboard';

export function useNutritionDay(userId: string, date: string) {
  return useQuery({
    queryKey: queryKeys(userId).nutrition.day(date),
    queryFn: () => getNutritionDay(userId, date),
    staleTime: staleTimes.nutritionDay,
    enabled: !!userId && !!date,
  });
}

export function useNutritionHistory(userId: string, dateRange: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys(userId).nutrition.history(dateRange),
    queryFn: () => getNutritionHistory(userId, dateRange),
    staleTime: staleTimes.nutritionHistory,
    enabled: !!userId,
  });
}

export function useRecentNutritionDays(userId: string, days: number = 14) {
  return useQuery({
    queryKey: queryKeys(userId).nutrition.recentDays(days),
    queryFn: () => getRecentNutritionDays(userId, days),
    staleTime: staleTimes.nutritionHistory,
    enabled: !!userId,
  });
}

export function useNutritionPlan(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).nutrition.plan(),
    queryFn: () => getNutritionPlan(userId),
    staleTime: staleTimes.macroTargets,
    enabled: !!userId,
  });
}

function mergeNutritionDayCache(
  prev: NutritionDay | null | undefined,
  date: string,
  data: Partial<NutritionDay>,
): NutritionDay | null | undefined {
  if (prev) {
    return { ...prev, ...data, date } as NutritionDay;
  }
  if (
    data.meals != null &&
    data.dayType != null &&
    data.macroTargets != null &&
    data.macroActuals != null &&
    data.complianceScore != null
  ) {
    return {
      ...data,
      date,
      id: data.id ?? date,
    } as NutritionDay;
  }
  return prev;
}

export function useSaveNutritionDay(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, data }: { date: string; data: Partial<NutritionDay> }) =>
      saveNutritionDay(userId, date, data),
    onSuccess: (_, { date, data }) => {
      const dayKey = queryKeys(userId).nutrition.day(date);
      queryClient.setQueryData<NutritionDay | null | undefined>(dayKey, (prev) =>
        mergeNutritionDayCache(prev, date, data),
      );
      void queryClient.invalidateQueries({ queryKey: dayKey });
      void queryClient.invalidateQueries({ queryKey: queryKeys(userId).nutrition.all });
      invalidateDashboardBundle(queryClient, userId);
    },
    onError: onMutationError,
  });
}
