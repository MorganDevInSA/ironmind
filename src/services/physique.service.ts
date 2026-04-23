import type { CheckIn, Measurements } from '@/lib/types';
import {
  getDocument,
  setDocument,
  addDocument,
  queryDocuments,
  orderBy,
  limit,
  where,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import {
  uploadFile,
  generateFilePath,
  commitPendingStorageUpload,
  deleteFile,
  listPendingProgressPhotoPaths,
  deleteStoragePaths,
} from './storage.service';
import { withService } from '@/lib/errors';

const converter = createConverter<CheckIn>();

/** Default max rows returned for full check-in history lists. */
const DEFAULT_CHECK_IN_LIST_LIMIT = 500;

// Get check-in by date
export async function getCheckIn(userId: string, date: string): Promise<CheckIn | null> {
  return withService('physique', 'read check-in', () =>
    getDocument<CheckIn>(collections.checkIns(userId), date, converter),
  );
}

// Get all check-ins (bounded — use `getRecentCheckIns` or pass a higher `limitCount` if needed)
export async function getCheckIns(
  userId: string,
  limitCount: number = DEFAULT_CHECK_IN_LIST_LIMIT,
): Promise<CheckIn[]> {
  return withService('physique', 'read all check-ins', () =>
    queryDocuments<CheckIn>(
      collections.checkIns(userId),
      [orderBy('date', 'desc'), limit(limitCount)],
      converter,
    ),
  );
}

// Get recent check-ins
export async function getRecentCheckIns(
  userId: string,
  limitCount: number = 10,
): Promise<CheckIn[]> {
  return withService('physique', 'read recent check-ins', () =>
    queryDocuments<CheckIn>(
      collections.checkIns(userId),
      [orderBy('date', 'desc'), limit(limitCount)],
      converter,
    ),
  );
}

// Save check-in
export async function saveCheckIn(
  userId: string,
  date: string,
  checkIn: Partial<CheckIn>,
): Promise<void> {
  return withService('physique', 'save check-in', () => {
    if (!userId) throw new Error('Cannot save check-in without a signed-in user');

    const merged = {
      ...checkIn,
      date,
      measurements: checkIn.measurements ?? {},
    };
    return setDocument<CheckIn>(collections.checkIns(userId), date, merged as CheckIn, converter);
  });
}

// Create new check-in
export async function createCheckIn(userId: string, checkIn: Omit<CheckIn, 'id'>): Promise<string> {
  return withService('physique', 'create check-in', () =>
    addDocument<CheckIn>(collections.checkIns(userId), checkIn as CheckIn, converter),
  );
}

// Get weight trend over time
export async function getWeightTrend(
  userId: string,
  days: number = 30,
): Promise<{ date: string; weight: number; avg7Day?: number }[]> {
  return withService('physique', 'read weight trend', async () => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromStr = fromDate.toISOString().split('T')[0];

    const checkIns = await queryDocuments<CheckIn>(
      collections.checkIns(userId),
      [where('date', '>=', fromStr), orderBy('date', 'desc'), limit(Math.max(days * 4, 120))],
      converter,
    );

    const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));

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
  });
}

// Get latest check-in
export async function getLatestCheckIn(userId: string): Promise<CheckIn | null> {
  return withService('physique', 'read latest check-in', async () => {
    const checkIns = await queryDocuments<CheckIn>(
      collections.checkIns(userId),
      [orderBy('date', 'desc'), limit(1)],
      converter,
    );
    return checkIns[0] || null;
  });
}

// Get weight change from last check-in
export async function getWeightChange(userId: string): Promise<{
  current: number;
  previous: number;
  change: number;
}> {
  return withService('physique', 'calculate weight change', async () => {
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
  });
}

// Upload progress photo
// Requires NEXT_PUBLIC_ENABLE_PHOTO_UPLOAD=true and Firebase Storage (Blaze plan).
/** List Storage object full paths under `users/{uid}/photos/pending/` (orphan hygiene). */
export async function listOrphanPendingProgressPhotos(userId: string): Promise<string[]> {
  return withService('physique', 'list pending progress photos', () =>
    listPendingProgressPhotoPaths(userId),
  );
}

/**
 * Delete pending progress photo objects. When `paths` is omitted, deletes **all** pending under the user.
 * Returns how many objects were removed.
 */
export async function deletePendingProgressPhotos(
  userId: string,
  paths?: string[],
): Promise<number> {
  return withService('physique', 'delete pending progress photos', async () => {
    const toDelete = paths?.length ? paths : await listPendingProgressPhotoPaths(userId);
    if (!toDelete.length) return 0;
    await deleteStoragePaths(toDelete);
    return toDelete.length;
  });
}

export async function uploadProgressPhoto(userId: string, file: File): Promise<string> {
  return withService('physique', 'upload progress photo', async () => {
    if (process.env.NEXT_PUBLIC_ENABLE_PHOTO_UPLOAD !== 'true') {
      throw new Error(
        'Photo uploads are disabled. Set NEXT_PUBLIC_ENABLE_PHOTO_UPLOAD=true in .env.local after initialising Firebase Storage.',
      );
    }
    const pendingPath = generateFilePath(userId, 'photos/pending', file.name);
    const finalPath = generateFilePath(userId, 'photos', file.name);
    const meta = { contentType: file.type };
    try {
      await uploadFile(pendingPath, file, meta);
      return await commitPendingStorageUpload({
        pendingPath,
        finalPath,
        contentType: file.type,
      });
    } catch (e) {
      await deleteFile(pendingPath).catch(() => {});
      throw e;
    }
  });
}

// Get measurements history for a specific measurement type
export async function getMeasurementHistory(
  userId: string,
  measurementKey: keyof Measurements,
  days: number = 90,
): Promise<{ date: string; value: number }[]> {
  return withService('physique', 'read measurement history', async () => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const fromStr = fromDate.toISOString().split('T')[0];

    const checkIns = await queryDocuments<CheckIn>(
      collections.checkIns(userId),
      [where('date', '>=', fromStr), orderBy('date', 'desc'), limit(Math.max(days * 4, 200))],
      converter,
    );

    return checkIns
      .filter((c) => c.measurements[measurementKey] !== undefined)
      .map((c) => ({
        date: c.date,
        value: c.measurements[measurementKey]!,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  });
}

// Check if weight has dropped for consecutive check-ins
export async function checkConsecutiveWeightDrops(
  userId: string,
  daysToCheck: number = 2,
): Promise<boolean> {
  return withService('physique', 'check weight drops', async () => {
    const checkIns = await getRecentCheckIns(userId, daysToCheck + 1);

    if (checkIns.length < daysToCheck) {
      return false;
    }

    for (let i = 0; i < checkIns.length - 1; i++) {
      if (checkIns[i].bodyweight >= checkIns[i + 1].bodyweight) {
        return false;
      }
    }

    return true;
  });
}

// Get body composition summary
export async function getBodyCompositionSummary(userId: string): Promise<{
  currentWeight: number;
  targetWeight: number;
  weeksRemaining: number;
  weeklyChange: number;
}> {
  return withService('physique', 'calculate body composition', async () => {
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

    let weeklyChange = 0;
    if (checkIns.length >= 2) {
      const oldest = checkIns[checkIns.length - 1];
      const newest = checkIns[0];
      const daysDiff = Math.ceil(
        (new Date(newest.date).getTime() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24),
      );
      const weeks = daysDiff / 7 || 1;
      weeklyChange = (newest.bodyweight - oldest.bodyweight) / weeks;
    }

    const weeksRemaining =
      weeklyChange > 0 ? Math.ceil(weightDiff / weeklyChange) : weightDiff > 0 ? Infinity : 0;

    return {
      currentWeight,
      targetWeight,
      weeksRemaining: weeksRemaining === Infinity ? 999 : weeksRemaining,
      weeklyChange: Number(weeklyChange.toFixed(2)),
    };
  });
}
