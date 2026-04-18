import type { ExportOptions } from '@/lib/types';
import { getProfile } from '@/services/profile.service';
import { getActiveProgram, getRecentWorkouts } from '@/services/training.service';
import { getRecentNutritionDays } from '@/services/nutrition.service';
import { getRecentRecoveryEntries } from '@/services/recovery.service';
import { getWeightTrend, getRecentCheckIns } from '@/services/physique.service';
import { getSupplementCompliance } from '@/services/supplements.service';
import { getJournalEntries } from '@/services/coaching.service';
import { getWeeklyVolumeSummary, getVolumeLandmarks } from '@/services/volume.service';
import { getActiveAlerts } from '@/services/alerts.service';
import { today, formatDisplayDate, getLastNDays } from '@/lib/utils';

export async function generateSummary(
  userId: string,
  options: ExportOptions
): Promise<string> {
  const exportDate = formatDisplayDate(new Date());

  // Gather all data
  const [
    profile,
    program,
    workouts,
    nutrition,
    recovery,
    checkIns,
    weightTrend,
    supplementCompliance,
    journalEntries,
    weeklyVolume,
    volumeLandmarks,
    alerts,
  ] = await Promise.all([
    options.includeProfile ? getProfile(userId) : Promise.resolve(null),
    options.includeProgram ? getActiveProgram(userId) : Promise.resolve(null),
    options.includeWorkouts ? getRecentWorkouts(userId, options.historyDays) : Promise.resolve([]),
    options.includeNutrition ? getRecentNutritionDays(userId, options.historyDays) : Promise.resolve([]),
    options.includeRecovery ? getRecentRecoveryEntries(userId, options.historyDays) : Promise.resolve([]),
    options.includePhysique ? getRecentCheckIns(userId, 10) : Promise.resolve([]),
    options.includePhysique ? getWeightTrend(userId, options.historyDays) : Promise.resolve([]),
    options.includeSupplements ? getSupplementCompliance(userId, options.historyDays) : Promise.resolve([]),
    options.includeCoachingNotes ? getJournalEntries(userId, 5) : Promise.resolve([]),
    options.includeProgram ? getWeeklyVolumeSummary(userId) : Promise.resolve([]),
    options.includeProgram ? getVolumeLandmarks(userId) : Promise.resolve(null),
    options.includeAlerts ? getActiveAlerts(userId) : Promise.resolve([]),
  ]);

  // Build sections
  let markdown = `# Athlete Status Report — ${exportDate}\n\n`;

  // Profile Section
  if (profile) {
    markdown += `## Athlete Profile\n`;
    markdown += `- Age: ${profile.age} | Height: ${profile.height} | Weight: ${profile.currentWeight} kg (target: ${profile.targetWeight} kg)\n`;
    markdown += `- Training Age: ${profile.trainingAge}\n`;
    markdown += `- Phase: ${profile.currentPhase}\n`;
    markdown += `- Primary Goal: ${profile.primaryGoal}\n`;
    markdown += `- Injury constraints: ${profile.injuryConstraints.map(i => i.name).join(', ')}\n`;
    markdown += `- Weak points: ${profile.weakpointBodyparts.join(', ')}\n`;
    markdown += `- Strengths: ${profile.strengthBodyparts.join(', ')}\n\n`;
  }

  // Current Program
  if (program) {
    const todayStr = today();
    const { getCycleDay } = await import('@/lib/utils');
    const cycleDay = getCycleDay(program.startDate ?? todayStr, todayStr, program.cycleLengthDays);
    const todaySession = program.sessions.find(s => s.dayNumber === cycleDay);

    markdown += `## Current Program\n`;
    markdown += `- Name: ${program.name}\n`;
    markdown += `- Structure: ${program.cycleLengthDays}-day rotating cycle\n`;
    markdown += `- Cycle day today: Day ${cycleDay}${todaySession ? ` — ${todaySession.name}` : ''}\n\n`;

    markdown += `### KPIs Being Tracked\n`;
    for (const kpi of program.kpis) {
      markdown += `- ${kpi.exercise}: ${kpi.metric} (Days ${kpi.days.join(', ')})\n`;
    }
    markdown += `- Progression rule: ${program.progressionRule}\n\n`;
  }

  // Training Log
  if (workouts.length > 0) {
    markdown += `## Training Log (Last ${options.historyDays} Days)\n\n`;

    for (const workout of workouts.slice(0, 5)) {
      markdown += `### ${formatDisplayDate(workout.date)} — Day ${workout.cycleDayNumber}: ${workout.sessionName}\n`;
      markdown += `| Exercise | Sets | Reps | Weight | Notes |\n`;
      markdown += `|----------|------|------|--------|-------|\n`;

      for (const exercise of workout.exercises) {
        const topSet = exercise.sets
          .filter(s => s.completed)
          .sort((a, b) => (b.weight * b.reps) - (a.weight * a.reps))[0];

        if (topSet) {
          markdown += `| ${exercise.name} | ${exercise.sets.filter(s => s.completed).length}/${exercise.sets.length} | ${topSet.reps} | ${topSet.weight}kg | ${exercise.notes || ''} |\n`;
        }
      }

      markdown += `\nDuration: ${workout.durationMinutes} min | Total volume: ${workout.exercises.reduce((sum, e) => sum + e.sets.filter(s => s.completed).length, 0)} sets\n\n`;
    }
  }

  // Volume Summary
  if (weeklyVolume.length > 0 && volumeLandmarks) {
    markdown += `## Volume Summary (Current Week)\n`;
    markdown += `| Muscle Group | Current | Target | MV | MEV | MAV | MRV | Status |\n`;
    markdown += `|-------------|---------|--------|----|-----|-----|-----|--------|\n`;

    for (const muscle of weeklyVolume) {
      const status = muscle.currentSets < muscle.mev ? 'Below MEV' :
        muscle.currentSets < muscle.mav ? 'MEV-MAV' :
        muscle.currentSets <= muscle.mrv ? 'MAV-MRV' : 'Above MRV';

      markdown += `| ${muscle.muscleGroup} | ${muscle.currentSets} | ${muscle.targetSets} | ${muscle.mv} | ${muscle.mev} | ${muscle.mav} | ${muscle.mrv} | ${status} |\n`;
    }
    markdown += `\n`;
  }

  // Nutrition Summary
  if (nutrition.length > 0) {
    const avgCompliance = Math.round(
      nutrition.reduce((sum, n) => sum + n.complianceScore, 0) / nutrition.length
    );
    const avgProtein = Math.round(
      nutrition.reduce((sum, n) => sum + n.macroActuals.protein, 0) / nutrition.length
    );

    markdown += `## Nutrition Summary (Last ${options.historyDays} Days)\n`;
    markdown += `- Average compliance: ${avgCompliance}%\n`;
    markdown += `- Average daily protein: ${avgProtein}g\n\n`;

    markdown += `| Date | Day Type | Calories | Protein | Carbs | Compliance |\n`;
    markdown += `|------|----------|----------|---------|-------|------------|\n`;

    for (const day of nutrition.slice(0, 7)) {
      markdown += `| ${formatDisplayDate(day.date)} | ${day.dayType} | ${Math.round(day.macroActuals.calories)} | ${Math.round(day.macroActuals.protein)}g | ${Math.round(day.macroActuals.carbs)}g | ${day.complianceScore}% |\n`;
    }
    markdown += `\n`;
  }

  // Bodyweight Trend
  if (weightTrend.length > 0) {
    markdown += `## Bodyweight Trend (Last ${options.historyDays} Days)\n`;
    markdown += `| Date | Weight | 7-Day Avg |\n`;
    markdown += `|------|--------|-----------|\n`;

    for (const entry of weightTrend.slice(-7)) {
      markdown += `| ${formatDisplayDate(entry.date)} | ${entry.weight.toFixed(1)} kg | ${entry.avg7Day ? entry.avg7Day.toFixed(1) + ' kg' : '—'} |\n`;
    }
    markdown += `\n`;
  }

  // Recovery Summary
  if (recovery.length > 0) {
    const avgReadiness = Math.round(
      recovery.reduce((sum, r) => sum + r.readinessScore, 0) / recovery.length
    );

    markdown += `## Recovery & Readiness (Last ${options.historyDays} Days)\n`;
    markdown += `- Average readiness: ${avgReadiness}/100\n\n`;

    markdown += `| Date | Sleep | HRV | Mood | Stress | Energy | DOMS | Pelvic | Score |\n`;
    markdown += `|------|-------|-----|------|--------|--------|------|--------|-------|\n`;

    for (const entry of recovery.slice(0, 7)) {
      markdown += `| ${formatDisplayDate(entry.date)} | ${entry.sleepHours}h | ${entry.hrv} | ${entry.mood} | ${entry.stress} | ${entry.energy} | ${entry.doms} | ${entry.pelvicComfort} | ${Math.round(entry.readinessScore)} |\n`;
    }
    markdown += `\n`;
  }

  // Supplement Compliance
  if (supplementCompliance.length > 0) {
    const avgCompliance = Math.round(
      supplementCompliance.reduce((sum, s) => sum + s.compliance, 0) / supplementCompliance.length
    );

    markdown += `## Supplement Compliance (Last ${options.historyDays} Days)\n`;
    markdown += `- Average daily compliance: ${avgCompliance}%\n\n`;
  }

  // Active Alerts
  if (alerts.length > 0) {
    markdown += `## Active Alerts & Flags\n`;
    for (const alert of alerts) {
      markdown += `- **${alert.title}** (${alert.severity}): ${alert.message}\n`;
      if (alert.action) {
        markdown += `  - Action: ${alert.action}\n`;
      }
    }
    markdown += `\n`;
  }

  // Recent Coaching Notes
  if (journalEntries.length > 0) {
    markdown += `## Recent Coaching Notes\n\n`;

    for (const entry of journalEntries.slice(0, 3)) {
      markdown += `### ${formatDisplayDate(entry.date)} — ${entry.title}\n`;
      markdown += `${entry.content.slice(0, 500)}${entry.content.length > 500 ? '...' : ''}\n\n`;
      if (entry.tags.length > 0) {
        markdown += `Tags: ${entry.tags.join(', ')}\n\n`;
      }
    }
  }

  // Open Questions
  markdown += `## Open Questions for Analysis\n`;
  markdown += `- Is current quad volume sufficient given weak-point priority?\n`;
  markdown += `- Should Day 13 session structure change given accumulated fatigue?\n`;
  markdown += `- Is calorie target appropriate given current weight trend?\n`;
  markdown += `- Are supplement timing windows optimized for absorption?\n`;
  markdown += `- Should shoulder spillover protocol be triggered?\n`;

  return markdown;
}
