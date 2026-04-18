'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getPhases, getActivePhase, getJournalEntries, createJournalEntry, updateJournalEntry } from '@/services';
import type { JournalEntry } from '@/lib/types';

export function usePhases(userId: string) {
  return useQuery({
    queryKey: queryKeys.coaching.phases(),
    queryFn: () => getPhases(userId),
    staleTime: staleTimes.phases,
    enabled: !!userId,
  });
}

export function useActivePhase(userId: string) {
  return useQuery({
    queryKey: queryKeys.coaching.phases(),
    queryFn: () => getActivePhase(userId),
    staleTime: staleTimes.phases,
    enabled: !!userId,
  });
}

export function useJournalEntries(userId: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys.coaching.journal(limit),
    queryFn: () => getJournalEntries(userId, limit),
    staleTime: staleTimes.journal,
    enabled: !!userId,
  });
}

export function useCreateJournalEntry(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (entry: Omit<JournalEntry, 'id'>) => createJournalEntry(userId, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coaching.all });
    },
  });
}

export function useUpdateJournalEntry(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, updates }: { entryId: string; updates: Partial<JournalEntry> }) =>
      updateJournalEntry(userId, entryId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coaching.all });
    },
  });
}
