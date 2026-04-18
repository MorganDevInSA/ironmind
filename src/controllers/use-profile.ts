'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getProfile, updateProfile, isUserSeeded } from '@/services';
import type { AthleteProfile } from '@/lib/types';

export function useProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.profile.detail(),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
    },
  });
}

/** Firestore user doc has completed initial seed/import */
export function useIsUserSeeded(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...queryKeys.profile.all, 'isSeeded'] as const,
    queryFn: () => isUserSeeded(userId),
    enabled: !!userId && (options?.enabled ?? true),
    staleTime: 30 * 1000,
  });
}
