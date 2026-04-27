'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clearCoachDemoOverlay } from '@/services/demo-clear.service';
import { onMutationError } from './_shared/on-error';
import { invalidatePostImportDomains } from './_shared/invalidate-user-domains';

export function useClearCoachDemoOverlay(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clearCoachDemoOverlay(userId),
    onSuccess: () => {
      void invalidatePostImportDomains(queryClient, userId);
    },
    onError: onMutationError,
  });
}
