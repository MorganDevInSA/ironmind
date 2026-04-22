'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { generateSummary } from '@/lib/export';
import type { ExportOptions } from '@/lib/types';

export function useExportSummary(userId: string, options: ExportOptions) {
  const queryClient = useQueryClient();
  
  return useQuery({
    queryKey: queryKeys(userId).export.summary(options),
    queryFn: () => generateSummary(userId, options, queryClient),
    staleTime: staleTimes.exportSummary,
    enabled: !!userId,
  });
}
