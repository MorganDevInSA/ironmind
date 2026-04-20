import type { CheckIn, ExportOptions, Program, Workout } from '@/lib/types';
import { getProfile } from '@/services/profile.service';
import { getActiveProgram, getRecentWorkouts } from '@/services/training.service';
import { getRecentNutritionDays } from '@/services/nutrition.service';
import { getRecentRecoveryEntries } from '@/services/recovery.service';
import { getWeightTrend, getRecentCheckIns } from '@/services/physique.service';
import { getSupplementCompliance, getProtocol } from '@/services/supplements.service';
import { getJournalEntries } from '@/services/coaching.service';
import { getWeeklyVolumeSummary, getVolumeLandmarks } from '@/services/volume.service';
import { getActiveAlerts } from '@/services/alerts.service';
import { today, formatDisplayDate, getCycleDay } from '@/lib/utils';

/** Safe cell text for markdown pipes */
function mdCell(value: unknown): string {
  if (value === null || value === undefined) return '—';
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function sessionsCompleted(workouts: Workout[]): number {
  return workouts.filter(w =>
    w.exercises.some(e => e.sets.some(s => s.completed))
  ).length;
}

function formatUpcomingProgram(program: Program, count: number): string {
  const todayStr = today();
  const len = program.cycleLengthDays;
  const start = getCycleDay(program.startDate ?? todayStr, todayStr, len);
  let out = `### Upcoming cycle days (next ${count} from today)\n\n`;
  out += `| When | Cycle day | Session | Type |\n|------|-----------|---------|------|\n`;
  for (let i = 0; i < count; i++) {
    const dayNum = ((start - 1 + i) % len) + 1;
    const s = program.sessions.find((x) => x.dayNumber === dayNum);
    const when = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `+${i}d`;
    out += `| ${when} | ${dayNum} | ${mdCell(s?.name)} | ${mdCell(s?.type)} |\n`;
  }
  return `${out}\n`;
}

function formatCheckInsTable(checkIns: CheckIn[]): string {
  if (checkIns.length === 0) return '';
  let out = `## Physique check-ins (measurements & bodyweight)\n\n`;
  out += `| Date | Weight (kg) | Waist | Chest | Hips | L arm | R arm | L thigh | R thigh | Notes |\n`;
  out += `|------|------------|-------|-------|------|-------|-------|---------|---------|-------|\n`;
  for (const c of checkIns) {
    const m = c.measurements ?? {};
    out += `| ${formatDisplayDate(c.date)} | ${mdCell(c.bodyweight)} | ${mdCell(m.waist)} | ${mdCell(m.chest)} | ${mdCell(m.hips)} | ${mdCell(m.leftArm)} | ${mdCell(m.rightArm)} | ${mdCell(m.leftThigh)} | ${mdCell(m.rightThigh)} | ${mdCell((c.symmetryNotes || c.coachNotes || '').slice(0, 80))} |\n`;
  }
  return `${out}\n`;
}

function formatWorkoutDetail(workout: Workout): string {
  const completedSets = workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.completed).length,
    0
  );
  let block = `### ${formatDisplayDate(workout.date)} — Cycle day ${workout.cycleDayNumber}: ${mdCell(workout.sessionName)}\n`;
  block += `- Type: ${mdCell(workout.sessionType)} · Duration: ${workout.durationMinutes} min · Completed sets: ${completedSets}\n`;
  if (workout.notes?.trim()) {
    block += `- Session notes: ${mdCell(workout.notes)}\n`;
  }
  block += `\n`;

  for (const exercise of workout.exercises) {
    block += `#### ${mdCell(exercise.name)}${exercise.muscleGroup ? ` (${mdCell(exercise.muscleGroup)})` : ''}\n`;
    if (exercise.notes?.trim()) {
      block += `*${mdCell(exercise.notes)}*\n\n`;
    }
    block += `| Set | Done | kg | Reps | Type | RPE | RIR | Tempo | PR |\n`;
    block += `|-----|------|-----|------|------|-----|-----|-------|----|\n`;
    for (const s of exercise.sets) {
      block += `| ${s.setNumber} | ${s.completed ? 'Yes' : 'No'} | ${mdCell(s.weight)} | ${mdCell(s.reps)} | ${mdCell(s.type)} | ${mdCell(s.rpe)} | ${mdCell(s.rir)} | ${mdCell(s.tempo)} | ${s.isPersonalRecord ? 'Yes' : ''} |\n`;
    }
    block += `\n`;
  }
  return block;
}

export async function generateSummary(
  userId: string,
  options: ExportOptions
): Promise<string> {
  const generatedAtIso = new Date().toISOString();
  const exportDate = formatDisplayDate(new Date());
  const checkInLimit = Math.min(48, Math.max(12, options.historyDays));
  const journalLimit = 20;

  const [
    profile,
    program,
    workouts,
    nutrition,
    recovery,
    checkIns,
    weightTrend,
    supplementCompliance,
    supplementProtocol,
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
    options.includePhysique ? getRecentCheckIns(userId, checkInLimit) : Promise.resolve([]),
    options.includePhysique ? getWeightTrend(userId, options.historyDays) : Promise.resolve([]),
    options.includeSupplements ? getSupplementCompliance(userId, options.historyDays) : Promise.resolve([]),
    options.includeSupplements ? getProtocol(userId) : Promise.resolve(null),
    options.includeCoachingNotes ? getJournalEntries(userId, journalLimit) : Promise.resolve([]),
    options.includeProgram ? getWeeklyVolumeSummary(userId) : Promise.resolve([]),
    options.includeProgram ? getVolumeLandmarks(userId) : Promise.resolve(null),
    options.includeAlerts ? getActiveAlerts(userId) : Promise.resolve([]),
  ]);

  const includedSections: string[] = [];
  if (options.includeProfile) includedSections.push('profile');
  if (options.includeProgram) includedSections.push('program', 'volume');
  if (options.includeWorkouts) includedSections.push('training_log');
  if (options.includeNutrition) includedSections.push('nutrition');
  if (options.includeRecovery) includedSections.push('recovery');
  if (options.includePhysique) includedSections.push('physique', 'bodyweight_trend');
  if (options.includeSupplements) includedSections.push('supplements');
  if (options.includeAlerts) includedSections.push('alerts');
  if (options.includeCoachingNotes) includedSections.push('coaching_notes');

  let markdown = `# Athlete Status Report — ${exportDate}\n\n`;

  markdown += `## Export metadata\n`;
  markdown += `- **ISO generated at:** ${generatedAtIso}\n`;
  markdown += `- **History window:** last **${options.historyDays}** days (rolling)\n`;
  markdown += `- **Domains included:** ${includedSections.length ? includedSections.join(', ') : 'none'}\n`;
  markdown += `- **Coach workflow:** Use with \`../prompts/04-coach-analysis-from-export-or-screenshots.md\` (from the \`ironmind\` app folder) and your coach persona.\n\n`;

  if (profile) {
    markdown += `## Athlete Profile\n`;
    markdown += `- Age: ${profile.age} | Height: ${profile.height} | Weight: ${profile.currentWeight} kg (target: ${profile.targetWeight} kg)\n`;
    markdown += `- Training age: ${profile.trainingAge}\n`;
    markdown += `- Phase: ${profile.currentPhase}\n`;
    markdown += `- Primary goal: ${profile.primaryGoal}\n`;
    if (profile.secondaryGoals?.length) {
      markdown += `- Secondary goals: ${profile.secondaryGoals.join(', ')}\n`;
    }
    markdown += `- Nutrition style: ${profile.nutritionStyle}\n`;
    if (profile.metabolismNote?.trim()) {
      markdown += `- Metabolism note: ${profile.metabolismNote}\n`;
    }
    markdown += `- Split / focus: strength bodyparts: ${profile.strengthBodyparts.join(', ')} · weak points: ${profile.weakpointBodyparts.join(', ')}\n`;
    if (profile.injuryConstraints?.length) {
      markdown += `### Injury & constraints\n`;
      for (const inj of profile.injuryConstraints) {
        markdown += `- **${inj.name}** — implications: ${inj.implications.join('; ') || '—'} · adaptations: ${inj.adaptations.join('; ') || '—'}\n`;
      }
    }
    markdown += `\n`;
  }

  if (program) {
    const todayStr = today();
    const cycleDay = getCycleDay(program.startDate ?? todayStr, todayStr, program.cycleLengthDays);
    const todaySession = program.sessions.find((s) => s.dayNumber === cycleDay);

    markdown += `## Current Program\n`;
    markdown += `- Name: ${program.name}\n`;
    markdown += `- Split type: ${program.splitType}\n`;
    markdown += `- Structure: ${program.cycleLengthDays}-day rotating cycle\n`;
    markdown += `- Cycle day today: Day ${cycleDay}${todaySession ? ` — ${todaySession.name}` : ''}\n`;
    markdown += `- Progression rule: ${program.progressionRule}\n\n`;

    markdown += `### KPIs being tracked\n`;
    for (const kpi of program.kpis) {
      markdown += `- ${kpi.exercise}: ${kpi.metric} (cycle days ${kpi.days.join(', ')})\n`;
    }
    markdown += `\n`;
    markdown += formatUpcomingProgram(program, Math.min(program.cycleLengthDays, 14));
  }

  if (options.includeWorkouts && workouts.length > 0) {
    const sorted = [...workouts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const datesWithData = new Set(sorted.map((w) => w.date)).size;
    markdown += `## Training log (last ${options.historyDays} days)\n`;
    markdown += `- Sessions with completed sets in window: **${sessionsCompleted(sorted)}** · Distinct workout dates: **${datesWithData}**\n\n`;

    for (const workout of sorted) {
      markdown += formatWorkoutDetail(workout);
    }
  }

  if (weeklyVolume.length > 0 && volumeLandmarks) {
    markdown += `## Volume summary (current week vs landmarks)\n`;
    markdown += `| Muscle group | Current sets | Target | MV | MEV | MAV | MRV | Status |\n`;
    markdown += `|--------------|-------------|--------|----|-----|-----|-----|--------|\n`;

    for (const muscle of weeklyVolume) {
      const status =
        muscle.currentSets < muscle.mev
          ? 'Below MEV'
          : muscle.currentSets < muscle.mav
            ? 'MEV–MAV'
            : muscle.currentSets <= muscle.mrv
              ? 'MAV–MRV'
              : 'Above MRV';

      markdown += `| ${muscle.muscleGroup} | ${muscle.currentSets} | ${muscle.targetSets} | ${muscle.mv} | ${muscle.mev} | ${muscle.mav} | ${muscle.mrv} | ${status} |\n`;
    }
    markdown += `\n`;
  }

  if (nutrition.length > 0) {
    const avgCompliance = Math.round(
      nutrition.reduce((sum, n) => sum + n.complianceScore, 0) / nutrition.length
    );
    const avgProtein = Math.round(
      nutrition.reduce((sum, n) => sum + n.macroActuals.protein, 0) / nutrition.length
    );

    markdown += `## Nutrition (last ${options.historyDays} days)\n`;
    markdown += `- Average compliance: ${avgCompliance}% · Average protein: ${avgProtein}g/day\n\n`;
    markdown += `| Date | Day type | Calories | Protein | Carbs | Fat | Compliance |\n`;
    markdown += `|------|----------|----------|---------|-------|-----|------------|\n`;

    for (const day of nutrition) {
      markdown += `| ${formatDisplayDate(day.date)} | ${day.dayType} | ${Math.round(day.macroActuals.calories)} | ${Math.round(day.macroActuals.protein)}g | ${Math.round(day.macroActuals.carbs)}g | ${Math.round(day.macroActuals.fat)}g | ${day.complianceScore}% |\n`;
    }
    markdown += `\n`;
  }

  if (weightTrend.length > 0) {
    markdown += `## Bodyweight trend (last ${options.historyDays} days)\n`;
    markdown += `| Date | Weight | 7-day avg |\n`;
    markdown += `|------|--------|----------|\n`;

    for (const entry of weightTrend) {
      markdown += `| ${formatDisplayDate(entry.date)} | ${entry.weight.toFixed(1)} kg | ${entry.avg7Day ? `${entry.avg7Day.toFixed(1)} kg` : '—'} |\n`;
    }
    markdown += `\n`;
  }

  if (checkIns.length > 0) {
    markdown += formatCheckInsTable(checkIns);
  }

  if (recovery.length > 0) {
    const avgReadiness = Math.round(
      recovery.reduce((sum, r) => sum + r.readinessScore, 0) / recovery.length
    );

    markdown += `## Recovery & readiness (last ${options.historyDays} days)\n`;
    markdown += `- Average readiness: ${avgReadiness}/100\n\n`;
    markdown += `| Date | Sleep | HRV | Mood | Stress | Energy | DOMS | Pelvic | Score |\n`;
    markdown += `|------|-------|-----|------|--------|--------|------|--------|-------|\n`;

    for (const entry of recovery) {
      markdown += `| ${formatDisplayDate(entry.date)} | ${entry.sleepHours}h | ${entry.hrv} | ${entry.mood} | ${entry.stress} | ${entry.energy} | ${entry.doms} | ${entry.pelvicComfort} | ${Math.round(entry.readinessScore)} |\n`;
    }
    markdown += `\n`;
  }

  if (supplementProtocol && options.includeSupplements) {
    markdown += `## Supplement protocol (planned)\n`;
    markdown += `- Intent: ${supplementProtocol.intent?.join('; ') || '—'}\n`;
    markdown += `- Notes: ${supplementProtocol.notes?.join('; ') || '—'}\n\n`;
    for (const w of supplementProtocol.windows) {
      markdown += `### ${w.timing}${w.withMeal ? ` (with ${w.withMeal})` : ''}\n`;
      markdown += `- Items: ${w.supplements.join(', ')}\n`;
      if (w.optional?.length) markdown += `- Optional: ${w.optional.join(', ')}\n`;
      markdown += `\n`;
    }
  }

  if (supplementCompliance.length > 0 && options.includeSupplements) {
    const avgCompliance = Math.round(
      supplementCompliance.reduce((sum, s) => sum + s.compliance, 0) /
        supplementCompliance.length
    );
    markdown += `## Supplement logging (last ${options.historyDays} days)\n`;
    markdown += `- Average logged daily compliance: ${avgCompliance}%\n\n`;
    markdown += `| Date | Compliance % |\n`;
    markdown += `|------|---------------|\n`;
    for (const row of supplementCompliance) {
      markdown += `| ${formatDisplayDate(row.date)} | ${row.compliance} |\n`;
    }
    markdown += `\n`;
  }

  if (alerts.length > 0) {
    markdown += `## Active alerts & flags\n`;
    for (const alert of alerts) {
      markdown += `- **${alert.title}** (${alert.severity}): ${alert.message}\n`;
      if (alert.action) markdown += `  - Suggested action: ${alert.action}\n`;
    }
    markdown += `\n`;
  }

  if (journalEntries.length > 0) {
    markdown += `## Coaching notes / journal\n\n`;
    for (const entry of journalEntries) {
      markdown += `### ${formatDisplayDate(entry.date)} — ${entry.title}\n`;
      const body =
        entry.content.length > 8000 ? `${entry.content.slice(0, 8000)}\n… *(truncated)*` : entry.content;
      markdown += `${body}\n\n`;
      if (entry.tags.length > 0) markdown += `Tags: ${entry.tags.join(', ')}\n\n`;
    }
  }

  markdown += `## Coach analysis intake\n`;
  markdown += `- Structured export fidelity is highest when all domains above have real rows (not placeholders).\n`;
  markdown += `- Compare **ISO generated at** to “today” when pasting — stale exports widen uncertainty.\n`;
  markdown += `- Life context (travel, illness, contests) is usually **not** in this file; add it in chat when relevant.\n`;
  markdown += `- Prompt bundle (repo layout): \`../prompts/04-coach-analysis-from-export-or-screenshots.md\` next to \`ironmind/\`.\n`;

  return markdown;
}
