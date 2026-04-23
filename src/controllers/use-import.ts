'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  importCoachData,
  type ParsedCoachData,
  type ImportResult,
} from '@/services/import.service';
import { seedUserData, type SeedUserDataResult } from '@/lib/seed';
import { onMutationError } from './_shared/on-error';
import { invalidatePostImportDomains } from './_shared/invalidate-user-domains';

export function useImportCoachData(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<ImportResult, Error, { data: ParsedCoachData; force?: boolean }>({
    mutationFn: ({ data, force }) => importCoachData(userId, data, force),
    onSuccess: () => {
      void invalidatePostImportDomains(queryClient, userId);
    },
    onError: onMutationError,
  });
}

export function useSeedDemoData(userId: string) {
  const queryClient = useQueryClient();

  return useMutation<SeedUserDataResult, Error>({
    mutationFn: () => seedUserData(userId),
    onSuccess: () => {
      void invalidatePostImportDomains(queryClient, userId);
    },
    onError: onMutationError,
  });
}
