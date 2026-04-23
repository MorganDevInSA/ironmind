'use client';

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants';

/**
 * Invalidate the composite dashboard bundle and **alerts** (`useActiveAlerts` in the shell).
 * Alerts are recomputed inside `getDashboardBundle`, but the top bar subscribes to a separate
 * `queryKeys(userId).alerts.active()` tree — invalidate both so UI stays aligned after mutations.
 */
export function invalidateDashboardBundle(queryClient: QueryClient, userId: string): void {
  void queryClient.invalidateQueries({ queryKey: [userId, 'dashboard'] });
  void queryClient.invalidateQueries({ queryKey: queryKeys(userId).alerts.all });
}
