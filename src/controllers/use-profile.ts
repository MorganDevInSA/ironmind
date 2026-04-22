'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getProfile, updateProfile, isUserSeeded } from '@/services';
import type { AthleteProfile } from '@/lib/types';
import { onMutationError } from './_shared/on-error';

export function useProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).profile.detail(),
    queryFn: () => getProfile(userId),
    staleTime: staleTimes.profile,
    enabled: !!userId,
  });
}

export function useUpdateProfile(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<AthleteProfile>) => updateProfile(userId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).profile.all });
    },
    onError: onMutationError,
  });
}

/** Firestore user doc has completed initial seed/import */
export function useIsUserSeeded(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys(userId).profile.isSeeded(),
    queryFn: () => isUserSeeded(userId),
    enabled: !!userId && (options?.enabled ?? true),
    staleTime: 30 * 1000,
  });
}
