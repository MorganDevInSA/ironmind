import type { CheckIn } from '@/lib/types';

/** Stable chronological order for charts (ISO `date` yyyy-MM-dd). */
export function sortCheckInsChronologicalAsc(checkIns: readonly CheckIn[]): CheckIn[] {
  return [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
}
