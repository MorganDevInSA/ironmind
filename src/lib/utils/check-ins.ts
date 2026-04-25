import type { CheckIn } from '@/lib/types';
import { toDateOnlyKey } from '@/lib/utils/dates';

/** Stable chronological order for charts (ISO `date` yyyy-MM-dd). */
export function sortCheckInsChronologicalAsc(checkIns: readonly CheckIn[]): CheckIn[] {
  return [...checkIns].sort((a, b) => toDateOnlyKey(a.date).localeCompare(toDateOnlyKey(b.date)));
}
