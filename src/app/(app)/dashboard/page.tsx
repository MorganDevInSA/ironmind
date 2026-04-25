'use client';

import { useState, useEffect, useMemo, useId } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import {
  useDashboardData,
  useRecentWorkouts,
  useWorkouts,
  useCheckIns,
  useNutritionPlan,
  useNutritionDay,
  useProtocol,
  useRecoveryEntry,
  useSupplementLog,
  useWorkoutMediaPreference,
  useSaveWorkoutMediaPreference,
} from '@/controllers';
import {
  getCycleDay,
  findProgramSessionForCycleDay,
  today,
  formatDisplayDate,
  formatShortDate,
  getDaysInRange,
  sortCheckInsChronologicalAsc,
  toDateOnlyKey,
} from '@/lib/utils';
import { differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import {
  Activity,
  Dumbbell,
  Scale,
  Pill,
  Utensils,
  TrendingUp,
  Zap,
  Calendar,
  CheckCircle2,
  X,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { cn } from '@/lib/utils';
import { consumeDashboardTrendWindowFourWeeksBootstrap } from '@/lib/dashboard-trend-session';
import { bodyweightForChartKg, measurementForChart } from '@/lib/utils/measurement-bounds';
import { MEASUREMENT_CHART_SERIES } from '@/lib/constants/measurement-chart-series';
import type { Workout, NutritionDay, SupplementLog, ProgramSession, CheckIn } from '@/lib/types';
import {
  appendMediaGateBypass,
  postSessionMediaHref,
  routeForTodaySessionStart,
  sessionTypeUsesMediaGate,
} from '@/lib/program-session-routes';
import { TrainingMediaModal } from '@/components/training/training-media-modal';
import { mortonNutritionPlan } from '@/lib/seed/nutrition';
import { mortonSupplementProtocol } from '@/lib/seed/supplements';
import type { NutritionPlanSeed } from '@/lib/seed/nutrition';
import type { SupplementProtocol } from '@/lib/types';

/* ─────────────────────────────────────────────────────────────────────
   Muscle / density helpers
───────────────────────────────────────────────────────────────────── */
const MUSCLE_PATTERNS: [RegExp, string][] = [
  [/bench|chest|pec|fly|flye|cable cross|dip/i, 'chest'],
  [/row|pull|lat|chin|deadlift|pulldown|rear delt/i, 'back'],
  [/squat|leg press|hack|lunge|quad|leg ext/i, 'quads'],
  [/hamstring|rdl|stiff|good morning|leg curl/i, 'hamstrings'],
  [/ohp|shoulder|delt|lateral raise|shrug/i, 'delts'],
  [/curl|bicep|hammer|preacher/i, 'biceps'],
  [/tricep|pushdown|extension|close grip|skull/i, 'triceps'],
  [/calf/i, 'calves'],
];
function inferMuscle(name: string) {
  for (const [re, g] of MUSCLE_PATTERNS) if (re.test(name)) return g;
  return 'other';
}

function calcDensity(workout: Workout) {
  type Row = { label: string; muscle: string; volume: number; sets: number };
  const byExercise: Row[] = workout.exercises
    .map((ex) => ({
      label: ex.name,
      muscle: ex.muscleGroup || inferMuscle(ex.name),
      volume: ex.sets.filter((s) => s.completed).reduce((s, set) => s + set.weight * set.reps, 0),
      sets: ex.sets.filter((s) => s.completed).length,
    }))
    .filter((r) => r.volume > 0);

  const byMuscleMap: Record<string, Row> = {};
  for (const ex of byExercise) {
    if (!byMuscleMap[ex.muscle])
      byMuscleMap[ex.muscle] = { label: ex.muscle, muscle: ex.muscle, volume: 0, sets: 0 };
    byMuscleMap[ex.muscle].volume += ex.volume;
    byMuscleMap[ex.muscle].sets += ex.sets;
  }

  const totalVolume = byExercise.reduce((s, r) => s + r.volume, 0);
  const durationMin = Math.max(1, workout.durationMinutes);
  return {
    byExercise,
    byMuscle: Object.values(byMuscleMap),
    totalVolume,
    durationMin,
    density: Math.round(totalVolume / durationMin),
  };
}

/* ─────────────────────────────────────────────────────────────────────
   Today's Schedule
───────────────────────────────────────────────────────────────────── */
const SUPPL_TIME: Record<string, string> = {
  morning: '07:30',
  lunch: '13:00',
  afternoon: '16:00',
  dinner: '19:30',
  bed: '22:00',
};
const KIND_META = {
  meal: {
    label: 'Meal',
    icon: Utensils,
  },
  vitamins: {
    label: 'Vitamins',
    icon: Pill,
  },
  activity: {
    label: 'Activity',
    icon: Activity,
  },
};

type MealPayload = { kind: 'meal'; slotKey: string; isLiftDay: boolean };
type VitaminsPayload = { kind: 'vitamins'; timing: string };
type ActivityPayload = { kind: 'activity' };
type ItemPayload = MealPayload | VitaminsPayload | ActivityPayload;

type ScheduleItem = {
  sortKey: number;
  time: string;
  kind: keyof typeof KIND_META;
  label: string;
  detail: string;
  done: boolean | null;
  payload: ItemPayload;
};

function toMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m ?? 0);
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Match `physique/page.tsx` `chartGridStroke` — safe on Recharts grid paths. */
const DASHBOARD_PHYSIQUE_CHART_GRID = 'color-mix(in srgb, var(--chrome-border) 35%, transparent)';

function MiniMeasurementLegendSwatch({ dash }: { dash: string }) {
  return (
    <svg width={22} height={8} viewBox="0 0 22 8" aria-hidden className="shrink-0">
      <line
        x1="1"
        y1="4"
        x2="21"
        y2="4"
        stroke="var(--accent)"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeDasharray={dash === '0' ? '0' : dash}
      />
    </svg>
  );
}
const THEME_FILL_GRADIENT =
  'linear-gradient(90deg, color-mix(in srgb, var(--accent-light) 85%, white 15%) 0%, color-mix(in srgb, var(--accent) 72%, black 28%) 100%)';
const CHART_TOOLTIP_STYLE = {
  background: 'var(--panel-strong)',
  border: '1px solid var(--chrome-border)',
  borderRadius: 12,
  color: 'var(--text-0)',
  fontSize: 12,
};
const CHART_TOOLTIP_LABEL_STYLE = { color: 'var(--text-1)' };

function PhysiqueMiniCharts({
  checkIns,
  targetWeight,
  emptyHint,
}: {
  checkIns: CheckIn[] | undefined;
  targetWeight: number | undefined;
  /** When set, shown instead of the default copy when there are no points in-range. */
  emptyHint?: string | null;
}) {
  const chartUid = useId().replace(/:/g, '');
  const [mode, setMode] = useState<'weight' | 'measurements'>('weight');
  const chron = sortCheckInsChronologicalAsc(checkIns ?? []);

  const weightRows = chron.map((c) => ({
    dateKey: toDateOnlyKey(c.date) || c.date,
    weight: bodyweightForChartKg(c.bodyweight),
  }));
  const hasWeightPts = weightRows.some(
    (r) => typeof r.weight === 'number' && Number.isFinite(r.weight),
  );

  /* Same row shape as `physique/page.tsx` measurementData (explicit keys). */
  const measRows = chron.map((c) => {
    const m = c.measurements ?? {};
    return {
      dateKey: toDateOnlyKey(c.date) || c.date,
      waist: measurementForChart('waist', m.waist),
      chest: measurementForChart('chest', m.chest),
      hips: measurementForChart('hips', m.hips),
      leftArm: measurementForChart('leftArm', m.leftArm),
      rightArm: measurementForChart('rightArm', m.rightArm),
      leftThigh: measurementForChart('leftThigh', m.leftThigh),
      rightThigh: measurementForChart('rightThigh', m.rightThigh),
    };
  });

  const hasMeas = measRows.some((row) =>
    MEASUREMENT_CHART_SERIES.some(
      ({ key }) => typeof (row as Record<string, string | number | undefined>)[key] === 'number',
    ),
  );

  if (!chron.length) {
    return (
      <p className="text-sm text-[color:var(--text-detail)]">
        {emptyHint ?? 'No check-ins yet — open Physique to log bodyweight and measurements.'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
          Trend
        </span>
        <div className="flex rounded-lg overflow-hidden border border-[color:var(--chrome-border)]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMode('weight');
            }}
            className={cn(
              'px-3 py-1 text-xs font-semibold transition-colors',
              mode === 'weight'
                ? 'bg-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] text-[color:var(--text-0)]'
                : 'text-[color:var(--text-1)] hover:text-[color:var(--text-0)]',
            )}
          >
            Weight
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMode('measurements');
            }}
            disabled={!hasMeas}
            className={cn(
              'px-3 py-1 text-xs font-semibold transition-colors',
              mode === 'measurements'
                ? 'bg-[color:color-mix(in_srgb,var(--accent)_20%,transparent)] text-[color:var(--text-0)]'
                : 'text-[color:var(--text-1)] hover:text-[color:var(--text-0)]',
              !hasMeas && 'opacity-40 cursor-not-allowed',
            )}
          >
            Measurements
          </button>
        </div>
        <span className="text-[10px] text-[color:var(--text-detail)] ml-auto font-mono tabular-nums">
          {chron.length} pts
        </span>
      </div>

      <div className="h-[132px] w-full min-w-0">
        {mode === 'weight' && hasWeightPts ? (
          <ResponsiveContainer width="100%" height={132}>
            <AreaChart data={weightRows} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id={`dashPhysWeight-${chartUid}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_PHYSIQUE_CHART_GRID} />
              <XAxis
                dataKey="dateKey"
                tickFormatter={(v) => (typeof v === 'string' ? formatShortDate(v) : String(v))}
                tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[
                  (dataMin: number) => Math.floor(dataMin - 1),
                  (dataMax: number) => Math.ceil(dataMax + 1),
                ]}
                tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={CHART_TOOLTIP_STYLE}
                labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                labelFormatter={(label) => {
                  const key =
                    typeof label === 'string'
                      ? toDateOnlyKey(label) || String(label)
                      : String(label);
                  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? formatDisplayDate(key) : String(label);
                }}
                formatter={(v) => [`${typeof v === 'number' ? v : '—'} kg`, 'Weight']}
              />
              {targetWeight != null && (
                <ReferenceLine
                  y={targetWeight}
                  stroke="color-mix(in srgb, var(--accent) 65%, transparent)"
                  strokeDasharray="6 4"
                />
              )}
              <Area
                type="monotone"
                dataKey="weight"
                stroke="var(--accent)"
                fill={`url(#dashPhysWeight-${chartUid})`}
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--accent)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : mode === 'measurements' && hasMeas ? (
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1">
            <ResponsiveContainer width="100%" height={132}>
              <LineChart data={measRows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={DASHBOARD_PHYSIQUE_CHART_GRID} />
                <XAxis
                  dataKey="dateKey"
                  tickFormatter={(v) => (typeof v === 'string' ? formatShortDate(v) : String(v))}
                  tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  labelStyle={CHART_TOOLTIP_LABEL_STYLE}
                  labelFormatter={(label) => {
                    const key =
                      typeof label === 'string'
                        ? toDateOnlyKey(label) || String(label)
                        : String(label);
                    return /^\d{4}-\d{2}-\d{2}$/.test(key) ? formatDisplayDate(key) : String(label);
                  }}
                  formatter={(value, name) => [
                    typeof value === 'number' ? `${value} cm` : '—',
                    String(name),
                  ]}
                />
                {MEASUREMENT_CHART_SERIES.map(({ key, label, dash }) => (
                  <Line
                    key={key}
                    type="monotone"
                    name={label}
                    dataKey={key}
                    stroke="var(--accent)"
                    strokeWidth={2}
                    strokeDasharray={dash === '0' ? undefined : dash}
                    dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
                    connectNulls={false}
                    activeDot={{ r: 5, fill: 'var(--accent)' }}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div
              className="flex flex-wrap gap-x-2.5 gap-y-0.5 px-0.5 text-[9px] leading-tight text-[color:var(--text-2)]"
              aria-label="Measurement series"
            >
              {MEASUREMENT_CHART_SERIES.map(({ key, label, dash }) => (
                <div key={key} className="flex items-center gap-1">
                  <MiniMeasurementLegendSwatch dash={dash} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-1 px-2 text-center text-xs text-[color:var(--text-detail)]">
            {mode === 'weight' && !hasWeightPts ? (
              <p>No bodyweight logged on check-ins in this trend window.</p>
            ) : mode === 'measurements' && !hasMeas ? (
              <p>No measurements in this window — log circumferences on Physique.</p>
            ) : (
              <p>Switch tabs or widen the trend window to see chart data.</p>
            )}
          </div>
        )}
      </div>
      {chron.length === 1 && (mode === 'measurements' ? hasMeas : hasWeightPts) ? (
        <p className="text-[10px] leading-snug text-[color:var(--text-2)]">
          One check-in in this range — lines connect across days; add another check-in to see
          trends.
        </p>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Modal content components
───────────────────────────────────────────────────────────────────── */
function MealContent({
  slotKey,
  isLiftDay,
  nutrition,
  nutritionPlan: nutritionPlanProp,
}: {
  slotKey: string;
  isLiftDay: boolean;
  nutrition: NutritionDay | null | undefined;
  nutritionPlan?: NutritionPlanSeed | null;
}) {
  const nutritionPlan = nutritionPlanProp ?? mortonNutritionPlan;
  const slot = nutritionPlan.mealSchedule.find((s) => s.slot === slotKey);
  if (!slot) return null;
  const description = isLiftDay
    ? (slot.liftDay ?? slot.default)
    : (slot.recoveryDay ?? slot.default);
  const loggedMeal = nutrition?.meals.find((m) => m.slot === slotKey);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-1">
          Plan
        </p>
        <p className="text-[color:var(--text-0)]">{description}</p>
      </div>
      {loggedMeal && loggedMeal.foods.length > 0 ? (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">
            Logged Foods
          </p>
          <div className="space-y-1.5">
            {loggedMeal.foods.map((food, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[color:var(--text-0)]">
                  {food.name}{' '}
                  <span className="text-[color:var(--text-detail)]">
                    × {food.quantity}
                    {food.unit}
                  </span>
                </span>
                <span className="font-mono tabular-nums text-[color:var(--text-detail)] text-xs">
                  {food.protein}g P · {food.calories} kcal
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[color:var(--text-detail)]">
          No foods logged yet — follow the plan above.
        </p>
      )}
    </div>
  );
}

function VitaminsContent({
  timing,
  supplements,
  protocol: protocolProp,
}: {
  timing: string;
  supplements: SupplementLog | null | undefined;
  protocol?: SupplementProtocol | null;
}) {
  const protocol = protocolProp ?? mortonSupplementProtocol;
  const win = protocol.windows.find((w) => w.timing === timing);
  if (!win) return null;
  const winLog = supplements?.windows?.[timing] ?? {};

  return (
    <div className="space-y-4">
      {win.withMeal && (
        <p className="text-sm text-[color:var(--text-detail)]">Take with {win.withMeal}</p>
      )}
      <div>
        <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">
          Supplements
        </p>
        <div className="space-y-1.5">
          {win.supplements.map((name, i) => {
            const taken = winLog[name] === true;
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 text-sm py-1.5 px-2 rounded-lg',
                  taken ? 'opacity-50' : 'bg-[color:var(--surface-track)]',
                )}
              >
                {taken ? (
                  <CheckCircle2 size={14} className="text-[color:var(--good)] shrink-0" />
                ) : (
                  <span className="w-3.5 h-3.5 rounded-full border border-[color:var(--chrome-border-subtle)] shrink-0 inline-block" />
                )}
                <span
                  className={
                    taken ? 'text-[color:var(--text-detail)]' : 'text-[color:var(--text-0)]'
                  }
                >
                  {name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {win.optional && win.optional.length > 0 && (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">
            Optional
          </p>
          <div className="space-y-1">
            {win.optional.map((name, i) => (
              <p key={i} className="text-sm text-[color:var(--text-detail)] pl-2">
                {name}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionProgramPreview({ session }: { session: ProgramSession }) {
  const exercises = session.exercises ?? [];
  const hasLift = exercises.length > 0;
  const hasCardio = !!session.cardio;
  const breath = session.breathWork ?? [];
  const core = session.coreWork ?? [];
  const mobility = session.mobility ?? [];
  const hasBreath = breath.length > 0;
  const hasCore = core.length > 0;
  const hasMobility = mobility.length > 0;
  const hasNotes = !!session.notes?.trim();

  const hasAnyDetail = hasNotes || hasLift || hasCardio || hasBreath || hasCore || hasMobility;

  return (
    <div className="space-y-4">
      {hasNotes && (
        <div className="p-3 rounded-lg border-l-4 border-[color:color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_7%,transparent)]">
          <p className="text-sm text-[color:var(--text-detail)] whitespace-pre-wrap">
            {session.notes}
          </p>
        </div>
      )}
      {hasLift && (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">
            Exercises ({exercises.length})
          </p>
          <div className="divide-y divide-[color:var(--chrome-border-subtle)]">
            {exercises.map((ex, i) => (
              <div key={i} className="flex items-start justify-between gap-2 py-2 text-sm">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="exercise-index-badge shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'font-medium',
                          ex.isKPI ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-0)]',
                        )}
                      >
                        {ex.name}
                      </span>
                      {ex.isKPI && <span className="workout-kpi-badge shrink-0">KPI</span>}
                    </div>
                    {ex.notes ? (
                      <p className="text-xs text-[color:var(--text-detail)] mt-1 whitespace-pre-wrap">
                        {ex.notes}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className="font-mono tabular-nums text-[color:var(--text-detail)] text-xs shrink-0 pt-0.5">
                  {ex.sets} × {ex.reps} · {ex.rest}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {session.cardio && (
        <div className="p-3 rounded-lg bg-[color:var(--surface-track)] space-y-1">
          <p className="text-sm font-medium text-[color:var(--text-0)]">{session.cardio.type}</p>
          <p className="text-xs text-[color:var(--text-detail)]">
            {session.cardio.duration} min
            {session.cardio.note ? ` · ${session.cardio.note}` : ''}
          </p>
          {session.cardio.intervals && (
            <p className="text-xs text-[color:var(--text-detail)] font-mono tabular-nums">
              {session.cardio.intervals.work}s work / {session.cardio.intervals.rest}s rest ×{' '}
              {session.cardio.intervals.rounds} rounds
            </p>
          )}
        </div>
      )}
      {hasBreath && (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">
            Breath work
          </p>
          <ul className="space-y-2">
            {breath.map((bw, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-[color:var(--text-0)]">{bw.name}</span>
                <span className="text-[color:var(--text-detail)] text-xs font-mono tabular-nums ml-2">
                  in {bw.inhale}s{bw.hold != null ? ` · hold ${bw.hold}s` : ''} · out {bw.exhale}s
                  {bw.holdOut != null ? ` · pause ${bw.holdOut}s` : ''} · {bw.rounds} rnd
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasCore && (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">
            Core
          </p>
          <div className="divide-y divide-[color:var(--chrome-border-subtle)]">
            {core.map((c, i) => (
              <div key={i} className="flex items-start justify-between gap-2 py-2 text-sm">
                <span className="text-[color:var(--text-0)]">{c.name}</span>
                <span className="font-mono tabular-nums text-[color:var(--text-detail)] text-xs shrink-0 text-right">
                  {c.sets}×{c.reps != null ? c.reps : c.holdSec != null ? `${c.holdSec}s` : '—'}
                  {c.perSide ? ' / side' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {hasMobility && (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">
            Mobility
          </p>
          <ul className="space-y-1.5">
            {mobility.map((m, i) => (
              <li
                key={i}
                className="text-sm text-[color:var(--text-detail)] pl-3 border-l-2 border-[color:color-mix(in_srgb,var(--accent)_28%,transparent)] leading-snug"
              >
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}
      {!hasAnyDetail && (
        <p className="text-sm text-[color:var(--text-detail)]">
          {session.type === 'lift'
            ? 'No exercises listed for this session yet.'
            : session.type === 'cardio'
              ? 'No cardio structure defined for this day.'
              : 'Recovery session — add mobility or notes in your program.'}
        </p>
      )}
    </div>
  );
}

const sessionTableTh =
  'text-left py-2.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-detail)]';
const sessionTableTd = 'py-2.5 px-3 align-top border-t border-[color:var(--chrome-border-subtle)]';
const sessionTableWrap =
  'overflow-x-auto rounded-lg border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)]';
const sessionTableHeader = 'bg-[color:var(--surface-track)]';
const sessionTableNumber = 'text-right font-mono tabular-nums text-[color:var(--text-detail)]';

function SessionProgramTable({ session }: { session: ProgramSession }) {
  const exercises = session.exercises ?? [];
  const breath = session.breathWork ?? [];
  const core = session.coreWork ?? [];
  const mobility = session.mobility ?? [];
  const cardio = session.cardio;

  const sessionNotes = session.notes?.trim();

  const corePrescription = (c: (typeof core)[number]) => {
    const bit = c.reps != null ? `${c.reps} reps` : c.holdSec != null ? `${c.holdSec}s hold` : '—';
    return `${c.sets}×${bit}${c.perSide ? ' / side' : ''}`;
  };

  return (
    <div className="space-y-6">
      {sessionNotes ? (
        <div className="p-3 rounded-lg border-l-4 border-[color:color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_7%,transparent)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-detail)] mb-1">
            Session notes
          </p>
          <p className="text-sm text-[color:var(--text-detail)] whitespace-pre-wrap">
            {sessionNotes}
          </p>
        </div>
      ) : null}

      {exercises.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)] mb-2">
            Lifts ({exercises.length})
          </p>
          <div className={sessionTableWrap}>
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className={sessionTableHeader}>
                  <th className={cn(sessionTableTh, 'w-10')}>#</th>
                  <th className={sessionTableTh}>Exercise</th>
                  <th className={cn(sessionTableTh, 'text-right w-[4.5rem]')}>Sets</th>
                  <th className={cn(sessionTableTh, 'text-right w-[5rem]')}>Reps</th>
                  <th className={cn(sessionTableTh, 'text-right w-[4.5rem]')}>Rest</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex, i) => (
                  <tr key={`${ex.exerciseId}-${i}`}>
                    <td
                      className={cn(
                        sessionTableTd,
                        'font-mono tabular-nums text-[color:var(--text-detail)]',
                      )}
                    >
                      {i + 1}
                    </td>
                    <td className={cn(sessionTableTd, 'text-[color:var(--text-0)]')}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{ex.name}</span>
                        {ex.isKPI ? <span className="workout-kpi-badge">KPI</span> : null}
                      </div>
                      {ex.notes ? (
                        <p className="text-xs text-[color:var(--text-detail)] mt-1.5 whitespace-pre-wrap leading-snug">
                          {ex.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className={cn(sessionTableTd, sessionTableNumber)}>{ex.sets}</td>
                    <td className={cn(sessionTableTd, sessionTableNumber)}>{ex.reps}</td>
                    <td
                      className={cn(
                        sessionTableTd,
                        'text-right font-mono tabular-nums text-[color:var(--text-detail)]',
                      )}
                    >
                      {ex.rest}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {cardio ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)] mb-2">
            Cardio
          </p>
          <div className={sessionTableWrap}>
            <table className="w-full text-sm">
              <thead>
                <tr className={sessionTableHeader}>
                  <th className={sessionTableTh}>Activity</th>
                  <th className={cn(sessionTableTh, 'text-right w-[6rem]')}>Time</th>
                  <th className={sessionTableTh}>Structure &amp; notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={cn(sessionTableTd, 'text-[color:var(--text-0)] font-medium')}>
                    {cardio.type}
                  </td>
                  <td className={cn(sessionTableTd, sessionTableNumber)}>{cardio.duration} min</td>
                  <td
                    className={cn(
                      sessionTableTd,
                      'text-[color:var(--text-detail)] text-xs leading-snug',
                    )}
                  >
                    {cardio.intervals ? (
                      <span className="font-mono tabular-nums block mb-1">
                        {cardio.intervals.work}s work / {cardio.intervals.rest}s rest ×{' '}
                        {cardio.intervals.rounds} rounds
                      </span>
                    ) : null}
                    {cardio.note ? (
                      <span className="whitespace-pre-wrap">{cardio.note}</span>
                    ) : null}
                    {!cardio.intervals && !cardio.note ? '—' : null}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {breath.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)] mb-2">
            Breath work
          </p>
          <div className={sessionTableWrap}>
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className={sessionTableHeader}>
                  <th className={sessionTableTh}>Protocol</th>
                  <th className={sessionTableTh}>Timing</th>
                  <th className={cn(sessionTableTh, 'text-right w-[5rem]')}>Rounds</th>
                </tr>
              </thead>
              <tbody>
                {breath.map((bw, i) => (
                  <tr key={`${bw.name}-${i}`}>
                    <td className={cn(sessionTableTd, 'text-[color:var(--text-0)] font-medium')}>
                      {bw.name}
                    </td>
                    <td
                      className={cn(
                        sessionTableTd,
                        'font-mono tabular-nums text-xs text-[color:var(--text-detail)]',
                      )}
                    >
                      in {bw.inhale}s{bw.hold != null ? ` · hold ${bw.hold}s` : ''} · out{' '}
                      {bw.exhale}s{bw.holdOut != null ? ` · pause ${bw.holdOut}s` : ''}
                    </td>
                    <td className={cn(sessionTableTd, sessionTableNumber)}>{bw.rounds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {core.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)] mb-2">
            Core
          </p>
          <div className={sessionTableWrap}>
            <table className="w-full text-sm">
              <thead>
                <tr className={sessionTableHeader}>
                  <th className={sessionTableTh}>Exercise</th>
                  <th className={cn(sessionTableTh, 'text-right w-[10rem]')}>Prescription</th>
                </tr>
              </thead>
              <tbody>
                {core.map((c, i) => (
                  <tr key={`${c.name}-${i}`}>
                    <td className={cn(sessionTableTd, 'text-[color:var(--text-0)]')}>{c.name}</td>
                    <td
                      className={cn(
                        sessionTableTd,
                        'text-right font-mono tabular-nums text-[color:var(--text-detail)] text-xs',
                      )}
                    >
                      {corePrescription(c)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {mobility.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)] mb-2">
            Mobility
          </p>
          <div className={sessionTableWrap}>
            <table className="w-full text-sm">
              <thead>
                <tr className={sessionTableHeader}>
                  <th className={sessionTableTh}>Focus</th>
                </tr>
              </thead>
              <tbody>
                {mobility.map((m, i) => (
                  <tr key={`${m}-${i}`}>
                    <td
                      className={cn(
                        sessionTableTd,
                        'text-[color:var(--text-detail)] pl-4 border-l-2 border-[color:color-mix(in_srgb,var(--accent)_28%,transparent)]',
                      )}
                    >
                      {m}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!sessionNotes &&
        exercises.length === 0 &&
        !cardio &&
        breath.length === 0 &&
        core.length === 0 &&
        mobility.length === 0 && (
          <p className="text-sm text-[color:var(--text-detail)]">
            {session.type === 'lift'
              ? 'No exercises listed for this session yet.'
              : session.type === 'cardio'
                ? 'No cardio structure defined for this day.'
                : 'Recovery session — add mobility or notes in your program.'}
          </p>
        )}
    </div>
  );
}

function SessionDetailModal({
  open,
  session,
  sessionTypeLabel,
  onClose,
  isViewingToday,
  hasLoggedWorkoutToday,
  onStartTodaySession,
  onGoTraining,
}: {
  open: boolean;
  session: ProgramSession | undefined;
  sessionTypeLabel: string;
  onClose: () => void;
  isViewingToday: boolean;
  hasLoggedWorkoutToday: boolean;
  onStartTodaySession: () => void;
  onGoTraining: () => void;
}) {
  if (!open || !session) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-2xl mx-0 sm:mx-4 glass-panel rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[color:var(--chrome-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[color:var(--chrome-border-subtle)] shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-[color:var(--accent-light)] shrink-0 mt-0.5">
              <Dumbbell size={22} className="text-current" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--text-2)]">
                Session breakdown
              </p>
              <h2 className="text-lg font-bold text-[color:var(--text-0)] leading-snug truncate">
                {session.name}
              </h2>
              <p className="text-xs text-[color:var(--text-detail)] mt-1">{sessionTypeLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[color:var(--text-1)] hover:text-[color:var(--accent-light)] hover:bg-[color:var(--surface-track)] shrink-0"
            aria-label="Close"
          >
            <X size={18} className="text-current" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <SessionProgramTable session={session} />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4 border-t border-[color:var(--chrome-border-subtle)] shrink-0 bg-[color:var(--surface-well)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[color:var(--text-detail)] border border-[color:var(--chrome-border)] hover:bg-[color:var(--surface-track)]"
          >
            Close
          </button>
          {isViewingToday ? (
            <button
              type="button"
              onClick={onStartTodaySession}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[color:var(--accent)] text-white hover:brightness-110 flex items-center gap-2"
            >
              {session.type === 'lift' ? (
                <>
                  <Dumbbell size={16} className="shrink-0 text-white" aria-hidden />
                  {hasLoggedWorkoutToday ? 'Open workout' : 'Start workout'}
                </>
              ) : session.type === 'recovery' ? (
                <>
                  <Activity size={16} className="shrink-0 text-white" aria-hidden />
                  Log recovery
                </>
              ) : (
                <>
                  <Dumbbell size={16} className="shrink-0 text-white" aria-hidden />
                  View training
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoTraining}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] text-[color:var(--accent)] hover:border-[color:color-mix(in_srgb,var(--accent)_65%,transparent)]"
            >
              Open training
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityContent({
  session,
  done,
  onStart,
  canStart,
}: {
  session: ProgramSession | undefined;
  done: boolean;
  onStart: () => void;
  canStart?: boolean;
}) {
  if (!session) return <p className="text-[color:var(--text-detail)]">No session data.</p>;
  return (
    <div className="space-y-4">
      <SessionProgramPreview session={session} />
      {done ? (
        <div className="flex items-center justify-center gap-2 py-3 text-[color:var(--good)]">
          <CheckCircle2 size={18} className="shrink-0 text-[color:var(--good)]" aria-hidden />
          <span className="font-semibold">Workout Complete</span>
        </div>
      ) : canStart === false ? (
        <p className="text-sm text-[color:var(--text-detail)] text-center py-3 px-2">
          Select today&apos;s cycle-day tab to start or log this session against your calendar.
        </p>
      ) : (
        <button
          onClick={onStart}
          className="w-full py-3 bg-[color:var(--accent)] text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          {session.type === 'lift' ? (
            <>
              <Dumbbell size={18} className="shrink-0 text-white" aria-hidden />
              Start Workout
            </>
          ) : session.type === 'recovery' ? (
            <>
              <Activity size={18} className="shrink-0 text-white" aria-hidden />
              Log recovery
            </>
          ) : (
            <>
              <Dumbbell size={18} className="shrink-0 text-white" aria-hidden />
              View training
            </>
          )}
        </button>
      )}
    </div>
  );
}

function ScheduleModal({
  item,
  onClose,
  session,
  nutrition,
  supplements,
  onStartWorkout,
  canStartWorkout,
  nutritionPlan,
  protocol,
}: {
  item: ScheduleItem;
  onClose: () => void;
  session: ProgramSession | undefined;
  nutrition: NutritionDay | null | undefined;
  supplements: SupplementLog | null | undefined;
  onStartWorkout: () => void;
  canStartWorkout?: boolean;
  nutritionPlan?: NutritionPlanSeed | null;
  protocol?: SupplementProtocol | null;
}) {
  const meta = KIND_META[item.kind];
  const p = item.payload;
  /* Portal: .dashboard-overview uses backdrop-filter, which creates a fixed-position
   * containing block — without a portal the overlay only covers that panel. */
  const modal = (
    <div
      className="fixed inset-0 z-[72] flex min-h-[100dvh] items-center justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5"
      onClick={onClose}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden />
      <div
        className="relative flex w-full min-h-0 max-w-2xl flex-col overflow-hidden rounded-2xl glass-panel dashboard-card-surface shadow-2xl max-h-[min(92dvh,52rem)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-[color:var(--chrome-border-subtle)] p-4 sm:p-5">
          <span className="inline-flex shrink-0 items-center justify-center rounded-md border border-[color:color-mix(in_srgb,var(--accent)_26%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] p-1.5">
            <meta.icon size={14} className="text-[color:var(--accent-light)]" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              id="schedule-modal-title"
              className="truncate font-semibold text-[color:var(--text-0)]"
            >
              {item.label}
            </h3>
            <p className="text-xs text-[color:var(--text-detail)]">{item.time}</p>
          </div>
          {item.done === true && (
            <CheckCircle2 size={15} className="dashboard-plan-done-icon shrink-0" aria-hidden />
          )}
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 text-[color:var(--text-detail)] transition-colors hover:text-[color:var(--accent-light)]"
            aria-label="Close"
          >
            <X size={16} className="text-current" aria-hidden />
          </button>
        </div>
        {/* Body — min-h-0 so flex child can shrink; overflow only when content exceeds viewport */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {p.kind === 'meal' && (
            <MealContent
              slotKey={p.slotKey}
              isLiftDay={p.isLiftDay}
              nutrition={nutrition}
              nutritionPlan={nutritionPlan}
            />
          )}
          {p.kind === 'vitamins' && (
            <VitaminsContent timing={p.timing} supplements={supplements} protocol={protocol} />
          )}
          {p.kind === 'activity' && (
            <ActivityContent
              session={session}
              done={item.done === true}
              onStart={onStartWorkout}
              canStart={canStartWorkout}
            />
          )}
        </div>
      </div>
    </div>
  );
  if (typeof document === 'undefined') return null;
  return createPortal(modal, document.body);
}

/* ─────────────────────────────────────────────────────────────────────
   Today's Schedule table
───────────────────────────────────────────────────────────────────── */
function TodaySchedule({
  session,
  isLiftDay,
  nutrition,
  supplements,
  todayDone,
  onActivityClick,
  scheduleTitle,
  dateBadge,
  previewHint,
  canStartWorkout,
  nutritionPlan: nutritionPlanProp,
  protocol: protocolProp,
}: {
  session: ProgramSession | undefined;
  isLiftDay: boolean;
  nutrition: NutritionDay | null | undefined;
  supplements: SupplementLog | null | undefined;
  todayDone: boolean;
  onActivityClick: () => void;
  scheduleTitle: string;
  dateBadge: string;
  previewHint?: string | null;
  canStartWorkout?: boolean;
  nutritionPlan?: NutritionPlanSeed | null;
  protocol?: SupplementProtocol | null;
}) {
  const nutritionPlan = nutritionPlanProp ?? mortonNutritionPlan;
  const protocol = protocolProp ?? mortonSupplementProtocol;

  const [selected, setSelected] = useState<ScheduleItem | null>(null);
  const items: ScheduleItem[] = [];

  /* — Meals — */
  for (const slot of nutritionPlan.mealSchedule) {
    if (slot.liftDayOnly && !isLiftDay) continue;
    const description = isLiftDay
      ? (slot.liftDay ?? slot.default)
      : (slot.recoveryDay ?? slot.default);
    const mealData = nutrition?.meals.find((m) => m.slot === slot.slot);
    items.push({
      sortKey: toMin(slot.time),
      time: slot.time,
      kind: 'meal',
      label: capitalize(slot.slot.replace('-', ' ')),
      detail: description,
      done: mealData ? mealData.completed : null,
      payload: { kind: 'meal', slotKey: slot.slot, isLiftDay },
    });
  }

  /* — Vitamins — */
  for (const win of protocol.windows) {
    const time = SUPPL_TIME[win.timing] ?? '00:00';
    const winData = supplements?.windows?.[win.timing];
    const takenCount = winData ? Object.values(winData).filter(Boolean).length : null;
    const total = win.supplements.length;
    const names =
      win.supplements.slice(0, 3).join(', ') +
      (win.supplements.length > 3 ? ` +${win.supplements.length - 3}` : '');
    items.push({
      sortKey: toMin(time) + 1,
      time,
      kind: 'vitamins',
      label: `${capitalize(win.timing)} Vitamins`,
      detail: names,
      done: takenCount !== null ? takenCount >= total : null,
      payload: { kind: 'vitamins', timing: win.timing },
    });
  }

  /* — Activity — */
  if (session) {
    items.push({
      sortKey: toMin('17:00'),
      time: '17:00',
      kind: 'activity',
      label: session.name,
      detail: session.exercises?.length
        ? `${session.exercises.length} exercises`
        : session.cardio
          ? `${session.cardio.type} · ${session.cardio.duration} min`
          : session.type,
      done: todayDone,
      payload: { kind: 'activity' },
    });
  }

  items.sort((a, b) => a.sortKey - b.sortKey);

  return (
    <>
      <div className="glass-panel dashboard-card-surface p-4 col-span-full">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Calendar size={18} className="text-[color:var(--text-detail)]" />
          <h3 className="font-semibold text-[color:var(--text-0)]">{scheduleTitle}</h3>
          <span className="text-xs text-[color:var(--text-detail)] ml-auto">{dateBadge}</span>
        </div>
        {previewHint && (
          <p className="text-xs text-[color:var(--text-detail)] mb-3 border-l-2 border-[color:color-mix(in_srgb,var(--accent)_42%,transparent)] pl-3 bg-[color:color-mix(in_srgb,var(--accent)_6%,transparent)] rounded-r-lg py-1">
            {previewHint}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[min(100%,52rem)]">
            <thead>
              <tr className="border-b border-[color:var(--chrome-border-subtle)]">
                <th className="pb-2 text-left pr-4 text-xs font-semibold text-[color:var(--text-detail)] uppercase tracking-wider whitespace-nowrap w-[4.5rem]">
                  Time
                </th>
                <th className="pb-2 text-left pr-4 text-xs font-semibold text-[color:var(--text-detail)] uppercase tracking-wider whitespace-nowrap w-[6.5rem]">
                  Type
                </th>
                <th className="pb-2 text-left pr-4 text-xs font-semibold text-[color:var(--text-detail)] uppercase tracking-wider whitespace-nowrap min-w-[7rem]">
                  Item
                </th>
                <th className="pb-2 text-left pr-4 text-xs font-semibold text-[color:var(--text-detail)] uppercase tracking-wider min-w-[12rem]">
                  Description
                </th>
                <th className="pb-2 text-right text-xs font-semibold text-[color:var(--text-detail)] uppercase tracking-wider whitespace-nowrap w-10">
                  <span className="sr-only">Status</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--chrome-border-subtle)]">
              {items.map((item, i) => {
                const meta = KIND_META[item.kind];
                return (
                  <tr
                    key={i}
                    onClick={() => setSelected(item)}
                    className={cn(
                      'cursor-pointer transition-colors group hover:bg-[color:color-mix(in_srgb,var(--accent)_7%,transparent)]',
                      item.done === true && 'opacity-50',
                    )}
                  >
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-[color:var(--text-detail)] text-xs whitespace-nowrap align-top">
                      {item.time}
                    </td>
                    <td className="py-2.5 pr-4 align-top">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[color:color-mix(in_srgb,var(--accent)_24%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)] text-[color:var(--text-detail)]">
                        <meta.icon
                          size={11}
                          className="text-[color:var(--accent-light)]"
                          aria-hidden
                        />
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 align-top">
                      <div className="flex items-start gap-2 min-w-0">
                        <span
                          className={cn(
                            'font-semibold leading-snug',
                            item.done
                              ? 'text-[color:var(--text-detail)]'
                              : 'text-[color:var(--text-0)]',
                          )}
                        >
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-semibold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5 text-[color:var(--accent-light)]',
                          )}
                        >
                          →
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 align-top min-w-0 max-w-xl">
                      {item.detail ? (
                        <p
                          className={cn(
                            'text-[13px] leading-relaxed text-[color:var(--text-detail)] break-words',
                            item.done && 'opacity-80',
                          )}
                        >
                          {item.detail}
                        </p>
                      ) : (
                        <span className="text-xs text-[color:var(--text-2)]/55">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right align-top">
                      {item.done === true ? (
                        <CheckCircle2
                          size={15}
                          className="dashboard-plan-done-icon inline-block mt-0.5"
                          aria-hidden
                        />
                      ) : item.done === false ? (
                        <span className="inline-block w-3.5 h-3.5 rounded-full border border-[color:var(--chrome-border-subtle)] mt-1" />
                      ) : (
                        <span className="text-xs text-[rgba(186,186,186,0.38)]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ScheduleModal
          item={selected}
          onClose={() => setSelected(null)}
          session={session}
          nutrition={nutrition}
          supplements={supplements}
          onStartWorkout={() => {
            setSelected(null);
            onActivityClick();
          }}
          canStartWorkout={canStartWorkout}
          nutritionPlan={nutritionPlan}
          protocol={protocol}
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Density card
───────────────────────────────────────────────────────────────────── */
function DensityCard({ workout, onOpen }: { workout: Workout; onOpen?: () => void }) {
  const [view, setView] = useState<'exercise' | 'bodypart'>('exercise');
  const { byExercise, byMuscle, totalVolume, durationMin, density } = calcDensity(workout);
  const rows = view === 'exercise' ? byExercise : byMuscle;
  const maxVol = Math.max(...rows.map((r) => r.volume), 1);

  return (
    <div
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={
        onOpen
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
      className={cn(
        'glass-panel dashboard-card-surface p-4 col-span-full space-y-4 text-left w-full',
        onOpen &&
          'cursor-pointer hover:border-[color:color-mix(in_srgb,var(--accent)_38%,transparent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/50',
      )}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-[color:var(--accent)]" />
          <div>
            <h3 className="font-semibold text-[color:var(--text-0)]">Training Density</h3>
            <p className="text-xs text-[color:var(--text-detail)]">
              {workout.sessionName} · {formatDisplayDate(workout.date)} · {durationMin} min
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          {[
            { label: 'Volume', value: `${Math.round(totalVolume).toLocaleString()} kg` },
            { label: 'Duration', value: `${durationMin} min` },
            { label: 'Density', value: `${density} kg/min`, gold: true },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xs text-[color:var(--text-detail)]">{s.label}</p>
              <p
                className={cn(
                  'font-mono tabular-nums font-bold',
                  s.gold ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-0)]',
                )}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <div
          className="flex rounded-xl overflow-hidden border border-[color:var(--chrome-border-subtle)]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {(['exercise', 'bodypart'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold capitalize transition-all',
                view === v
                  ? 'bg-[color:color-mix(in_srgb,var(--accent)_18%,transparent)] text-[color:var(--accent)]'
                  : 'text-[color:var(--text-detail)] hover:text-[color:var(--text-0)]',
              )}
            >
              By {v}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[color:var(--text-detail)]">No completed sets recorded.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-[color:var(--text-0)] capitalize truncate">
                    {row.label}
                  </span>
                  {view === 'exercise' && (
                    <span className="text-xs text-[color:var(--text-detail)] capitalize shrink-0">
                      {row.muscle}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono tabular-nums text-[color:var(--text-0)]">
                    {Math.round(row.volume).toLocaleString()} kg
                  </span>
                  <span className="font-mono tabular-nums text-[color:var(--accent)] text-xs w-20 text-right">
                    {Math.round(row.volume / durationMin)} kg/min
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[color:var(--surface-track)] ring-1 ring-inset ring-black/35">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(row.volume / maxVol) * 100}%`,
                    background: THEME_FILL_GRADIENT,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type TrendPresetDays = 7 | 14 | 21 | 28;

/* ─────────────────────────────────────────────────────────────────────
   Calendar trend window (workouts + physique chart; separate from cycle tabs)
───────────────────────────────────────────────────────────────────── */
function DashboardTrendWindow({
  trendKind,
  presetDays,
  onSelectPreset,
  customDraftFrom,
  customDraftTo,
  onChangeCustomDraft,
  onApplyCustom,
  customError,
  summary,
}: {
  trendKind: 'preset' | 'custom';
  presetDays: TrendPresetDays;
  onSelectPreset: (days: TrendPresetDays) => void;
  customDraftFrom: string;
  customDraftTo: string;
  onChangeCustomDraft: (patch: { from?: string; to?: string }) => void;
  onApplyCustom: () => void;
  customError: string;
  summary: string;
}) {
  const weekChips: { label: string; days: TrendPresetDays }[] = [
    { label: '1 wk', days: 7 },
    { label: '2 wk', days: 14 },
    { label: '3 wk', days: 21 },
    { label: '4 wk', days: 28 },
  ];

  const inputClass =
    'rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums min-w-0 ' +
    'bg-[color:var(--bg-2)] border border-[color:var(--panel-border)] text-[color:var(--text-0)] ' +
    'focus:border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] ' +
    'focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_10%,transparent)] focus:outline-none ' +
    'transition-all duration-200 [color-scheme:dark]';

  return (
    <div className="glass-panel dashboard-card-surface px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="data-label">Trend window</span>
        <span className="text-[10px] text-[color:var(--text-detail)] font-mono tabular-nums">
          {summary}
        </span>
      </div>
      <p className="text-[10px] text-[color:var(--text-2)] leading-snug">
        Workouts and the physique chart use this calendar range. The day strip below lists every
        date in the range — select one to preview that day&apos;s planned session.
      </p>

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-x-4 lg:gap-y-2">
        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Presets by week length"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)] shrink-0">
            Weeks
          </span>
          <div className="flex flex-wrap gap-1.5">
            {weekChips.map(({ label, days }) => {
              const active = trendKind === 'preset' && presetDays === days;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => onSelectPreset(days)}
                  className={cn(
                    'shrink-0 min-w-[2.75rem] px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border',
                    active
                      ? 'is-selected text-[color:var(--text-0)]'
                      : 'border-[color:var(--chrome-border)] text-[color:var(--text-1)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[color:var(--text-0)]',
                  )}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div
          role="group"
          aria-label="Custom date range"
          className="flex flex-wrap items-end gap-2 pt-1 border-t border-[color:var(--chrome-border-subtle)] lg:border-t-0 lg:pt-0 lg:ml-auto lg:pl-4 lg:border-l lg:border-[color:var(--chrome-border-subtle)]"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <label
              htmlFor="dash-trend-from"
              className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-2)]"
            >
              From
            </label>
            <input
              id="dash-trend-from"
              type="date"
              value={customDraftFrom}
              onChange={(e) => onChangeCustomDraft({ from: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <label
              htmlFor="dash-trend-to"
              className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-2)]"
            >
              To
            </label>
            <input
              id="dash-trend-to"
              type="date"
              value={customDraftTo}
              onChange={(e) => onChangeCustomDraft({ to: e.target.value })}
              className={inputClass}
            />
          </div>
          <button
            type="button"
            onClick={onApplyCustom}
            className="btn-secondary text-xs px-3 py-2 shrink-0 self-end"
          >
            Apply range
          </button>
        </div>
      </div>

      {customError ? (
        <p className="text-xs text-[color:var(--warn)]" role="alert">
          {customError}
        </p>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   One tab per calendar day in the trend range (session = program cycle for that date)
───────────────────────────────────────────────────────────────────── */
function TrendRangeDayTabs({
  dates,
  selectedDate,
  todayStr,
  onSelect,
}: {
  dates: string[];
  selectedDate: string;
  todayStr: string;
  onSelect: (date: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--text-2)]">
        Days in range
      </p>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {dates.map((dateStr) => {
          const isSelected = dateStr === selectedDate;
          const isCalendarToday = dateStr === todayStr;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelect(dateStr)}
              className={cn(
                'im-tooltip-trigger shrink-0 min-w-[2.75rem] px-2.5 py-2 rounded-lg text-xs font-mono tabular-nums transition-all border',
                isSelected
                  ? 'is-selected text-[color:var(--text-0)]'
                  : 'border-[color:var(--chrome-border)] text-[color:var(--text-1)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[color:var(--text-0)]',
              )}
              aria-pressed={isSelected}
              data-tooltip={
                isCalendarToday
                  ? `Today · ${formatDisplayDate(dateStr)}`
                  : formatDisplayDate(dateStr)
              }
            >
              {formatShortDate(dateStr)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Main dashboard
───────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const { data: savedWorkoutMediaUrl } = useWorkoutMediaPreference(userId);
  const { mutate: saveWorkoutMediaPreference } = useSaveWorkoutMediaPreference(userId);

  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);
  const [trainingMediaOpen, setTrainingMediaOpen] = useState(false);

  const todayStr = today();

  const [trendKind, setTrendKind] = useState<'preset' | 'custom'>('preset');
  const [trendPresetDays, setTrendPresetDays] = useState<TrendPresetDays>(7);
  const [customDraft, setCustomDraft] = useState<{ from: string; to: string }>({
    from: '',
    to: '',
  });
  const [customApplied, setCustomApplied] = useState<{ from: string; to: string } | null>(null);
  const [customError, setCustomError] = useState('');

  useEffect(() => {
    if (consumeDashboardTrendWindowFourWeeksBootstrap()) {
      setTrendKind('preset');
      setTrendPresetDays(28);
      setCustomApplied(null);
      setCustomDraft({ from: '', to: '' });
      setCustomError('');
    }
  }, []);

  const trendBounds = useMemo(() => {
    if (trendKind === 'preset') {
      const to = todayStr;
      const from = format(subDays(parseISO(to), trendPresetDays), 'yyyy-MM-dd');
      return { from, to };
    }
    if (customApplied) return { ...customApplied };
    return { from: todayStr, to: todayStr };
  }, [trendKind, trendPresetDays, customApplied, todayStr]);

  const trendSummary = useMemo(
    () => `${formatDisplayDate(trendBounds.from)} – ${formatDisplayDate(trendBounds.to)}`,
    [trendBounds.from, trendBounds.to],
  );

  const trendDateList = useMemo(
    () => getDaysInRange(trendBounds.from, trendBounds.to),
    [trendBounds.from, trendBounds.to],
  );

  const [selectedTrendDate, setSelectedTrendDate] = useState(todayStr);

  useEffect(() => {
    const from = trendBounds.from;
    const to = trendBounds.to;
    setSelectedTrendDate((cur) => {
      if (cur >= from && cur <= to) return cur;
      if (todayStr >= from && todayStr <= to) return todayStr;
      return to;
    });
  }, [trendBounds.from, trendBounds.to, todayStr]);

  const { profile, activeProgram, weeklyVolume, isLoading } = useDashboardData(userId);

  const { data: selectedDayNutrition } = useNutritionDay(userId, selectedTrendDate);
  const { data: selectedDayRecovery } = useRecoveryEntry(userId, selectedTrendDate);
  const { data: selectedDaySupplements } = useSupplementLog(userId, selectedTrendDate);

  const { data: presetWorkouts } = useRecentWorkouts(userId, trendPresetDays, {
    enabled: trendKind === 'preset',
  });
  const { data: customWorkouts } = useWorkouts(
    userId,
    trendKind === 'custom' && customApplied ? customApplied : undefined,
    { enabled: trendKind === 'custom' && !!customApplied },
  );
  const recentWorkouts = trendKind === 'preset' ? presetWorkouts : customWorkouts;

  /* Same source as Physique tab (`useCheckIns`) so demo seeds + cache keys stay aligned. */
  const { data: physiqueCheckIns } = useCheckIns(userId);
  const physiqueCheckInsForTrend = useMemo(() => {
    const list = physiqueCheckIns ?? [];
    const { from, to } = trendBounds;
    return list
      .map((c) => {
        const d = toDateOnlyKey(c.date);
        return { ...c, date: d || c.date };
      })
      .filter((c) => c.date >= from && c.date <= to);
  }, [physiqueCheckIns, trendBounds]);

  const { data: nutritionPlanData } = useNutritionPlan(userId);
  const { data: protocolData } = useProtocol(userId);

  const activePlan = nutritionPlanData ?? mortonNutritionPlan;
  const activeProtocol = protocolData ?? mortonSupplementProtocol;

  const cycleDayForSelected = useMemo(() => {
    if (!activeProgram) return null;
    return getCycleDay(
      activeProgram.startDate ?? todayStr,
      selectedTrendDate,
      activeProgram.cycleLengthDays,
    );
  }, [activeProgram, selectedTrendDate, todayStr]);

  const selectedSession =
    cycleDayForSelected != null
      ? findProgramSessionForCycleDay(activeProgram?.sessions, cycleDayForSelected)
      : undefined;
  const isLiftForSelected = selectedSession?.type === 'lift';
  const isViewingToday = selectedTrendDate === todayStr;

  const selectedDayWorkout = useMemo(
    () => recentWorkouts?.find((w) => w.date === selectedTrendDate),
    [recentWorkouts, selectedTrendDate],
  );

  const hasCompletedWorkoutSelected = useMemo(() => {
    if (!selectedDayWorkout) return false;
    return selectedDayWorkout.exercises.some((ex) => ex.sets.some((s) => s.completed));
  }, [selectedDayWorkout]);

  const recoveryEntry = selectedDayRecovery ?? undefined;

  const scheduleTitle = isViewingToday
    ? "Today's Schedule"
    : `${formatDisplayDate(selectedTrendDate)} — Plan`;
  const dateBadge = isViewingToday
    ? formatDisplayDate(todayStr)
    : formatDisplayDate(selectedTrendDate);
  const previewHint = !isViewingToday
    ? 'Logged meals, supplements, and recovery below follow the date selected in the strip. Start a new workout from Training when viewing today.'
    : null;

  const dashboardSubtitle =
    activeProgram && cycleDayForSelected != null
      ? `Day ${cycleDayForSelected} of ${activeProgram.cycleLengthDays} — ${selectedSession?.name ?? 'Rest Day'} · ${formatDisplayDate(selectedTrendDate)}`
      : formatDisplayDate(selectedTrendDate);

  if (isLoading) {
    return (
      <div className="dashboard-overview flex min-h-[40vh] items-center justify-center">
        <div className="spinner spinner-lg" aria-hidden />
      </div>
    );
  }

  return (
    <>
      <SessionDetailModal
        open={sessionDetailOpen}
        session={selectedSession}
        sessionTypeLabel={
          selectedSession?.type === 'lift'
            ? 'Strength'
            : selectedSession?.type === 'cardio'
              ? 'Cardio / conditioning'
              : 'Recovery'
        }
        onClose={() => setSessionDetailOpen(false)}
        isViewingToday={isViewingToday}
        hasLoggedWorkoutToday={hasCompletedWorkoutSelected}
        onStartTodaySession={() => {
          setSessionDetailOpen(false);
          if (!selectedSession) return;
          if (isViewingToday && sessionTypeUsesMediaGate(selectedSession.type)) {
            setTrainingMediaOpen(true);
            return;
          }
          router.push(routeForTodaySessionStart(selectedSession, selectedTrendDate));
        }}
        onGoTraining={() => {
          setSessionDetailOpen(false);
          router.push('/training');
        }}
      />

      <TrainingMediaModal
        open={trainingMediaOpen}
        sessionTitle={selectedSession?.name}
        initialLastYouTubeUrl={savedWorkoutMediaUrl}
        onClose={() => setTrainingMediaOpen(false)}
        onContinue={(result) => {
          saveWorkoutMediaPreference(result.youtubeUrl);
          setTrainingMediaOpen(false);
          if (selectedSession)
            router.push(
              appendMediaGateBypass(postSessionMediaHref(selectedSession, selectedTrendDate)),
            );
          else router.push('/training/workout?media=1');
        }}
      />

      <div className="dashboard-overview space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-[color:var(--accent)]">Dashboard</h1>
          <p className="text-[color:var(--text-detail)]">{dashboardSubtitle}</p>
        </header>

        <DashboardTrendWindow
          trendKind={trendKind}
          presetDays={trendPresetDays}
          onSelectPreset={(d) => {
            setTrendKind('preset');
            setTrendPresetDays(d);
            setCustomError('');
          }}
          customDraftFrom={customDraft.from}
          customDraftTo={customDraft.to}
          onChangeCustomDraft={(patch) => setCustomDraft((prev) => ({ ...prev, ...patch }))}
          onApplyCustom={() => {
            setCustomError('');
            const from = customDraft.from;
            const to = customDraft.to;
            if (!from || !to) {
              setCustomError('Choose both start and end dates.');
              return;
            }
            if (from > to) {
              setCustomError('Start date must be on or before end date.');
              return;
            }
            const span = differenceInCalendarDays(parseISO(to), parseISO(from)) + 1;
            if (span > 366) {
              setCustomError('Range cannot exceed 366 days.');
              return;
            }
            setTrendKind('custom');
            setCustomApplied({ from, to });
          }}
          customError={customError}
          summary={trendSummary}
        />

        {trendDateList.length > 0 && (
          <TrendRangeDayTabs
            dates={trendDateList}
            selectedDate={selectedTrendDate}
            todayStr={todayStr}
            onSelect={setSelectedTrendDate}
          />
        )}

        {/* Schedule + selected trend date */}
        <section key={selectedTrendDate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <TodaySchedule
              session={selectedSession}
              isLiftDay={isLiftForSelected ?? false}
              nutrition={selectedDayNutrition}
              supplements={selectedDaySupplements}
              todayDone={hasCompletedWorkoutSelected}
              onActivityClick={() => {
                if (
                  selectedSession &&
                  isViewingToday &&
                  sessionTypeUsesMediaGate(selectedSession.type)
                ) {
                  setTrainingMediaOpen(true);
                  return;
                }
                if (selectedSession)
                  router.push(routeForTodaySessionStart(selectedSession, selectedTrendDate));
                else router.push('/training');
              }}
              scheduleTitle={scheduleTitle}
              dateBadge={dateBadge}
              previewHint={previewHint}
              canStartWorkout={isViewingToday}
              nutritionPlan={activePlan}
              protocol={activeProtocol}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Session | Recovery+Physique — two cols on lg+; right stack matches session column height */}
            <div className="col-span-full grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-4">
              <Card
                className="min-h-0 lg:flex lg:flex-col lg:h-full"
                title={
                  isViewingToday
                    ? "Today's Session"
                    : cycleDayForSelected != null
                      ? `Day ${cycleDayForSelected} — Session plan`
                      : 'Session plan'
                }
                icon={<Dumbbell size={20} />}
                iconColor="text-[color:var(--accent)]"
                selected
                onClick={() => {
                  if (selectedSession) setSessionDetailOpen(true);
                  else router.push('/training');
                }}
              >
                {selectedSession ? (
                  <div className="flex min-h-0 flex-1 flex-col space-y-3">
                    <p className="font-medium text-[color:var(--text-0)]">{selectedSession.name}</p>
                    <p className="text-xs text-[color:var(--text-detail)]">
                      {selectedSession.type === 'lift' && 'Strength'}
                      {selectedSession.type === 'cardio' && 'Cardio / conditioning'}
                      {selectedSession.type === 'recovery' && 'Recovery'}
                    </p>
                    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 -mr-0.5 max-h-[min(72vh,42rem)] lg:max-h-none">
                      <SessionProgramPreview session={selectedSession} />
                    </div>
                    <div className="border-t border-[color:var(--chrome-border-subtle)] pt-3 space-y-1.5 shrink-0">
                      <p className="text-xs text-[color:var(--accent)]/90 font-medium">
                        {isViewingToday
                          ? selectedSession.type === 'lift'
                            ? hasCompletedWorkoutSelected
                              ? 'Open workout →'
                              : 'Start workout →'
                            : selectedSession.type === 'recovery'
                              ? 'Log recovery →'
                              : 'View training →'
                          : 'Open training →'}
                      </p>
                      {!isViewingToday && (
                        <p className="text-[10px] text-[color:var(--text-detail)] leading-snug">
                          Logging runs on calendar today when you select today&apos;s date in the
                          strip above.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[color:var(--text-detail)]">Rest day — focus on recovery</p>
                )}
              </Card>

              <div className="flex min-h-0 flex-col gap-4 lg:h-full lg:min-h-0">
                <Card
                  className="shrink-0 lg:min-h-0"
                  title="Recovery"
                  icon={<Activity size={20} />}
                  iconColor="text-[color:var(--accent)]"
                  onClick={() => router.push('/recovery')}
                >
                  {!recoveryEntry ? (
                    <div className="space-y-3">
                      <p className="text-[color:var(--text-detail)]">
                        No recovery logged for {formatDisplayDate(selectedTrendDate)}.
                      </p>
                      <p className="text-xs text-[color:var(--accent)]/90 font-medium">
                        Log on Recovery page →
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-detail)]">
                        {isViewingToday ? 'Today' : formatDisplayDate(selectedTrendDate)}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold font-mono tabular-nums text-[color:var(--text-0)]">
                          {Math.round(recoveryEntry.readinessScore)}
                        </span>
                        <span className="text-sm text-[color:var(--text-detail)]">/100</span>
                      </div>
                      <p className="text-sm text-[color:var(--text-detail)]">
                        Sleep: {recoveryEntry.sleepHours}h · HRV: {recoveryEntry.hrv}
                      </p>
                      <p className="text-xs text-[color:var(--accent)]/90 font-medium pt-1">
                        Open recovery →
                      </p>
                    </div>
                  )}
                </Card>

                <Card
                  className="min-h-0 flex-1 lg:flex lg:flex-col"
                  title="Physique"
                  icon={<Scale size={20} />}
                  iconColor="text-[color:var(--accent)]"
                  onClick={() => router.push('/physique')}
                >
                  <div className="flex min-h-0 flex-1 flex-col space-y-2">
                    <div className="flex items-baseline justify-between gap-2 shrink-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold font-mono tabular-nums text-[color:var(--text-0)]">
                          {profile?.currentWeight ?? '—'}
                        </span>
                        <span className="text-sm text-[color:var(--text-detail)]">kg</span>
                      </div>
                      <BarChart3
                        size={18}
                        className="text-[color:var(--accent)]/60 shrink-0"
                        aria-hidden
                      />
                    </div>
                    <p className="text-sm text-[color:var(--text-detail)] shrink-0">
                      Target: {profile?.targetWeight ?? '—'} kg
                    </p>
                    <div className="min-h-0 flex-1">
                      <PhysiqueMiniCharts
                        checkIns={physiqueCheckInsForTrend}
                        targetWeight={profile?.targetWeight}
                        emptyHint={
                          (physiqueCheckIns?.length ?? 0) > 0 &&
                          physiqueCheckInsForTrend.length === 0
                            ? 'No check-ins in this date range. Widen the trend window or open Physique to log.'
                            : undefined
                        }
                      />
                    </div>
                    <p className="text-xs text-[color:var(--accent)]/80 font-medium shrink-0">
                      Full check-in &amp; history →
                    </p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Full-width row: nutrition + supplements — two equal columns spanning same width as other full-width panels */}
            <div className="col-span-full grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
              <Card
                className="min-w-0"
                title={
                  isViewingToday
                    ? "Today's Nutrition"
                    : `Nutrition · ${formatShortDate(selectedTrendDate)}`
                }
                icon={<TrendingUp size={20} />}
                iconColor="text-[color:var(--accent)]"
                onClick={() => router.push('/nutrition')}
              >
                {selectedDayNutrition ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[color:var(--text-detail)]">Protein</span>
                      <span className="font-mono tabular-nums text-[color:var(--text-0)]">
                        {Math.round(selectedDayNutrition.macroActuals.protein)}g /{' '}
                        {selectedDayNutrition.macroTargets.protein}g
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[color:var(--text-detail)]">Meals</span>
                      <span className="font-mono tabular-nums text-[color:var(--text-0)]">
                        {selectedDayNutrition.meals.filter((m) => m.completed).length}/
                        {selectedDayNutrition.meals.length} eaten
                      </span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-[color:var(--surface-track)] ring-1 ring-inset ring-black/35">
                      <div
                        className="h-full bg-[color:var(--accent)] rounded-full transition-all"
                        style={{ width: `${Math.min(100, selectedDayNutrition.complianceScore)}%` }}
                      />
                    </div>
                    <p className="text-xs text-[color:var(--accent)]/80 font-medium pt-1">
                      Open nutrition →
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[color:var(--text-detail)]">
                      No meals logged for {formatDisplayDate(selectedTrendDate)}.
                    </p>
                    <p className="text-xs text-[color:var(--accent)]/80 font-medium pt-2">
                      Open nutrition →
                    </p>
                  </>
                )}
              </Card>

              <Card
                className="min-w-0"
                title={
                  isViewingToday
                    ? 'Supplements'
                    : `Supplements · ${formatShortDate(selectedTrendDate)}`
                }
                icon={<Pill size={20} />}
                iconColor="text-[color:var(--accent)]"
                onClick={() => router.push('/supplements')}
              >
                {selectedDaySupplements ? (
                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono tabular-nums text-[color:var(--text-0)]">
                        {selectedDaySupplements.compliancePercent}
                      </span>
                      <span className="text-sm text-[color:var(--text-detail)]">%</span>
                    </div>
                    <p className="text-sm text-[color:var(--text-detail)]">
                      {isViewingToday
                        ? 'Compliance today'
                        : `Compliance · ${formatShortDate(selectedTrendDate)}`}
                    </p>
                    <p className="text-xs text-[color:var(--accent)]/80 font-medium">
                      Open supplements →
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-[color:var(--text-detail)]">
                      No supplement log for {formatDisplayDate(selectedTrendDate)}.
                    </p>
                    <p className="text-xs text-[color:var(--accent)]/80 font-medium pt-2">
                      Open supplements →
                    </p>
                  </>
                )}
              </Card>
            </div>

            {selectedDayWorkout && hasCompletedWorkoutSelected && (
              <DensityCard workout={selectedDayWorkout} />
            )}
          </div>
        </section>

        {/* Weekly volume — not driven by cycle tab */}
        {weeklyVolume && weeklyVolume.length > 0 && (
          <section
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Weekly training volume"
          >
            <Card
              title="Weekly Volume vs Landmarks"
              icon={<TrendingUp size={20} />}
              iconColor="text-[color:var(--text-1)]"
              fullWidth
            >
              <div className="space-y-3">
                {weeklyVolume.map(
                  (muscle: {
                    muscleGroup: string;
                    currentSets: number;
                    targetSets: number;
                    mev: number;
                    mav: number;
                    mrv: number;
                  }) => (
                    <div key={muscle.muscleGroup} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-[color:var(--text-0)] capitalize">
                          {muscle.muscleGroup}
                        </span>
                        <span className="font-mono tabular-nums text-[color:var(--text-detail)]">
                          {muscle.currentSets} / {muscle.targetSets} sets
                        </span>
                      </div>
                      <div className="h-2 bg-[color:var(--surface-track)] rounded-full overflow-hidden relative ring-1 ring-inset ring-black/35">
                        <div
                          className="absolute top-0 left-0 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (muscle.currentSets / muscle.mrv) * 100)}%`,
                            background: THEME_FILL_GRADIENT,
                          }}
                        />
                      </div>
                    </div>
                  ),
                )}
                <div className="flex gap-4 pt-1">
                  {[['var(--accent-light)', 'Current']].map(([c, l]) => (
                    <div
                      key={l}
                      className="flex items-center gap-1.5 text-xs text-[color:var(--text-detail)]"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                      {l}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </section>
        )}
      </div>
    </>
  );
}

function Card({
  title,
  icon,
  iconColor,
  children,
  fullWidth = false,
  selected = false,
  className,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
  fullWidth?: boolean;
  selected?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const interactive = typeof onClick === 'function';
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={cn(
        `glass-panel dashboard-card-surface p-4 card-hover ${fullWidth ? 'col-span-full' : ''}`,
        selected && 'is-selected',
        interactive &&
          'cursor-pointer select-none hover:border-[color:color-mix(in_srgb,var(--accent)_38%,transparent)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/55',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={iconColor}>{icon}</span>
        <h3 className="font-medium text-[color:var(--text-0)]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
