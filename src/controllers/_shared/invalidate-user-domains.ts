'use client';

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants';
import { deleteCurrentWeekVolumeRollup } from '@/services';

/** Narrow invalidation after import/seed (avoids refetching unrelated query trees). */
export async function invalidatePostImportDomains(
  queryClient: QueryClient,
  userId: string,
): Promise<void> {
  void deleteCurrentWeekVolumeRollup(userId).catch(() => {});
  const k = queryKeys(userId);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: k.dashboard.all }),
    queryClient.invalidateQueries({ queryKey: k.profile.all }),
    queryClient.invalidateQueries({ queryKey: k.training.all }),
    queryClient.invalidateQueries({ queryKey: k.nutrition.all }),
    queryClient.invalidateQueries({ queryKey: k.recovery.all }),
    queryClient.invalidateQueries({ queryKey: k.supplements.all }),
    queryClient.invalidateQueries({ queryKey: k.coaching.all }),
    queryClient.invalidateQueries({ queryKey: k.volume.all }),
    queryClient.invalidateQueries({ queryKey: k.physique.all }),
    queryClient.invalidateQueries({ queryKey: k.alerts.all }),
    queryClient.invalidateQueries({ queryKey: k.export.all }),
  ]);
}
