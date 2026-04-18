'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/constants';
import { generateSummary } from '@/lib/export';
import type { ExportOptions } from '@/lib/types';

export function useExportSummary(userId: string, options: ExportOptions) {
  return useQuery({
    queryKey: queryKeys.export.summary(options),
    queryFn: () => generateSummary(userId, options),
    staleTime: staleTimes.exportSummary,
    enabled: !!userId,
  });
}
