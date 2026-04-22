import type { RecoveryEntry } from '@/lib/types';
import {
  getDocument,
  setDocument,
  queryDocuments,
  where,
  orderBy,
  limit,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { calculateReadinessScore } from '@/lib/utils/calculations';

const converter = createConverter<RecoveryEntry>();

// Get recovery entry for a date
export async function getRecoveryEntry(
  userId: string,
  date: string
): Promise<RecoveryEntry | null> {
  return getDocument<RecoveryEntry>(
    collections.recoveryEntries(userId),
    date,
    converter
  );
}

// Save recovery entry with calculated readiness score
export async function saveRecoveryEntry(
  userId: string,
  date: string,
  entry: Partial<RecoveryEntry>
): Promise<void> {
  // Calculate readiness score if all required fields are present
  let readinessScore: number | undefined;
  if (
    entry.sleepHours !== undefined &&
    entry.sleepQuality !== undefined &&
    entry.hrv !== undefined &&
    entry.mood !== undefined &&
    entry.stress !== undefined &&
    entry.energy !== undefined &&
    entry.doms !== undefined
  ) {
    readinessScore = calculateReadinessScore(entry as RecoveryEntry);
  }

  await setDocument<RecoveryEntry>(
    collections.recoveryEntries(userId),
    date,
    {
      ...entry,
      date,
      readinessScore: readinessScore ?? entry.readinessScore ?? 0,
    } as RecoveryEntry,
    converter
  );
}

// Get recovery entries for date range
export async function getRecoveryEntries(
  userId: string,
  dateRange: { from: string; to: string }
): Promise<RecoveryEntry[]> {
  return queryDocuments<RecoveryEntry>(
    collections.recoveryEntries(userId),
    [
      where('date', '>=', dateRange.from),
      where('date', '<=', dateRange.to),
      orderBy('date', 'desc'),
    ],
    converter
  );
}

// Get recent recovery entries
export async function getRecentRecoveryEntries(
  userId: string,
  days: number = 14
): Promise<RecoveryEntry[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  return queryDocuments<RecoveryEntry>(
    collections.recoveryEntries(userId),
    [
      where('date', '>=', fromDate.toISOString().split('T')[0]),
      orderBy('date', 'desc'),
    ],
    converter
  );
}

// Get latest recovery entry
export async function getLatestRecoveryEntry(
  userId: string
): Promise<RecoveryEntry | null> {
  const entries = await queryDocuments<RecoveryEntry>(
    collections.recoveryEntries(userId),
    [orderBy('date', 'desc'), limit(1)],
    converter
  );
  return entries[0] || null;
}

// Get average readiness score over period
export async function getAverageReadiness(
  userId: string,
  days: number = 7
): Promise<{ average: number; trend: 'improving' | 'stable' | 'declining' }> {
  const entries = await getRecentRecoveryEntries(userId, days);

  if (entries.length === 0) {
    return { average: 0, trend: 'stable' };
  }

  const scores = entries.map(e => e.readinessScore).filter(s => s > 0);
  const average = scores.reduce((a, b) => a + b, 0) / scores.length;

  // Calculate trend
  const { calculateTrend } = await import('@/lib/utils/calculations');
  const trend = calculateTrend(scores.reverse()); // Reverse to chronological order

  return { average: Math.round(average), trend };
}

/** @deprecated Pelvic comfort removed from UI — kept for historical data */
export async function getPelvicComfortFlags(
  userId: string,
  days: number = 14
): Promise<{ date: string; score: number }[]> {
  const entries = await getRecentRecoveryEntries(userId, days);

  return entries
    .filter(e => e.pelvicComfort != null && e.pelvicComfort <= 2)
    .map(e => ({ date: e.date, score: e.pelvicComfort! }));
}

// Check if today has a recovery entry
export async function hasTodayRecoveryEntry(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const entry = await getRecoveryEntry(userId, today);
  return entry !== null;
}

// Update cardio session in recovery entry
export async function updateCardioSession(
  userId: string,
  date: string,
  cardioSession: RecoveryEntry['cardioSession']
): Promise<void> {
  const entry = await getRecoveryEntry(userId, date);

  if (entry) {
    await saveRecoveryEntry(userId, date, { cardioSession });
  } else {
    await saveRecoveryEntry(userId, date, {
      date,
      sleepHours: 0,
      sleepQuality: 0,
      hrv: 0,
      mood: 0,
      stress: 0,
      energy: 0,
      doms: 0,
      readinessScore: 0,
      cardioSession,
    });
  }
}

// Update breath work in recovery entry
export async function updateBreathWork(
  userId: string,
  date: string,
  breathWork: RecoveryEntry['breathWork']
): Promise<void> {
  const entry = await getRecoveryEntry(userId, date);

  if (entry) {
    await saveRecoveryEntry(userId, date, { breathWork });
  } else {
    await saveRecoveryEntry(userId, date, {
      date,
      sleepHours: 0,
      sleepQuality: 0,
      hrv: 0,
      mood: 0,
      stress: 0,
      energy: 0,
      doms: 0,
      readinessScore: 0,
      breathWork,
    });
  }
}

// Update core work in recovery entry
export async function updateCoreWork(
  userId: string,
  date: string,
  coreWork: RecoveryEntry['coreWork']
): Promise<void> {
  const entry = await getRecoveryEntry(userId, date);

  if (entry) {
    await saveRecoveryEntry(userId, date, { coreWork });
  } else {
    await saveRecoveryEntry(userId, date, {
      date,
      sleepHours: 0,
      sleepQuality: 0,
      hrv: 0,
      mood: 0,
      stress: 0,
      energy: 0,
      doms: 0,
      readinessScore: 0,
      coreWork,
    });
  }
}
