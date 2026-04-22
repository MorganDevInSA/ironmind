'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importCoachData, type ParsedCoachData, type ImportResult } from '@/services/import.service';
import { seedUserData } from '@/lib/seed';
import { onMutationError } from './_shared/on-error';

export function useImportCoachData(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<ImportResult, Error, { data: ParsedCoachData; force?: boolean }>({
    mutationFn: ({ data, force }) => importCoachData(userId, data, force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userId] });
    },
    onError: onMutationError,
  });
}

export function useSeedDemoData(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error>({
    mutationFn: () => seedUserData(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userId] });
    },
    onError: onMutationError,
  });
}
