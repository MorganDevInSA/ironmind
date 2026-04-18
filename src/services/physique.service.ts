import type { CheckIn, Measurements } from '@/lib/types';
import {
  getDocument,
  setDocument,
  addDocument,
  queryDocuments,
  orderBy,
  limit,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { uploadFile, generateFilePath } from './storage.service';

const converter = createConverter<CheckIn>();

/** Firestore rejects `undefined`; strip recursively so partial check-ins merge cleanly. */
function stripUndefinedDeep(value: unknown): unknown {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(stripUndefinedDeep).filter(v => v !== undefined);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const next = stripUndefinedDeep(v);
    if (next !== undefined) out[k] = next;
  }
  return out;
}

// Get check-in by date
export async function getCheckIn(
  userId: string,
  date: string
): Promise<CheckIn | null> {
  return getDocument<CheckIn>(
    collections.checkIns(userId),
    date,
    converter
  );
}

// Get all check-ins
export async function getCheckIns(userId: string): Promise<CheckIn[]> {
  return queryDocuments<CheckIn>(
    collections.checkIns(userId),
    [orderBy('date', 'desc')],
    converter
  );
}

// Get recent check-ins
export async function getRecentCheckIns(
  userId: string,
  limitCount: number = 10
): Promise<CheckIn[]> {
  return queryDocuments<CheckIn>(
    collections.checkIns(userId),
    [orderBy('date', 'desc'), limit(limitCount)],
    converter
  );
}

// Save check-in
export async function saveCheckIn(
  userId: string,
  date: string,
  checkIn: Partial<CheckIn>
): Promise<void> {
  if (!userId) throw new Error('Cannot save check-in without a signed-in user');

  const merged = stripUndefinedDeep({
    ...checkIn,
    date,
    measurements: checkIn.measurements ?? {},
  }) as Record<string, unknown>;
  await setDocument<CheckIn>(
    collections.checkIns(userId),
    date,
    merged as unknown as CheckIn,
    converter
  );
}

// Create new check-in
export async function createCheckIn(
  userId: string,
  checkIn: Omit<CheckIn, 'id'>
): Promise<string> {
  return addDocument<CheckIn>(
    collections.checkIns(userId),
    checkIn as CheckIn,
    converter
  );
}

// Get weight trend over time
export async function getWeightTrend(
  userId: string,
  days: number = 30
): Promise<{ date: string; weight: number; avg7Day?: number }[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const checkIns = await queryDocuments<CheckIn>(
    collections.checkIns(userId),
    [
      orderBy('date', 'desc'),
    ],
    converter
  );

  // Sort by date ascending for trend calculation
  const sorted = checkIns
    .filter(c => new Date(c.date) >= fromDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate 7-day rolling average
  return sorted.map((checkIn, index, array) => {
    const startIdx = Math.max(0, index - 6);
    const slice = array.slice(startIdx, index + 1);
    const avg7Day = slice.reduce((sum, c) => sum + c.bodyweight, 0) / slice.length;

    return {
      date: checkIn.date,
      weight: checkIn.bodyweight,
      avg7Day: slice.length >= 3 ? Number(avg7Day.toFixed(1)) : undefined,
    };
  });
}

// Get latest check-in
export async function getLatestCheckIn(userId: string): Promise<CheckIn | null> {
  const checkIns = await queryDocuments<CheckIn>(
    collections.checkIns(userId),
    [orderBy('date', 'desc'), limit(1)],
    converter
  );
  return checkIns[0] || null;
}

// Get weight change from last check-in
export async function getWeightChange(userId: string): Promise<{
  current: number;
  previous: number;
  change: number;
}> {
  const checkIns = await getRecentCheckIns(userId, 2);

  if (checkIns.length === 0) {
    return { current: 0, previous: 0, change: 0 };
  }

  if (checkIns.length === 1) {
    return { current: checkIns[0].bodyweight, previous: checkIns[0].bodyweight, change: 0 };
  }

  const current = checkIns[0].bodyweight;
  const previous = checkIns[1].bodyweight;

  return {
    current,
    previous,
    change: Number((current - previous).toFixed(1)),
  };
}

// Upload progress photo
export async function uploadProgressPhoto(
  userId: string,
  file: File
): Promise<string> {
  const path = generateFilePath(userId, 'photos', file.name);
  return uploadFile(path, file, { contentType: file.type });
}

// Get measurements history for a specific measurement type
export async function getMeasurementHistory(
  userId: string,
  measurementKey: keyof Measurements,
  days: number = 90
): Promise<{ date: string; value: number }[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const checkIns = await queryDocuments<CheckIn>(
    collections.checkIns(userId),
    [
      orderBy('date', 'desc'),
    ],
    converter
  );

  return checkIns
    .filter(c => new Date(c.date) >= fromDate && c.measurements[measurementKey] !== undefined)
    .map(c => ({
      date: c.date,
      value: c.measurements[measurementKey]!,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Check if weight has dropped for consecutive check-ins
export async function checkConsecutiveWeightDrops(
  userId: string,
  daysToCheck: number = 2
): Promise<boolean> {
  const checkIns = await getRecentCheckIns(userId, daysToCheck + 1);

  if (checkIns.length < daysToCheck) {
    return false;
  }

  // Check if each consecutive check-in is lower
  for (let i = 0; i < checkIns.length - 1; i++) {
    if (checkIns[i].bodyweight >= checkIns[i + 1].bodyweight) {
      return false;
    }
  }

  return true;
}

// Get body composition summary
export async function getBodyCompositionSummary(userId: string): Promise<{
  currentWeight: number;
  targetWeight: number;
  weeksRemaining: number;
  weeklyChange: number;
}> {
  const { getProfile } = await import('./profile.service');

  const [checkIns, profile] = await Promise.all([
    getRecentCheckIns(userId, 4),
    getProfile(userId),
  ]);

  if (!profile || checkIns.length === 0) {
    return { currentWeight: 0, targetWeight: 0, weeksRemaining: 0, weeklyChange: 0 };
  }

  const currentWeight = checkIns[0].bodyweight;
  const targetWeight = profile.targetWeight;
  const weightDiff = targetWeight - currentWeight;

  // Calculate weekly change
  let weeklyChange = 0;
  if (checkIns.length >= 2) {
    const oldest = checkIns[checkIns.length - 1];
    const newest = checkIns[0];
    const daysDiff = Math.ceil(
      (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24)
    );
    const weeks = daysDiff / 7 || 1;
    weeklyChange = (newest.bodyweight - oldest.bodyweight) / weeks;
  }

  // Estimate weeks remaining at current rate
  const weeksRemaining = weeklyChange > 0
    ? Math.ceil(weightDiff / weeklyChange)
    : weightDiff > 0 ? Infinity : 0;

  return {
    currentWeight,
    targetWeight,
    weeksRemaining: weeksRemaining === Infinity ? 999 : weeksRemaining,
    weeklyChange: Number(weeklyChange.toFixed(2)),
  };
}
