'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getNutritionDay, saveNutritionDay, getNutritionHistory, getRecentNutritionDays, getNutritionPlan } from '@/services';
import type { NutritionDay } from '@/lib/types';

export function useNutritionDay(userId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.nutrition.day(date),
    queryFn: () => getNutritionDay(userId, date),
    staleTime: staleTimes.nutritionDay,
    enabled: !!userId && !!date,
  });
}

export function useNutritionHistory(userId: string, dateRange: { from: string; to: string }) {
  return useQuery({
    queryKey: queryKeys.nutrition.history(dateRange),
    queryFn: () => getNutritionHistory(userId, dateRange),
    staleTime: staleTimes.nutritionHistory,
    enabled: !!userId,
  });
}

export function useRecentNutritionDays(userId: string, days: number = 14) {
  return useQuery({
    queryKey: queryKeys.nutrition.all,
    queryFn: () => getRecentNutritionDays(userId, days),
    staleTime: staleTimes.nutritionHistory,
    enabled: !!userId,
  });
}

export function useNutritionPlan(userId: string) {
  return useQuery({
    queryKey: queryKeys.nutrition.plan(),
    queryFn: () => getNutritionPlan(userId),
    staleTime: staleTimes.nutritionHistory,
    enabled: !!userId,
  });
}

export function useSaveNutritionDay(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ date, data }: { date: string; data: Partial<NutritionDay> }) =>
      saveNutritionDay(userId, date, data),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.day(date) });
      queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.all });
    },
  });
}
