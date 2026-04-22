import type { SupplementProtocol, SupplementLog } from '@/lib/types';
import {
  getDocument,
  setDocument,
  queryDocuments,
  where,
  orderBy,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { withService } from '@/lib/errors';

const protocolConverter = createConverter<SupplementProtocol>();
const logConverter = createConverter<SupplementLog>();

// Get supplement protocol
export async function getProtocol(userId: string): Promise<SupplementProtocol | null> {
  return withService('supplements', 'read protocol', () =>
    getDocument<SupplementProtocol>(
      collections.supplementProtocol(userId),
      'current',
      protocolConverter
    )
  );
}

// Save supplement protocol
export async function saveProtocol(
  userId: string,
  protocol: SupplementProtocol
): Promise<void> {
  return withService('supplements', 'save protocol', () =>
    setDocument<SupplementProtocol>(
      collections.supplementProtocol(userId),
      'current',
      protocol,
      protocolConverter
    )
  );
}

// Get supplement log for a date
export async function getSupplementLog(
  userId: string,
  date: string
): Promise<SupplementLog | null> {
  return withService('supplements', 'read log', () =>
    getDocument<SupplementLog>(
      collections.supplementLogs(userId),
      date,
      logConverter
    )
  );
}

// Save supplement log
export async function saveSupplementLog(
  userId: string,
  date: string,
  log: Partial<SupplementLog>
): Promise<void> {
  return withService('supplements', 'save log', () => {
    const compliance = calculateSupplementCompliance(log as SupplementLog);

    return setDocument<SupplementLog>(
      collections.supplementLogs(userId),
      date,
      { ...log, date, compliancePercent: compliance } as SupplementLog,
      logConverter
    );
  });
}

// Toggle supplement taken status
export async function toggleSupplement(
  userId: string,
  date: string,
  window: string,
  supplement: string
): Promise<void> {
  return withService('supplements', 'toggle supplement', async () => {
    const log = await getSupplementLog(userId, date);

    const windows: Record<string, Record<string, boolean>> = {
      morning: log?.windows?.morning || {},
      lunch: log?.windows?.lunch || {},
      afternoon: log?.windows?.afternoon || {},
      dinner: log?.windows?.dinner || {},
      bed: log?.windows?.bed || {},
    };

    windows[window] = {
      ...windows[window],
      [supplement]: !windows[window][supplement],
    };

    const protocol = await getProtocol(userId);
    const totalSupplements = protocol
      ? protocol.windows.reduce((sum, w) => sum + w.supplements.length, 0)
      : 0;

    const takenSupplements = Object.values(windows).reduce(
      (sum, windowSupps) => sum + Object.values(windowSupps).filter(Boolean).length,
      0
    );

    const compliancePercent = totalSupplements > 0
      ? Math.round((takenSupplements / totalSupplements) * 100)
      : 0;

    await saveSupplementLog(userId, date, {
      date,
      windows,
      compliancePercent,
    });
  });
}

// Calculate compliance for a supplement log
function calculateSupplementCompliance(log: SupplementLog): number {
  if (!log.windows) return 0;

  const totalWindows = Object.keys(log.windows).length;
  if (totalWindows === 0) return 0;

  const completedWindows = Object.values(log.windows).filter(window =>
    Object.values(window).some(taken => taken)
  ).length;

  return Math.round((completedWindows / totalWindows) * 100);
}

// Get supplement compliance over time
export async function getSupplementCompliance(
  userId: string,
  days: number = 14
): Promise<{ date: string; compliance: number }[]> {
  return withService('supplements', 'read compliance history', async () => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const logs = await queryDocuments<SupplementLog>(
      collections.supplementLogs(userId),
      [
        where('date', '>=', fromDate.toISOString().split('T')[0]),
        orderBy('date', 'desc'),
      ],
      logConverter
    );

    return logs.map(log => ({
      date: log.date,
      compliance: log.compliancePercent,
    }));
  });
}

// Get average compliance over period
export async function getAverageCompliance(
  userId: string,
  days: number = 7
): Promise<number> {
  return withService('supplements', 'calculate average compliance', async () => {
    const compliance = await getSupplementCompliance(userId, days);

    if (compliance.length === 0) return 0;

    const average = compliance.reduce((sum, c) => sum + c.compliance, 0) / compliance.length;
    return Math.round(average);
  });
}

// Get most missed supplements
export async function getMostMissedSupplements(
  userId: string,
  days: number = 14
): Promise<{ supplement: string; missedCount: number }[]> {
  return withService('supplements', 'calculate most missed', async () => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const logs = await queryDocuments<SupplementLog>(
      collections.supplementLogs(userId),
      [
        where('date', '>=', fromDate.toISOString().split('T')[0]),
      ],
      logConverter
    );

    const protocol = await getProtocol(userId);
    if (!protocol) return [];

    const missedCounts: Record<string, number> = {};

    for (const window of protocol.windows) {
      for (const supplement of window.supplements) {
        missedCounts[supplement] = 0;

        for (const log of logs) {
          const windowLog = log.windows?.[window.timing] || {};
          if (!windowLog[supplement]) {
            missedCounts[supplement]++;
          }
        }
      }
    }

    return Object.entries(missedCounts)
      .filter(([, count]) => count > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([supplement, missedCount]) => ({ supplement, missedCount }));
  });
}

// Get most missed timing window
export async function getMostMissedWindow(
  userId: string,
  days: number = 14
): Promise<string | null> {
  return withService('supplements', 'find most missed window', async () => {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const logs = await queryDocuments<SupplementLog>(
      collections.supplementLogs(userId),
      [
        where('date', '>=', fromDate.toISOString().split('T')[0]),
      ],
      logConverter
    );

    const windowCounts: Record<string, number> = {
      morning: 0,
      lunch: 0,
      afternoon: 0,
      dinner: 0,
      bed: 0,
    };

    for (const log of logs) {
      for (const [window, supplements] of Object.entries(log.windows || {})) {
        const hasAny = Object.values(supplements).some(Boolean);
        if (!hasAny) {
          windowCounts[window]++;
        }
      }
    }

    const mostMissed = Object.entries(windowCounts).sort(([, a], [, b]) => b - a)[0];
    return mostMissed && mostMissed[1] > 0 ? mostMissed[0] : null;
  });
}

// Get supplement streak
export async function getSupplementStreak(userId: string): Promise<number> {
  return withService('supplements', 'calculate streak', async () => {
    const logs = await queryDocuments<SupplementLog>(
      collections.supplementLogs(userId),
      [orderBy('date', 'desc')],
      logConverter
    );

    let streak = 0;
    let currentDate = new Date();

    for (const log of logs) {
      const logDate = new Date(log.date);
      const daysDiff = Math.floor(
        (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff > 1) {
        break;
      }

      if (log.compliancePercent >= 80) {
        streak++;
        currentDate = logDate;
      } else {
        break;
      }
    }

    return streak;
  });
}
