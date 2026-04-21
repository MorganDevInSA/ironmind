'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { getActivePhase, getJournalEntries, createJournalEntry } from '@/services';
import type { JournalEntry } from '@/lib/types';

export function useActivePhase(userId: string) {
  return useQuery({
    queryKey: queryKeys(userId).coaching.activePhase(),
    queryFn: () => getActivePhase(userId),
    staleTime: staleTimes.phases,
    enabled: !!userId,
  });
}

export function useJournalEntries(userId: string, limit?: number) {
  return useQuery({
    queryKey: queryKeys(userId).coaching.journal(limit),
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
      queryClient.invalidateQueries({ queryKey: queryKeys(userId).coaching.all });
    },
  });
}
