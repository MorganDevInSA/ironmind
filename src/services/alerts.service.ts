import type { SmartAlert } from '@/lib/types';
import { getRecentWorkouts, getActiveProgram } from './training.service';
import { getRecentRecoveryEntries, getPelvicComfortFlags } from './recovery.service';
import { checkConsecutiveWeightDrops } from './physique.service';
import { getProtocol } from './supplements.service';
import { withService } from '@/lib/errors';

// Generate smart alerts based on data analysis
export async function getActiveAlerts(userId: string): Promise<SmartAlert[]> {
  return withService('alerts', 'generate active alerts', async () => {
    const alerts: SmartAlert[] = [];
    const now = new Date().toISOString();

  // TODO(alerts): implement shoulder spillover detection when Day 5 KPI
  // history is available (needs 2+ full cycles of db-incline-press data).

  // Check for Day 13 fatigue
  const fatigueAlert = await checkDay13Fatigue(userId);
  if (fatigueAlert) {
    alerts.push({
      id: 'fatigue-alert',
      type: 'fatigue',
      severity: 'warning',
      title: 'Day 13 Fatigue Warning',
      message: fatigueAlert.message,
      action: fatigueAlert.action,
      createdAt: now,
    });
  }

  // Check calorie emergency (consecutive weight drops)
  const calorieEmergency = await checkConsecutiveWeightDrops(userId, 2);
  if (calorieEmergency) {
    alerts.push({
      id: 'calorie-emergency',
      type: 'calorie_emergency',
      severity: 'critical',
      title: 'Calorie Emergency',
      message: 'Bodyweight has dropped 2 consecutive mornings. Add +1 gainer scoop, +40-80g carbs, or +15-20g fat from nuts/oils.',
      action: 'Adjust nutrition immediately',
      createdAt: now,
    });
  }

  // Check pelvic comfort warnings
  const pelvicFlags = await getPelvicComfortFlags(userId, 7);
  if (pelvicFlags.length > 0) {
    alerts.push({
      id: 'pelvic-warning',
      type: 'pelvic_comfort',
      severity: 'warning',
      title: 'Pelvic Comfort Warning',
      message: `Low pelvic comfort scores detected on ${pelvicFlags.length} day(s) this week. Consider reducing core volume or swapping movements.`,
      action: 'Review core exercises',
      createdAt: now,
    });
  }

  // Check for progression opportunities
  const progressionAlerts = await checkProgressionOpportunities(userId);
  alerts.push(...progressionAlerts);

  // Check recovery trends
  const recoveryAlerts = await checkRecoveryIssues(userId);
  alerts.push(...recoveryAlerts);

  // Check supplement compliance
  const protocol = await getProtocol(userId);
  if (protocol) {
    const { getAverageCompliance } = await import('./supplements.service');
    const compliance = await getAverageCompliance(userId, 7);

    if (compliance < 70) {
      alerts.push({
        id: 'supplement-compliance',
        type: 'info',
        severity: 'info',
        title: 'Supplement Compliance Low',
        message: `Weekly supplement compliance at ${compliance}%. Consider setting reminders.`,
        action: 'Review protocol',
        createdAt: now,
      });
    }
  }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  });
}

// Check Day 13 fatigue warning
async function checkDay13Fatigue(userId: string): Promise<{ message: string; action: string } | null> {
  const program = await getActiveProgram(userId);
  if (!program) return null;

  const workouts = await getRecentWorkouts(userId, 14);

  // Check if Day 13 has been performed multiple times with decreasing performance
  const day13Workouts = workouts.filter(w => w.cycleDayNumber === 13);

  if (day13Workouts.length >= 3) {
    // Analyze trend
    const durations = day13Workouts.map(w => w.durationMinutes);
    const isDecreasing = durations.every((d, i) => i === 0 || d <= durations[i - 1]);

    if (isDecreasing && durations[0] < durations[durations.length - 1] * 0.85) {
      return {
        message: 'Day 13 session duration has decreased by 15%+ over last 3 cycles. Consider splitting the session or dropping calves/curls.',
        action: 'Review Day 13 structure',
      };
    }
  }

  return null;
}

// Check for progression opportunities
async function checkProgressionOpportunities(userId: string): Promise<SmartAlert[]> {
  const alerts: SmartAlert[] = [];
  const now = new Date().toISOString();

  // Check if today is a Week 2 progression day (Days 9-13)
  const program = await getActiveProgram(userId);
  if (!program) return alerts;

  // Get recent workouts for KPI tracking
  const workouts = await getRecentWorkouts(userId, 14);

  // Check DB Bench progression
  const dbBenchWorkouts = workouts.filter(w =>
    w.exercises.some(e => e.exerciseId === 'db-bench')
  );

  if (dbBenchWorkouts.length >= 2) {
    const latest = dbBenchWorkouts[0];
    const previous = dbBenchWorkouts[1];

    const latestSet = latest.exercises.find(e => e.exerciseId === 'db-bench')?.sets
      .filter(s => s.completed && s.type === 'working')[0];
    const previousSet = previous.exercises.find(e => e.exerciseId === 'db-bench')?.sets
      .filter(s => s.completed && s.type === 'working')[0];

    if (latestSet && previousSet) {
      const latestVolume = latestSet.weight * latestSet.reps;
      const previousVolume = previousSet.weight * previousSet.reps;

      if (latestVolume <= previousVolume) {
        alerts.push({
          id: 'db-bench-progression',
          type: 'progression',
          severity: 'info',
          title: 'DB Bench Progression Reminder',
          message: `Last DB Bench: ${latestSet.weight}kg x ${latestSet.reps}. Try to beat previous: ${previousSet.weight}kg x ${previousSet.reps} by +1 rep OR +1-2.5kg.`,
          action: 'Push for progression',
          createdAt: now,
        });
      }
    }
  }

  return alerts;
}

// Check for recovery issues
async function checkRecoveryIssues(userId: string): Promise<SmartAlert[]> {
  const alerts: SmartAlert[] = [];
  const now = new Date().toISOString();

  const entries = await getRecentRecoveryEntries(userId, 7);

  if (entries.length === 0) return alerts;

  const avgReadiness = entries.reduce((sum, e) => sum + e.readinessScore, 0) / entries.length;

  if (avgReadiness < 60) {
    alerts.push({
      id: 'low-readiness',
      type: 'info',
      severity: 'warning',
      title: 'Low Recovery Trend',
      message: `Average readiness this week: ${Math.round(avgReadiness)}/100. Consider prioritizing sleep and reducing intensity.`,
      action: 'Review recovery habits',
      createdAt: now,
    });
  }

  // Check sleep quality
  const avgSleep = entries.reduce((sum, e) => sum + e.sleepQuality, 0) / entries.length;
  if (avgSleep < 6) {
    alerts.push({
      id: 'poor-sleep',
      type: 'info',
      severity: 'warning',
      title: 'Sleep Quality Declining',
      message: `Average sleep quality this week: ${avgSleep.toFixed(1)}/10. Consider sleep hygiene improvements.`,
      action: 'Improve sleep habits',
      createdAt: now,
    });
  }

  return alerts;
}

// Get alert count by severity (sync - operates on already-fetched alerts)
export function summarizeAlerts(alerts: SmartAlert[]): {
  total: number; critical: number; warning: number; info: number;
} {
  return {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
    info: alerts.filter(a => a.severity === 'info').length,
  };
}

// Dismiss alert (client-side only - alerts are computed, not stored)
export function dismissAlert(alerts: SmartAlert[], alertId: string): SmartAlert[] {
  return alerts.filter(a => a.id !== alertId);
}
