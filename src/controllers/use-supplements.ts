'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import {
  getProtocol,
  getSupplementLog,
  toggleSupplement,
  getSupplementCompliance,
} from '@/services';
import { onMutationError } from './_shared/on-error';
import { invalidateDashboardBundle } from './_shared/invalidate-dashboard';

export function useProtocol(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).supplements.protocol(),
    queryFn: () => getProtocol(userId),
    staleTime: staleTimes.protocol,
    enabled: !!userId,
  });
}

export function useSupplementLog(userId: string, date: string) {
  return useQuery({
    queryKey: queryKeys(userId).supplements.log(date),
    queryFn: () => getSupplementLog(userId, date),
    staleTime: staleTimes.supplementLog,
    enabled: !!userId && !!date,
  });
}

export function useSupplementCompliance(userId: string, days: number = 14) {
  return useQuery({
    queryKey: queryKeys(userId).supplements.compliance(days),
    queryFn: () => getSupplementCompliance(userId, days),
    staleTime: staleTimes.supplementCompliance,
    enabled: !!userId,
  });
}

export function useToggleSupplement(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      date,
      window,
      supplement,
    }: {
      date: string;
      window: string;
      supplement: string;
    }) => toggleSupplement(userId, date, window, supplement),
    onSuccess: (_, { date }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).supplements.log(date) });
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).supplements.all });
      invalidateDashboardBundle(queryClient, userId);
    },
    onError: onMutationError,
  });
}
