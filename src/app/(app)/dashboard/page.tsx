'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useDashboardData, useActiveProgram, useRecentWorkouts, useRecentCheckIns } from '@/controllers';
import { getCycleDay, today, formatDisplayDate } from '@/lib/utils';
import {
  Activity, Dumbbell, Scale, Pill, FileText, TrendingUp, Zap,
  Calendar, CheckCircle2, X, BarChart3,
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
import type {
  Workout,
  NutritionDay,
  SupplementLog,
  ProgramSession,
  CheckIn,
  Measurements,
  JournalEntry,
} from '@/lib/types';
import { morganNutritionPlan } from '@/lib/seed/nutrition';
import { morganSupplementProtocol } from '@/lib/seed/supplements';

/* ─────────────────────────────────────────────────────────────────────
   Muscle / density helpers
───────────────────────────────────────────────────────────────────── */
const MUSCLE_PATTERNS: [RegExp, string][] = [
  [/bench|chest|pec|fly|flye|cable cross|dip/i,       'chest'],
  [/row|pull|lat|chin|deadlift|pulldown|rear delt/i,   'back'],
  [/squat|leg press|hack|lunge|quad|leg ext/i,         'quads'],
  [/hamstring|rdl|stiff|good morning|leg curl/i,       'hamstrings'],
  [/ohp|shoulder|delt|lateral raise|shrug/i,           'delts'],
  [/curl|bicep|hammer|preacher/i,                      'biceps'],
  [/tricep|pushdown|extension|close grip|skull/i,      'triceps'],
  [/calf/i,                                            'calves'],
];
function inferMuscle(name: string) {
  for (const [re, g] of MUSCLE_PATTERNS) if (re.test(name)) return g;
  return 'other';
}

function calcDensity(workout: Workout) {
  type Row = { label: string; muscle: string; volume: number; sets: number };
  const byExercise: Row[] = workout.exercises.map(ex => ({
    label: ex.name,
    muscle: ex.muscleGroup || inferMuscle(ex.name),
    volume: ex.sets.filter(s => s.completed).reduce((s, set) => s + set.weight * set.reps, 0),
    sets: ex.sets.filter(s => s.completed).length,
  })).filter(r => r.volume > 0);

  const byMuscleMap: Record<string, Row> = {};
  for (const ex of byExercise) {
    if (!byMuscleMap[ex.muscle]) byMuscleMap[ex.muscle] = { label: ex.muscle, muscle: ex.muscle, volume: 0, sets: 0 };
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
  morning: '07:30', lunch: '13:00', afternoon: '16:00', dinner: '19:30', bed: '22:00',
};
const KIND_META = {
  meal: {
    label: 'Meal',
    color: 'text-[#34D399]',
    bg: 'bg-[rgba(16,185,129,0.11)]',
    border: 'border-[rgba(16,185,129,0.32)]',
  },
  vitamins: {
    label: 'Vitamins',
    color: 'text-[#D8B4FE]',
    bg: 'bg-[rgba(167,139,250,0.12)]',
    border: 'border-[rgba(167,139,250,0.30)]',
  },
  activity: {
    label: 'Activity',
    color: 'text-[#FBBF24]',
    bg: 'bg-[rgba(245,158,11,0.12)]',
    border: 'border-[rgba(245,158,11,0.32)]',
  },
};

type MealPayload     = { kind: 'meal';     slotKey: string; isLiftDay: boolean };
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
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

const MEASUREMENT_SERIES: { key: keyof Measurements; label: string; color: string }[] = [
  { key: 'waist', label: 'Waist', color: '#EF4444' },
  { key: 'chest', label: 'Chest', color: '#DC2626' },
  { key: 'hips', label: 'Hips', color: '#F59E0B' },
  { key: 'leftArm', label: 'L arm', color: '#10B981' },
  { key: 'rightArm', label: 'R arm', color: '#22C55E' },
  { key: 'leftThigh', label: 'L thigh', color: '#A855F7' },
  { key: 'rightThigh', label: 'R thigh', color: '#EC4899' },
];

function PhysiqueMiniCharts({
  checkIns,
  targetWeight,
}: {
  checkIns: CheckIn[] | undefined;
  targetWeight: number | undefined;
}) {
  const [mode, setMode] = useState<'weight' | 'measurements'>('weight');
  const chron = (checkIns ?? []).slice().reverse();

  const weightRows = chron.map((c) => ({
    date: formatDisplayDate(c.date).slice(0, 5),
    weight: c.bodyweight,
  }));

  const measRows = chron.map((c) => {
    const row: Record<string, string | number | undefined> = {
      date: formatDisplayDate(c.date).slice(0, 5),
    };
    const m = c.measurements ?? {};
    for (const { key } of MEASUREMENT_SERIES) {
      const v = m[key];
      if (typeof v === 'number') row[key as string] = v;
    }
    return row;
  });

  const hasMeas = measRows.some((row) =>
    MEASUREMENT_SERIES.some(({ key }) => typeof row[key as string] === 'number')
  );

  if (!chron.length) {
    return (
      <p className="text-sm text-[color:var(--text-detail)]">
        No check-ins yet — open Physique to log bodyweight and measurements.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5E5E5E]">Trend</span>
        <div className="flex rounded-lg overflow-hidden border border-[rgba(65,50,50,0.35)]">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMode('weight');
            }}
            className={cn(
              'px-3 py-1 text-xs font-semibold transition-colors',
              mode === 'weight'
                ? 'bg-[rgba(220,38,38,0.2)] text-[#F5F5F5]'
                : 'text-[#9A9A9A] hover:text-[#F0F0F0]'
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
                ? 'bg-[rgba(220,38,38,0.2)] text-[#F5F5F5]'
                : 'text-[#9A9A9A] hover:text-[#F0F0F0]',
              !hasMeas && 'opacity-40 cursor-not-allowed'
            )}
          >
            Measurements
          </button>
        </div>
        <span className="text-[10px] text-[color:var(--text-detail)] ml-auto font-mono tabular-nums">{chron.length} pts</span>
      </div>

      <div className="h-[132px] w-full">
        {mode === 'weight' && weightRows.length >= 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weightRows} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="dashPhysWeight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,50,50,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#B8B8B8' }} tickLine={false} axisLine={false} />
              <YAxis
                domain={[
                  (min: number) => Math.floor(min - 0.5),
                  (max: number) => Math.ceil(max + 0.5),
                ]}
                tick={{ fontSize: 9, fill: '#B8B8B8' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,10,10,0.95)',
                  border: '1px solid rgba(65,50,50,0.4)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: '#9A9A9A' }}
                formatter={(v) => [`${typeof v === 'number' ? v : '—'} kg`, 'Weight']}
              />
              {targetWeight != null && (
                <ReferenceLine
                  y={targetWeight}
                  stroke="rgba(16,185,129,0.45)"
                  strokeDasharray="4 4"
                />
              )}
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#F59E0B"
                fill="url(#dashPhysWeight)"
                strokeWidth={2}
                dot={{ r: 3, fill: '#F59E0B' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : mode === 'measurements' && hasMeas ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={measRows} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(65,50,50,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#B8B8B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#B8B8B8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,10,10,0.95)',
                  border: '1px solid rgba(65,50,50,0.4)',
                  borderRadius: 12,
                  fontSize: 12,
                }}
              />
              {MEASUREMENT_SERIES.map(({ key, color }) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key as string}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={{ r: 2, fill: color }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-xs text-[color:var(--text-detail)]">
            Add a second check-in to see the weight line.
          </div>
        )}
      </div>
    </div>
  );
}

function CoachingNotesModal({
  open,
  notes,
  onClose,
}: {
  open: boolean;
  notes: JournalEntry[] | undefined;
  onClose: () => void;
}) {
  if (!open) return null;
  const primary = notes?.[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-lg mx-0 sm:mx-4 glass-panel rounded-t-2xl sm:rounded-2xl max-h-[88vh] overflow-hidden flex flex-col border border-[rgba(65,50,50,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[rgba(65,50,50,0.25)]">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#DC2626]" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#5E5E5E]">Coaching</p>
              <h2 className="text-lg font-bold text-[#F5F5F5]">Latest notes</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#9A9A9A] hover:text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.05)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {primary ? (
            <>
              <article className="space-y-3">
                <h3 className="text-xl font-semibold text-[#F5F5F5] leading-snug">{primary.title}</h3>
                <p className="text-xs font-mono tabular-nums text-[#9A9A9A]">{formatDisplayDate(primary.date)}</p>
                <p className="text-[#D4D4D4] whitespace-pre-wrap leading-relaxed text-[15px]">{primary.content}</p>
                {primary.tags?.length ? (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {primary.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-[rgba(220,38,38,0.12)] text-[#DC2626] border border-[rgba(220,38,38,0.25)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
              {notes && notes.length > 1 && (
                <div className="border-t border-[rgba(65,50,50,0.2)] pt-5 space-y-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5E5E5E]">
                    Earlier entries
                  </p>
                  <ul className="space-y-3">
                    {notes.slice(1).map((n) => (
                      <li key={n.id} className="rounded-xl border border-[rgba(65,50,50,0.2)] p-3 bg-[rgba(0,0,0,0.2)]">
                        <p className="font-medium text-[#F5F5F5]">{n.title}</p>
                        <p className="text-[10px] text-[color:var(--text-detail)] font-mono tabular-nums mt-1">
                          {formatDisplayDate(n.date)}
                        </p>
                        <p className="text-sm text-[#9A9A9A] mt-2 line-clamp-3 whitespace-pre-wrap">{n.content}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-[#9A9A9A] text-center py-8">No coaching notes yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Modal content components
───────────────────────────────────────────────────────────────────── */
function MealContent({ slotKey, isLiftDay, nutrition }: {
  slotKey: string; isLiftDay: boolean; nutrition: NutritionDay | null | undefined;
}) {
  const slot = morganNutritionPlan.mealSchedule.find(s => s.slot === slotKey);
  if (!slot) return null;
  const description = isLiftDay ? (slot.liftDay ?? slot.default) : (slot.recoveryDay ?? slot.default);
  const loggedMeal = nutrition?.meals.find(m => m.slot === slotKey);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-1">Plan</p>
        <p className="text-[#F5F5F5]">{description}</p>
      </div>
      {loggedMeal && loggedMeal.foods.length > 0 ? (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">Logged Foods</p>
          <div className="space-y-1.5">
            {loggedMeal.foods.map((food, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#F5F5F5]">
                  {food.name} <span className="text-[color:var(--text-detail)]">× {food.quantity}{food.unit}</span>
                </span>
                <span className="font-mono tabular-nums text-[color:var(--text-detail)] text-xs">
                  {food.protein}g P · {food.calories} kcal
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[color:var(--text-detail)]">No foods logged yet — follow the plan above.</p>
      )}
    </div>
  );
}

function VitaminsContent({ timing, supplements }: {
  timing: string; supplements: SupplementLog | null | undefined;
}) {
  const win = morganSupplementProtocol.windows.find(w => w.timing === timing);
  if (!win) return null;
  const winLog = supplements?.windows?.[timing] ?? {};

  return (
    <div className="space-y-4">
      {win.withMeal && (
        <p className="text-sm text-[color:var(--text-detail)]">Take with {win.withMeal}</p>
      )}
      <div>
        <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">Supplements</p>
        <div className="space-y-1.5">
          {win.supplements.map((name, i) => {
            const taken = winLog[name] === true;
            return (
              <div key={i} className={cn('flex items-center gap-3 text-sm py-1.5 px-2 rounded-lg',
                taken ? 'opacity-50' : 'bg-[color:var(--surface-track)]')}>
                {taken
                  ? <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                  : <span className="w-3.5 h-3.5 rounded-full border border-[rgba(65,50,50,0.22)] shrink-0 inline-block" />}
                <span className={taken ? 'text-[color:var(--text-detail)] line-through' : 'text-[#F5F5F5]'}>{name}</span>
              </div>
            );
          })}
        </div>
      </div>
      {win.optional && win.optional.length > 0 && (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">Optional</p>
          <div className="space-y-1">
            {win.optional.map((name, i) => (
              <p key={i} className="text-sm text-[color:var(--text-detail)] pl-2">{name}</p>
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

  const hasAnyDetail =
    hasNotes || hasLift || hasCardio || hasBreath || hasCore || hasMobility;

  return (
    <div className="space-y-4">
      {hasNotes && (
        <div className="p-3 rounded-lg border-l-4 border-[#F59E0B] bg-[rgba(245,158,11,0.05)]">
          <p className="text-sm text-[color:var(--text-detail)] whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}
      {hasLift && (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">
            Exercises ({exercises.length})
          </p>
          <div className="divide-y divide-[rgba(65,50,50,0.14)]">
            {exercises.map((ex, i) => (
              <div key={i} className="flex items-start justify-between gap-2 py-2 text-sm">
                <div className="flex items-start gap-2 min-w-0">
                  <span className="exercise-index-badge shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('font-medium', ex.isKPI ? 'text-[#DC2626]' : 'text-[#F5F5F5]')}>
                        {ex.name}
                      </span>
                      {ex.isKPI && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[rgba(220,38,38,0.14)] text-[#F5F5F5] border border-[rgba(220,38,38,0.38)] shrink-0">
                          KPI
                        </span>
                      )}
                    </div>
                    {ex.notes ? (
                      <p className="text-xs text-[color:var(--text-detail)] mt-1 whitespace-pre-wrap">{ex.notes}</p>
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
          <p className="text-sm font-medium text-[#F5F5F5]">{session.cardio.type}</p>
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
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">Breath work</p>
          <ul className="space-y-2">
            {breath.map((bw, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium text-[#F5F5F5]">{bw.name}</span>
                <span className="text-[color:var(--text-detail)] text-xs font-mono tabular-nums ml-2">
                  in {bw.inhale}s
                  {bw.hold != null ? ` · hold ${bw.hold}s` : ''} · out {bw.exhale}s
                  {bw.holdOut != null ? ` · pause ${bw.holdOut}s` : ''} · {bw.rounds} rnd
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {hasCore && (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">Core</p>
          <div className="divide-y divide-[rgba(65,50,50,0.14)]">
            {core.map((c, i) => (
              <div key={i} className="flex items-start justify-between gap-2 py-2 text-sm">
                <span className="text-[#F5F5F5]">{c.name}</span>
                <span className="font-mono tabular-nums text-[color:var(--text-detail)] text-xs shrink-0 text-right">
                  {c.sets}×
                  {c.reps != null ? c.reps : c.holdSec != null ? `${c.holdSec}s` : '—'}
                  {c.perSide ? ' / side' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {hasMobility && (
        <div>
          <p className="text-[10px] text-[color:var(--text-detail)] uppercase tracking-wider mb-2">Mobility</p>
          <ul className="space-y-1.5">
            {mobility.map((m, i) => (
              <li
                key={i}
                className="text-sm text-[#D4D4D4] pl-3 border-l-2 border-[rgba(220,38,38,0.28)] leading-snug"
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
const sessionTableTd = 'py-2.5 px-3 align-top border-t border-[rgba(65,50,50,0.14)]';
const sessionTableWrap = 'overflow-x-auto rounded-lg border border-[rgba(65,50,50,0.28)] bg-[rgba(0,0,0,0.18)]';

function SessionProgramTable({ session }: { session: ProgramSession }) {
  const exercises = session.exercises ?? [];
  const breath = session.breathWork ?? [];
  const core = session.coreWork ?? [];
  const mobility = session.mobility ?? [];
  const cardio = session.cardio;

  const sessionNotes = session.notes?.trim();

  const corePrescription = (c: (typeof core)[number]) => {
    const bit =
      c.reps != null
        ? `${c.reps} reps`
        : c.holdSec != null
          ? `${c.holdSec}s hold`
          : '—';
    return `${c.sets}×${bit}${c.perSide ? ' / side' : ''}`;
  };

  return (
    <div className="space-y-6">
      {sessionNotes ? (
        <div className="p-3 rounded-lg border-l-4 border-[#F59E0B] bg-[rgba(245,158,11,0.05)]">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-detail)] mb-1">
            Session notes
          </p>
          <p className="text-sm text-[color:var(--text-detail)] whitespace-pre-wrap">{sessionNotes}</p>
        </div>
      ) : null}

      {exercises.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5E5E5E] mb-2">
            Lifts ({exercises.length})
          </p>
          <div className={sessionTableWrap}>
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-[rgba(0,0,0,0.35)]">
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
                    <td className={cn(sessionTableTd, 'font-mono tabular-nums text-[color:var(--text-detail)]')}>
                      {i + 1}
                    </td>
                    <td className={cn(sessionTableTd, 'text-[#F5F5F5]')}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{ex.name}</span>
                        {ex.isKPI ? (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[rgba(220,38,38,0.14)] text-[#F5F5F5] border border-[rgba(220,38,38,0.38)]">
                            KPI
                          </span>
                        ) : null}
                      </div>
                      {ex.notes ? (
                        <p className="text-xs text-[color:var(--text-detail)] mt-1.5 whitespace-pre-wrap leading-snug">
                          {ex.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className={cn(sessionTableTd, 'text-right font-mono tabular-nums text-[#D4D4D4]')}>
                      {ex.sets}
                    </td>
                    <td className={cn(sessionTableTd, 'text-right font-mono tabular-nums text-[#D4D4D4]')}>
                      {ex.reps}
                    </td>
                    <td className={cn(sessionTableTd, 'text-right font-mono tabular-nums text-[color:var(--text-detail)]')}>
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5E5E5E] mb-2">Cardio</p>
          <div className={sessionTableWrap}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[rgba(0,0,0,0.35)]">
                  <th className={sessionTableTh}>Activity</th>
                  <th className={cn(sessionTableTh, 'text-right w-[6rem]')}>Time</th>
                  <th className={sessionTableTh}>Structure &amp; notes</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={cn(sessionTableTd, 'text-[#F5F5F5] font-medium')}>{cardio.type}</td>
                  <td className={cn(sessionTableTd, 'text-right font-mono tabular-nums text-[#D4D4D4]')}>
                    {cardio.duration} min
                  </td>
                  <td className={cn(sessionTableTd, 'text-[color:var(--text-detail)] text-xs leading-snug')}>
                    {cardio.intervals ? (
                      <span className="font-mono tabular-nums block mb-1">
                        {cardio.intervals.work}s work / {cardio.intervals.rest}s rest × {cardio.intervals.rounds} rounds
                      </span>
                    ) : null}
                    {cardio.note ? <span className="whitespace-pre-wrap">{cardio.note}</span> : null}
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5E5E5E] mb-2">Breath work</p>
          <div className={sessionTableWrap}>
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="bg-[rgba(0,0,0,0.35)]">
                  <th className={sessionTableTh}>Protocol</th>
                  <th className={sessionTableTh}>Timing</th>
                  <th className={cn(sessionTableTh, 'text-right w-[5rem]')}>Rounds</th>
                </tr>
              </thead>
              <tbody>
                {breath.map((bw, i) => (
                  <tr key={`${bw.name}-${i}`}>
                    <td className={cn(sessionTableTd, 'text-[#F5F5F5] font-medium')}>{bw.name}</td>
                    <td className={cn(sessionTableTd, 'font-mono tabular-nums text-xs text-[color:var(--text-detail)]')}>
                      in {bw.inhale}s
                      {bw.hold != null ? ` · hold ${bw.hold}s` : ''} · out {bw.exhale}s
                      {bw.holdOut != null ? ` · pause ${bw.holdOut}s` : ''}
                    </td>
                    <td className={cn(sessionTableTd, 'text-right font-mono tabular-nums text-[#D4D4D4]')}>
                      {bw.rounds}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {core.length > 0 ? (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5E5E5E] mb-2">Core</p>
          <div className={sessionTableWrap}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[rgba(0,0,0,0.35)]">
                  <th className={sessionTableTh}>Exercise</th>
                  <th className={cn(sessionTableTh, 'text-right w-[10rem]')}>Prescription</th>
                </tr>
              </thead>
              <tbody>
                {core.map((c, i) => (
                  <tr key={`${c.name}-${i}`}>
                    <td className={cn(sessionTableTd, 'text-[#F5F5F5]')}>{c.name}</td>
                    <td className={cn(sessionTableTd, 'text-right font-mono tabular-nums text-[#D4D4D4] text-xs')}>
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5E5E5E] mb-2">Mobility</p>
          <div className={sessionTableWrap}>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[rgba(0,0,0,0.35)]">
                  <th className={sessionTableTh}>Focus</th>
                </tr>
              </thead>
              <tbody>
                {mobility.map((m, i) => (
                  <tr key={`${m}-${i}`}>
                    <td className={cn(sessionTableTd, 'text-[#D4D4D4] pl-4 border-l-2 border-[rgba(220,38,38,0.28)]')}>
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
  onGoWorkout,
  onGoTraining,
}: {
  open: boolean;
  session: ProgramSession | undefined;
  sessionTypeLabel: string;
  onClose: () => void;
  isViewingToday: boolean;
  hasLoggedWorkoutToday: boolean;
  onGoWorkout: () => void;
  onGoTraining: () => void;
}) {
  if (!open || !session) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-2xl mx-0 sm:mx-4 glass-panel rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[rgba(65,50,50,0.35)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[rgba(65,50,50,0.25)] shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-[#DC2626] shrink-0 mt-0.5">
              <Dumbbell size={22} />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#5E5E5E]">Session breakdown</p>
              <h2 className="text-lg font-bold text-[#F5F5F5] leading-snug truncate">{session.name}</h2>
              <p className="text-xs text-[color:var(--text-detail)] mt-1">{sessionTypeLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#9A9A9A] hover:text-[#F5F5F5] hover:bg-[rgba(255,255,255,0.05)] shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <SessionProgramTable session={session} />
        </div>
        <div className="flex flex-wrap items-center gap-2 p-4 border-t border-[rgba(65,50,50,0.25)] shrink-0 bg-[rgba(0,0,0,0.2)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#D4D4D4] border border-[rgba(65,50,50,0.45)] hover:bg-[rgba(255,255,255,0.05)]"
          >
            Close
          </button>
          {isViewingToday ? (
            <button
              type="button"
              onClick={onGoWorkout}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#DC2626] text-white hover:brightness-110 flex items-center gap-2"
            >
              <Dumbbell size={16} />
              {hasLoggedWorkoutToday ? 'Open workout' : 'Start workout'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoTraining}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[rgba(220,38,38,0.45)] text-[#DC2626] hover:bg-[rgba(220,38,38,0.12)]"
            >
              Open training
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityContent({ session, done, onStart, canStart }: {
  session: ProgramSession | undefined; done: boolean; onStart: () => void; canStart?: boolean;
}) {
  if (!session) return <p className="text-[color:var(--text-detail)]">No session data.</p>;
  return (
    <div className="space-y-4">
      <SessionProgramPreview session={session} />
      {done ? (
        <div className="flex items-center justify-center gap-2 py-3 text-[#10B981]">
          <CheckCircle2 size={18} />
          <span className="font-semibold">Workout Complete</span>
        </div>
      ) : canStart === false ? (
        <p className="text-sm text-[color:var(--text-detail)] text-center py-3 px-2">
          Select today&apos;s cycle-day tab to start or log this session against your calendar.
        </p>
      ) : (
        <button
          onClick={onStart}
          className="w-full py-3 bg-[#DC2626] text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2"
        >
          <Dumbbell size={18} />
          Start Workout
        </button>
      )}
    </div>
  );
}

function ScheduleModal({ item, onClose, session, nutrition, supplements, onStartWorkout, canStartWorkout }: {
  item: ScheduleItem;
  onClose: () => void;
  session: ProgramSession | undefined;
  nutrition: NutritionDay | null | undefined;
  supplements: SupplementLog | null | undefined;
  onStartWorkout: () => void;
  canStartWorkout?: boolean;
}) {
  const meta = KIND_META[item.kind];
  const p = item.payload;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md mx-0 sm:mx-4 glass-panel dashboard-card-surface rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[rgba(65,50,50,0.28)] shrink-0">
          <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0',
            meta.color, meta.bg, meta.border)}>
            {meta.label}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#F5F5F5] truncate">{item.label}</h3>
            <p className="text-xs text-[color:var(--text-detail)]">{item.time}</p>
          </div>
          {item.done === true && <CheckCircle2 size={15} className="text-[#10B981] shrink-0" />}
          <button onClick={onClose} className="p-1.5 text-[color:var(--text-detail)] hover:text-[#F5F5F5] shrink-0 transition-colors">
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {p.kind === 'meal'     && <MealContent slotKey={p.slotKey} isLiftDay={p.isLiftDay} nutrition={nutrition} />}
          {p.kind === 'vitamins' && <VitaminsContent timing={p.timing} supplements={supplements} />}
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
}) {
  const [selected, setSelected] = useState<ScheduleItem | null>(null);
  const items: ScheduleItem[] = [];

  /* — Meals — */
  for (const slot of morganNutritionPlan.mealSchedule) {
    if (slot.liftDayOnly && !isLiftDay) continue;
    const description = isLiftDay ? (slot.liftDay ?? slot.default) : (slot.recoveryDay ?? slot.default);
    const mealData = nutrition?.meals.find(m => m.slot === slot.slot);
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
  for (const win of morganSupplementProtocol.windows) {
    const time = SUPPL_TIME[win.timing] ?? '00:00';
    const winData = supplements?.windows?.[win.timing];
    const takenCount = winData ? Object.values(winData).filter(Boolean).length : null;
    const total = win.supplements.length;
    const names = win.supplements.slice(0, 3).join(', ') + (win.supplements.length > 3 ? ` +${win.supplements.length - 3}` : '');
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
          <h3 className="font-semibold text-[#F5F5F5]">{scheduleTitle}</h3>
          <span className="text-xs text-[color:var(--text-detail)] ml-auto">{dateBadge}</span>
        </div>
        {previewHint && (
          <p className="text-xs text-[color:var(--text-detail)] mb-3 border-l-2 border-[rgba(220,38,38,0.42)] pl-3 bg-[rgba(220,38,38,0.04)] rounded-r-lg py-1">{previewHint}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[min(100%,52rem)]">
            <thead>
              <tr className="border-b border-[rgba(65,50,50,0.22)]">
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
            <tbody className="divide-y divide-[rgba(65,50,50,0.14)]">
              {items.map((item, i) => {
                const meta = KIND_META[item.kind];
                return (
                  <tr
                    key={i}
                    onClick={() => setSelected(item)}
                    className={cn(
                      'cursor-pointer transition-colors group hover:bg-[rgba(220,38,38,0.055)]',
                      item.done === true && 'opacity-50',
                    )}
                  >
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-[color:var(--text-detail)] text-xs whitespace-nowrap align-top">
                      {item.time}
                    </td>
                    <td className="py-2.5 pr-4 align-top">
                      <span className={cn(
                        'inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                        meta.color, meta.bg, meta.border
                      )}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 align-top">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className={cn(
                          'font-semibold leading-snug',
                          item.done ? 'text-[color:var(--text-detail)] line-through' : 'text-[#F5F5F5]'
                        )}>
                          {item.label}
                        </span>
                        <span className={cn(
                          'text-[11px] font-semibold shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pt-0.5',
                          meta.color
                        )}>
                          →
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 align-top min-w-0 max-w-xl">
                      {item.detail ? (
                        <p
                          className={cn(
                            'text-[13px] leading-relaxed text-[color:var(--text-detail)] break-words',
                            item.done && 'line-through opacity-80'
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
                        <CheckCircle2 size={15} className="text-[#10B981] inline-block mt-0.5" aria-hidden />
                      ) : item.done === false ? (
                        <span className="inline-block w-3.5 h-3.5 rounded-full border border-[rgba(65,50,50,0.22)] mt-1" />
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
          onStartWorkout={() => { setSelected(null); onActivityClick(); }}
          canStartWorkout={canStartWorkout}
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
  const maxVol = Math.max(...rows.map(r => r.volume), 1);

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
          'cursor-pointer hover:border-[rgba(220,38,38,0.38)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/50'
      )}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-[#F59E0B]" />
          <div>
            <h3 className="font-semibold text-[#F5F5F5]">Training Density</h3>
            <p className="text-xs text-[color:var(--text-detail)]">
              {workout.sessionName} · {formatDisplayDate(workout.date)} · {durationMin} min
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          {[
            { label: 'Volume',   value: `${Math.round(totalVolume).toLocaleString()} kg` },
            { label: 'Duration', value: `${durationMin} min` },
            { label: 'Density',  value: `${density} kg/min`, gold: true },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xs text-[color:var(--text-detail)]">{s.label}</p>
              <p className={cn('font-mono tabular-nums font-bold', s.gold ? 'text-[#DC2626]' : 'text-[#F5F5F5]')}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <div
          className="flex rounded-xl overflow-hidden border border-[rgba(65,50,50,0.22)]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {(['exercise', 'bodypart'] as const).map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn('px-3 py-1.5 text-xs font-semibold capitalize transition-all',
                view === v ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]' : 'text-[color:var(--text-detail)] hover:text-[#F5F5F5]'
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
          {rows.map(row => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-[#F5F5F5] capitalize truncate">{row.label}</span>
                  {view === 'exercise' && <span className="text-xs text-[color:var(--text-detail)] capitalize shrink-0">{row.muscle}</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono tabular-nums text-[#F5F5F5]">
                    {Math.round(row.volume).toLocaleString()} kg
                  </span>
                  <span className="font-mono tabular-nums text-[#F59E0B] text-xs w-20 text-right">
                    {Math.round(row.volume / durationMin)} kg/min
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[color:var(--surface-track)] ring-1 ring-inset ring-black/35">
                <div
                  className="h-full bg-gradient-to-r from-[#F59E0B] to-[#DC2626] rounded-full transition-all duration-500"
                  style={{ width: `${(row.volume / maxVol) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Cycle day tabs (length follows active program — 7, 14, etc.)
───────────────────────────────────────────────────────────────────── */
function CycleDayTabs({
  cycleLengthDays,
  selectedCycleDay,
  todayCycleDay,
  onSelect,
}: {
  cycleLengthDays: number;
  selectedCycleDay: number;
  todayCycleDay: number | null;
  onSelect: (day: number) => void;
}) {
  const days = Array.from({ length: cycleLengthDays }, (_, i) => i + 1);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--text-2)]">Cycle days</p>
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        {days.map((day) => {
          const isTodayTab = todayCycleDay !== null && day === todayCycleDay;
          const isSelected = day === selectedCycleDay;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                'shrink-0 min-w-[2.75rem] px-3 py-2 rounded-lg text-sm font-mono tabular-nums transition-all border',
                isSelected
                  ? 'bg-[rgba(220,38,38,0.22)] border-[#DC2626] text-[#FAFAFA] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'border-[rgba(65,50,50,0.35)] text-[#9A9A9A] hover:border-[rgba(220,38,38,0.45)] hover:text-[#F0F0F0]',
                isTodayTab && !isSelected && 'ring-1 ring-[rgba(220,38,38,0.35)]'
              )}
              aria-pressed={isSelected}
              title={isTodayTab ? 'Today (calendar)' : `Cycle day ${day}`}
            >
              {day}
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

  const [coachNotesOpen, setCoachNotesOpen] = useState(false);
  const [sessionDetailOpen, setSessionDetailOpen] = useState(false);

  const { profile, todayNutrition, todayRecovery, latestRecovery, todaySupplements, weeklyVolume, recentNotes, isLoading } =
    useDashboardData(userId);
  const { data: activeProgram } = useActiveProgram(userId);
  const { data: recentWorkouts } = useRecentWorkouts(userId, 7);
  const { data: physiqueCheckIns } = useRecentCheckIns(userId, 40);

  const todayStr = today();
  const cycleDay = activeProgram
    ? getCycleDay(activeProgram.startDate ?? todayStr, todayStr, activeProgram.cycleLengthDays)
    : null;

  const [selectedCycleDay, setSelectedCycleDay] = useState(1);

  useEffect(() => {
    if (cycleDay != null) setSelectedCycleDay(cycleDay);
  }, [cycleDay]);

  const cycleLen = activeProgram?.cycleLengthDays ?? 1;

  useEffect(() => {
    setSelectedCycleDay((d) => Math.min(d, cycleLen));
  }, [cycleLen]);
  const safeDay = Math.min(Math.max(selectedCycleDay, 1), cycleLen);

  const selectedSession = activeProgram?.sessions.find(s => s.dayNumber === safeDay);
  const isLiftForSelected = selectedSession?.type === 'lift';
  const isViewingToday = cycleDay !== null && safeDay === cycleDay;

  const todayWorkout = recentWorkouts?.find(w => w.date === todayStr);
  const lastWorkout = recentWorkouts?.find(w => w.exercises.some(ex => ex.sets.some(s => s.completed)));

  const recoveryDashEntry = todayRecovery ?? latestRecovery ?? null;
  const recoveryDashHistorical = !todayRecovery && !!latestRecovery;

  const scheduleTitle = isViewingToday ? 'Today\'s Schedule' : `Day ${safeDay} — Plan`;
  const dateBadge = isViewingToday ? formatDisplayDate(todayStr) : 'Preview';
  const previewHint = !isViewingToday
    ? 'Nutrition and supplement cards below reflect calendar today only when the highlighted tab matches today\'s cycle day. Recovery shows your latest saved check-in.'
    : null;

  const dashboardSubtitle =
    activeProgram && cycleDay
      ? `Day ${safeDay} of ${activeProgram.cycleLengthDays} — ${selectedSession?.name ?? 'Rest Day'}`
      : formatDisplayDate(todayStr);

  if (isLoading) {
    return (
      <div className="dashboard-overview flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#DC2626] border-t-transparent" aria-hidden />
      </div>
    );
  }

  return (
    <>
      <CoachingNotesModal open={coachNotesOpen} notes={recentNotes} onClose={() => setCoachNotesOpen(false)} />

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
        hasLoggedWorkoutToday={!!todayWorkout}
        onGoWorkout={() => {
          setSessionDetailOpen(false);
          router.push('/training/workout');
        }}
        onGoTraining={() => {
          setSessionDetailOpen(false);
          router.push('/training');
        }}
      />

      <div className="dashboard-overview space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-bold text-[#F5F5F5]">Dashboard</h1>
          <p className="text-[color:var(--text-detail)]">{dashboardSubtitle}</p>
        </header>

        {activeProgram && cycleDay !== null && (
          <CycleDayTabs
            cycleLengthDays={cycleLen}
            selectedCycleDay={safeDay}
            todayCycleDay={cycleDay}
            onSelect={setSelectedCycleDay}
          />
        )}

        {/* Schedule + cycle-tab cards */}
        <section key={safeDay} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <TodaySchedule
            session={selectedSession}
            isLiftDay={isLiftForSelected ?? false}
            nutrition={isViewingToday ? todayNutrition : undefined}
            supplements={isViewingToday ? todaySupplements : undefined}
            todayDone={isViewingToday ? !!todayWorkout : false}
            onActivityClick={() => router.push('/training/workout')}
            scheduleTitle={scheduleTitle}
            dateBadge={dateBadge}
            previewHint={previewHint}
            canStartWorkout={isViewingToday}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* Session | Recovery+Physique — two cols on lg+; right stack matches session column height */}
          <div className="col-span-full grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-4">
            <Card
              className="min-h-0 lg:flex lg:flex-col lg:h-full"
              title={isViewingToday ? 'Today\'s Session' : `Day ${safeDay} — Session plan`}
              icon={<Dumbbell size={20} />}
              iconColor="text-[#DC2626]"
              onClick={() => {
                if (selectedSession) setSessionDetailOpen(true);
                else router.push('/training');
              }}
            >
              {selectedSession ? (
                <div className="flex min-h-0 flex-1 flex-col space-y-3">
                  <p className="font-medium text-[#F5F5F5]">{selectedSession.name}</p>
                  <p className="text-xs text-[color:var(--text-detail)]">
                    {selectedSession.type === 'lift' && 'Strength'}
                    {selectedSession.type === 'cardio' && 'Cardio / conditioning'}
                    {selectedSession.type === 'recovery' && 'Recovery'}
                  </p>
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1 -mr-0.5 max-h-[min(72vh,42rem)] lg:max-h-none">
                    <SessionProgramPreview session={selectedSession} />
                  </div>
                  <div className="border-t border-[rgba(65,50,50,0.25)] pt-3 space-y-1.5 shrink-0">
                    <p className="text-xs text-[#DC2626]/90 font-medium">
                      {isViewingToday
                        ? todayWorkout
                          ? 'Open workout →'
                          : 'Start workout →'
                        : 'Open training →'}
                    </p>
                    {!isViewingToday && (
                      <p className="text-[10px] text-[color:var(--text-detail)] leading-snug">
                        Logging runs on calendar today when you select today&apos;s cycle-day tab.
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
                iconColor="text-[#10B981]"
                onClick={() => router.push('/recovery')}
              >
                {!recoveryDashEntry ? (
                  <div className="space-y-3">
                    <p className="text-[color:var(--text-detail)]">No recovery data logged yet</p>
                    <p className="text-xs text-[#10B981]/90 font-medium">Log on Recovery page →</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recoveryDashHistorical && latestRecovery && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-detail)] leading-snug">
                        {latestRecovery.date === todayStr
                          ? 'Latest entry'
                          : `Last logged · ${formatDisplayDate(latestRecovery.date)}`}
                      </p>
                    )}
                    {todayRecovery && (
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-detail)]">
                        Today · {formatDisplayDate(todayStr)}
                      </p>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono tabular-nums text-[#F5F5F5]">
                        {Math.round(recoveryDashEntry.readinessScore)}
                      </span>
                      <span className="text-sm text-[color:var(--text-detail)]">/100</span>
                    </div>
                    <p className="text-sm text-[color:var(--text-detail)]">
                      Sleep: {recoveryDashEntry.sleepHours}h · HRV: {recoveryDashEntry.hrv}
                    </p>
                    {!isViewingToday && (
                      <p className="text-[10px] text-[#5E5E5E] pt-1 leading-snug">
                        Saved recovery is by calendar date (not the selected cycle day).
                      </p>
                    )}
                    <p className="text-xs text-[#10B981]/90 font-medium pt-1">Open recovery →</p>
                  </div>
                )}
              </Card>

              <Card
                className="min-h-0 flex-1 lg:flex lg:flex-col"
                title="Physique"
                icon={<Scale size={20} />}
                iconColor="text-[#F59E0B]"
                onClick={() => router.push('/physique')}
              >
                <div className="flex min-h-0 flex-1 flex-col space-y-2">
                  <div className="flex items-baseline justify-between gap-2 shrink-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold font-mono tabular-nums text-[#F5F5F5]">
                        {profile?.currentWeight ?? '—'}
                      </span>
                      <span className="text-sm text-[color:var(--text-detail)]">kg</span>
                    </div>
                    <BarChart3 size={18} className="text-[#DC2626]/60 shrink-0" aria-hidden />
                  </div>
                  <p className="text-sm text-[color:var(--text-detail)] shrink-0">
                    Target: {profile?.targetWeight ?? '—'} kg
                  </p>
                  <div className="min-h-0 flex-1">
                    <PhysiqueMiniCharts checkIns={physiqueCheckIns} targetWeight={profile?.targetWeight} />
                  </div>
                  <p className="text-xs text-[#DC2626]/80 font-medium shrink-0">Full check-in &amp; history →</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Full-width row: nutrition · supplements · coaching — always three columns from md */}
          <div className="col-span-full grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-4">
          <Card
            title="Today's Nutrition"
            icon={<TrendingUp size={20} />}
            iconColor="text-[#DC2626]"
            onClick={() => router.push('/nutrition')}
          >
            {!isViewingToday ? (
              <p className="text-sm text-[color:var(--text-detail)]">
                Meal logging and macro totals are for calendar today. Select today&apos;s cycle-day tab ({cycleDay !== null ? `day ${cycleDay}` : ''}) to edit today&apos;s intake.
              </p>
            ) : todayNutrition ? (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[color:var(--text-detail)]">Protein</span>
                  <span className="font-mono tabular-nums text-[#F5F5F5]">
                    {Math.round(todayNutrition.macroActuals.protein)}g / {todayNutrition.macroTargets.protein}g
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[color:var(--text-detail)]">Meals</span>
                  <span className="font-mono tabular-nums text-[#F5F5F5]">
                    {todayNutrition.meals.filter(m => m.completed).length}/{todayNutrition.meals.length} eaten
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-[color:var(--surface-track)] ring-1 ring-inset ring-black/35">
                  <div
                    className="h-full bg-[#DC2626] rounded-full transition-all"
                    style={{ width: `${Math.min(100, todayNutrition.complianceScore)}%` }}
                  />
                </div>
                <p className="text-xs text-[#DC2626]/80 font-medium pt-1">Open nutrition →</p>
              </div>
            ) : (
              <>
                <p className="text-[color:var(--text-detail)]">No meals logged today</p>
                <p className="text-xs text-[#DC2626]/80 font-medium pt-2">Open nutrition →</p>
              </>
            )}
          </Card>

          <Card
            title="Supplements"
            icon={<Pill size={20} />}
            iconColor="text-[#DC2626]"
            onClick={() => router.push('/supplements')}
          >
            {!isViewingToday ? (
              <p className="text-sm text-[color:var(--text-detail)]">
                Supplement checklist reflects calendar today. Switch to today&apos;s cycle tab to tick off today&apos;s windows.
              </p>
            ) : todaySupplements ? (
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold font-mono tabular-nums text-[#F5F5F5]">
                    {todaySupplements.compliancePercent}
                  </span>
                  <span className="text-sm text-[color:var(--text-detail)]">%</span>
                </div>
                <p className="text-sm text-[color:var(--text-detail)]">compliance today</p>
                <p className="text-xs text-[#DC2626]/80 font-medium">Open supplements →</p>
              </div>
            ) : (
              <>
                <p className="text-[color:var(--text-detail)]">No supplements logged today</p>
                <p className="text-xs text-[#DC2626]/80 font-medium pt-2">Open supplements →</p>
              </>
            )}
          </Card>

          <Card
            title="Coaching Notes"
            icon={<FileText size={20} />}
            iconColor="text-[color:var(--text-1)]"
            onClick={
              recentNotes && recentNotes.length > 0 ? () => setCoachNotesOpen(true) : undefined
            }
          >
            {recentNotes && recentNotes.length > 0 ? (
              <div className="space-y-2">
                <p className="font-medium text-[#F5F5F5] line-clamp-2">{recentNotes[0].title}</p>
                <p className="text-sm text-[color:var(--text-detail)] line-clamp-2">{recentNotes[0].content}</p>
                <p className="text-xs text-[color:var(--text-detail)]/60">{formatDisplayDate(recentNotes[0].date)}</p>
                <p className="text-xs text-[#DC2626]/80 font-medium pt-1">Read full note →</p>
              </div>
            ) : (
              <p className="text-[color:var(--text-detail)]">No recent notes</p>
            )}
          </Card>
          </div>

          {isViewingToday && lastWorkout && (
            <DensityCard workout={lastWorkout} onOpen={() => router.push('/training/history')} />
          )}
        </div>
      </section>

      {/* Weekly volume — not driven by cycle tab */}
      {weeklyVolume && weeklyVolume.length > 0 && (
      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        aria-label="Weekly training volume"
      >
          <Card title="Weekly Volume vs Landmarks" icon={<TrendingUp size={20} />} iconColor="text-[color:var(--text-1)]" fullWidth>
            <div className="space-y-3">
              {weeklyVolume.map((muscle: {
                muscleGroup: string; currentSets: number; targetSets: number;
                mev: number; mav: number; mrv: number;
              }) => (
                <div key={muscle.muscleGroup} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#F5F5F5] capitalize">{muscle.muscleGroup}</span>
                    <span className="font-mono tabular-nums text-[color:var(--text-detail)]">
                      {muscle.currentSets} / {muscle.targetSets} sets
                    </span>
                  </div>
                  <div className="h-2 bg-[color:var(--surface-track)] rounded-full overflow-hidden relative">
                    <div className="absolute h-full bg-[rgba(120,100,98,0.38)] rounded-l-full"
                      style={{ width: `${(muscle.mev / muscle.mrv) * 100}%` }} />
                    <div className="absolute h-full bg-[#DC2626]/30"
                      style={{ left: `${(muscle.mev / muscle.mrv) * 100}%`, width: `${((muscle.mav - muscle.mev) / muscle.mrv) * 100}%` }} />
                    <div className="absolute h-full bg-[#DC2626]/60"
                      style={{ left: `${(muscle.mav / muscle.mrv) * 100}%`, width: `${((muscle.mrv - muscle.mav) / muscle.mrv) * 100}%` }} />
                    <div className="absolute top-0 w-0.5 h-full bg-[#DC2626]"
                      style={{ left: `${Math.min(99, (muscle.currentSets / muscle.mrv) * 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex gap-4 pt-1">
                {[['#948A88', 'MV→MEV'], ['#DC2626', 'MEV→MRV'], ['#DC2626', 'Current']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-[color:var(--text-detail)]">
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
  className,
  onClick,
}: {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  children: React.ReactNode;
  fullWidth?: boolean;
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
        interactive &&
          'cursor-pointer select-none hover:border-[rgba(220,38,38,0.38)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/55',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={iconColor}>{icon}</span>
        <h3 className="font-medium text-[#F5F5F5]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
