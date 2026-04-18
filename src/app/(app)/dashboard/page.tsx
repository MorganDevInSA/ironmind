'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useDashboardData, useActiveProgram, useRecentWorkouts } from '@/controllers';
import { getCycleDay, today, formatDisplayDate } from '@/lib/utils';
import {
  Activity, Dumbbell, Scale, Pill, FileText, TrendingUp, Zap,
  Calendar, CheckCircle2, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Workout, NutritionDay, SupplementLog, ProgramSession } from '@/lib/types';
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
  meal:     { label: 'Meal',     color: 'text-[#10B981]', bg: 'bg-[rgba(16,185,129,0.08)]',  border: 'border-[rgba(16,185,129,0.25)]' },
  vitamins: { label: 'Vitamins', color: 'text-[#DC2626]', bg: 'bg-[rgba(59,130,246,0.08)]',  border: 'border-[rgba(59,130,246,0.25)]' },
  activity: { label: 'Activity', color: 'text-[#DC2626]', bg: 'bg-[rgba(212,175,55,0.08)]',  border: 'border-[rgba(212,175,55,0.25)]' },
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
        <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-1">Plan</p>
        <p className="text-[#F5F5F5]">{description}</p>
      </div>
      {loggedMeal && loggedMeal.foods.length > 0 ? (
        <div>
          <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Logged Foods</p>
          <div className="space-y-1.5">
            {loggedMeal.foods.map((food, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-[#F5F5F5]">
                  {food.name} <span className="text-[#6B6B6B]">× {food.quantity}{food.unit}</span>
                </span>
                <span className="font-mono tabular-nums text-[#6B6B6B] text-xs">
                  {food.protein}g P · {food.calories} kcal
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#6B6B6B]">No foods logged yet — follow the plan above.</p>
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
        <p className="text-sm text-[#6B6B6B]">Take with {win.withMeal}</p>
      )}
      <div>
        <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Supplements</p>
        <div className="space-y-1.5">
          {win.supplements.map((name, i) => {
            const taken = winLog[name] === true;
            return (
              <div key={i} className={cn('flex items-center gap-3 text-sm py-1.5 px-2 rounded-lg',
                taken ? 'opacity-50' : 'bg-[rgba(16,22,34,0.3)]')}>
                {taken
                  ? <CheckCircle2 size={14} className="text-[#10B981] shrink-0" />
                  : <span className="w-3.5 h-3.5 rounded-full border border-[rgba(80,96,128,0.4)] shrink-0 inline-block" />}
                <span className={taken ? 'text-[#6B6B6B] line-through' : 'text-[#F5F5F5]'}>{name}</span>
              </div>
            );
          })}
        </div>
      </div>
      {win.optional && win.optional.length > 0 && (
        <div>
          <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">Optional</p>
          <div className="space-y-1">
            {win.optional.map((name, i) => (
              <p key={i} className="text-sm text-[#6B6B6B] pl-2">{name}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityContent({ session, done, onStart }: {
  session: ProgramSession | undefined; done: boolean; onStart: () => void;
}) {
  if (!session) return <p className="text-[#6B6B6B]">No session data.</p>;
  return (
    <div className="space-y-4">
      {session.notes && (
        <div className="p-3 rounded-lg border-l-4 border-[#F59E0B] bg-[rgba(245,158,11,0.05)]">
          <p className="text-sm text-[#6B6B6B]">{session.notes}</p>
        </div>
      )}
      {session.exercises && session.exercises.length > 0 && (
        <div>
          <p className="text-[10px] text-[#6B6B6B] uppercase tracking-wider mb-2">
            Exercises ({session.exercises.length})
          </p>
          <div className="divide-y divide-[rgba(80,96,128,0.1)]">
            {session.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-[#6B6B6B] font-mono w-5 text-right shrink-0">{i + 1}</span>
                  <span className={cn('font-medium truncate', ex.isKPI ? 'text-[#DC2626]' : 'text-[#F5F5F5]')}>
                    {ex.name}
                  </span>
                  {ex.isKPI && (
                    <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-[rgba(212,175,55,0.15)] text-[#DC2626] border border-[rgba(212,175,55,0.3)] shrink-0">
                      KPI
                    </span>
                  )}
                </div>
                <span className="font-mono tabular-nums text-[#6B6B6B] text-xs shrink-0 ml-2">
                  {ex.sets} x {ex.reps} · {ex.rest}s
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {session.cardio && (
        <div className="p-3 rounded-lg bg-[rgba(16,22,34,0.6)] space-y-1">
          <p className="text-sm font-medium text-[#F5F5F5]">{session.cardio.type}</p>
          <p className="text-xs text-[#6B6B6B]">
            {session.cardio.duration} min{session.cardio.note ? ` · ${session.cardio.note}` : ''}
          </p>
        </div>
      )}
      {done ? (
        <div className="flex items-center justify-center gap-2 py-3 text-[#10B981]">
          <CheckCircle2 size={18} />
          <span className="font-semibold">Workout Complete</span>
        </div>
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

function ScheduleModal({ item, onClose, session, nutrition, supplements, onStartWorkout }: {
  item: ScheduleItem;
  onClose: () => void;
  session: ProgramSession | undefined;
  nutrition: NutritionDay | null | undefined;
  supplements: SupplementLog | null | undefined;
  onStartWorkout: () => void;
}) {
  const meta = KIND_META[item.kind];
  const p = item.payload;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md mx-0 sm:mx-4 glass-panel rounded-t-2xl sm:rounded-2xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[rgba(80,96,128,0.15)] shrink-0">
          <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0',
            meta.color, meta.bg, meta.border)}>
            {meta.label}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[#F5F5F5] truncate">{item.label}</h3>
            <p className="text-xs text-[#6B6B6B]">{item.time}</p>
          </div>
          {item.done === true && <CheckCircle2 size={15} className="text-[#10B981] shrink-0" />}
          <button onClick={onClose} className="p-1.5 text-[#6B6B6B] hover:text-[#F5F5F5] shrink-0 transition-colors">
            <X size={16} />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {p.kind === 'meal'     && <MealContent slotKey={p.slotKey} isLiftDay={p.isLiftDay} nutrition={nutrition} />}
          {p.kind === 'vitamins' && <VitaminsContent timing={p.timing} supplements={supplements} />}
          {p.kind === 'activity' && <ActivityContent session={session} done={item.done === true} onStart={onStartWorkout} />}
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
}: {
  session: ProgramSession | undefined;
  isLiftDay: boolean;
  nutrition: NutritionDay | null | undefined;
  supplements: SupplementLog | null | undefined;
  todayDone: boolean;
  onActivityClick: () => void;
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
      <div className="glass-panel p-4 col-span-full">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-[#6B6B6B]" />
          <h3 className="font-semibold text-[#F5F5F5]">Today&apos;s Schedule</h3>
          <span className="text-xs text-[#6B6B6B] ml-auto">{formatDisplayDate(today())}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-[rgba(80,96,128,0.2)]">
                {['Time', 'Type', 'Item', ''].map(h => (
                  <th key={h} className={cn(
                    'pb-2 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider whitespace-nowrap',
                    h === '' ? 'w-8 text-right' : 'text-left pr-4',
                    h === 'Time' && 'w-16',
                    h === 'Type' && 'w-24',
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(80,96,128,0.08)]">
              {items.map((item, i) => {
                const meta = KIND_META[item.kind];
                return (
                  <tr
                    key={i}
                    onClick={() => setSelected(item)}
                    className={cn(
                      'cursor-pointer transition-colors group hover:bg-[rgba(255,255,255,0.03)]',
                      item.done === true && 'opacity-50',
                    )}
                  >
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-[#6B6B6B] text-xs whitespace-nowrap align-middle">
                      {item.time}
                    </td>
                    <td className="py-2.5 pr-4 align-middle">
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border',
                        meta.color, meta.bg, meta.border
                      )}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 align-middle">
                      <span className={cn('font-medium', item.done ? 'text-[#6B6B6B] line-through' : 'text-[#F5F5F5]')}>
                        {item.label}
                      </span>
                      {item.detail && (
                        <span className="ml-2 text-xs text-[#6B6B6B]">{item.detail}</span>
                      )}
                      <span className={cn('ml-2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity', meta.color)}>
                        → view
                      </span>
                    </td>
                    <td className="py-2.5 text-right align-middle">
                      {item.done === true ? (
                        <CheckCircle2 size={15} className="text-[#10B981] inline-block" />
                      ) : item.done === false ? (
                        <span className="inline-block w-3.5 h-3.5 rounded-full border border-[rgba(80,96,128,0.4)]" />
                      ) : (
                        <span className="text-xs text-[#6B6B6B]/30">—</span>
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
        />
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Density card
───────────────────────────────────────────────────────────────────── */
function DensityCard({ workout }: { workout: Workout }) {
  const [view, setView] = useState<'exercise' | 'bodypart'>('exercise');
  const { byExercise, byMuscle, totalVolume, durationMin, density } = calcDensity(workout);
  const rows = view === 'exercise' ? byExercise : byMuscle;
  const maxVol = Math.max(...rows.map(r => r.volume), 1);

  return (
    <div className="glass-panel p-4 col-span-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-[#F59E0B]" />
          <div>
            <h3 className="font-semibold text-[#F5F5F5]">Training Density</h3>
            <p className="text-xs text-[#6B6B6B]">
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
              <p className="text-xs text-[#6B6B6B]">{s.label}</p>
              <p className={cn('font-mono tabular-nums font-bold', s.gold ? 'text-[#DC2626]' : 'text-[#F5F5F5]')}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
        <div className="flex rounded-xl overflow-hidden border border-[rgba(80,96,128,0.25)]">
          {(['exercise', 'bodypart'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={cn('px-3 py-1.5 text-xs font-semibold capitalize transition-all',
                view === v ? 'bg-[rgba(245,158,11,0.15)] text-[#F59E0B]' : 'text-[#6B6B6B] hover:text-[#F5F5F5]'
              )}
            >
              By {v}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[#6B6B6B]">No completed sets recorded.</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map(row => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium text-[#F5F5F5] capitalize truncate">{row.label}</span>
                  {view === 'exercise' && <span className="text-xs text-[#6B6B6B] capitalize shrink-0">{row.muscle}</span>}
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
              <div className="h-2 bg-[rgba(16,22,34,0.72)] rounded-full overflow-hidden">
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
   Main dashboard
───────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const { profile, todayNutrition, todayRecovery, todaySupplements, weeklyVolume, recentNotes, isLoading } =
    useDashboardData(userId);
  const { data: activeProgram } = useActiveProgram(userId);
  const { data: recentWorkouts } = useRecentWorkouts(userId, 7);

  const todayStr = today();
  const cycleDay = activeProgram
    ? getCycleDay(activeProgram.startDate ?? todayStr, todayStr, activeProgram.cycleLengthDays)
    : null;
  const todaySession = activeProgram?.sessions.find(s => s.dayNumber === cycleDay);
  const isLiftDay = todaySession?.type === 'lift';

  const todayWorkout = recentWorkouts?.find(w => w.date === todayStr);
  const lastWorkout = recentWorkouts?.find(w => w.exercises.some(ex => ex.sets.some(s => s.completed)));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Dashboard</h1>
        <p className="text-[#6B6B6B]">
          {activeProgram && cycleDay
            ? <>Day {cycleDay} of {activeProgram.cycleLengthDays} — {todaySession?.name || 'Rest Day'}</>
            : formatDisplayDate(todayStr)}
        </p>
      </div>

      {/* Today's Schedule table */}
      <div className="grid grid-cols-1 gap-4">
        <TodaySchedule
          session={todaySession}
          isLiftDay={isLiftDay ?? false}
          nutrition={todayNutrition}
          supplements={todaySupplements}
          todayDone={!!todayWorkout}
          onActivityClick={() => router.push('/training/workout')}
        />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        <Card title="Today's Session" icon={<Dumbbell size={20} />} iconColor="text-[#DC2626]">
          {todaySession ? (
            <div className="space-y-3">
              <p className="font-medium text-[#F5F5F5]">{todaySession.name}</p>
              <p className="text-sm text-[#6B6B6B]">{todaySession.exercises?.length ?? 0} exercises</p>
              <button
                onClick={() => router.push('/training/workout')}
                className="w-full py-2 bg-[#DC2626] text-white rounded-lg hover:brightness-110 transition-all"
              >
                {todayWorkout ? 'View Workout' : 'Start Workout'}
              </button>
            </div>
          ) : (
            <p className="text-[#6B6B6B]">Rest day — focus on recovery</p>
          )}
        </Card>

        <Card title="Recovery" icon={<Activity size={20} />} iconColor="text-[#10B981]">
          {todayRecovery ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono tabular-nums text-[#F5F5F5]">
                  {Math.round(todayRecovery.readinessScore)}
                </span>
                <span className="text-sm text-[#6B6B6B]">/100</span>
              </div>
              <p className="text-sm text-[#6B6B6B]">
                Sleep: {todayRecovery.sleepHours}h · HRV: {todayRecovery.hrv}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[#6B6B6B]">No recovery data logged today</p>
              <button
                onClick={() => router.push('/recovery')}
                className="w-full py-2 bg-[rgba(16,22,34,0.72)] border border-[rgba(80,96,128,0.25)] text-[#9A9A9A] rounded-lg hover:border-[rgba(212,175,55,0.3)] transition-all"
              >
                Log Recovery
              </button>
            </div>
          )}
        </Card>

        <Card title="Weight" icon={<Scale size={20} />} iconColor="text-[#F59E0B]">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tabular-nums text-[#F5F5F5]">
                {profile?.currentWeight ?? '—'}
              </span>
              <span className="text-sm text-[#6B6B6B]">kg</span>
            </div>
            <p className="text-sm text-[#6B6B6B]">Target: {profile?.targetWeight ?? '—'} kg</p>
          </div>
        </Card>

        <Card title="Today's Nutrition" icon={<TrendingUp size={20} />} iconColor="text-[#DC2626]">
          {todayNutrition ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Protein</span>
                <span className="font-mono tabular-nums text-[#F5F5F5]">
                  {Math.round(todayNutrition.macroActuals.protein)}g / {todayNutrition.macroTargets.protein}g
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">Meals</span>
                <span className="font-mono tabular-nums text-[#F5F5F5]">
                  {todayNutrition.meals.filter(m => m.completed).length}/{todayNutrition.meals.length} eaten
                </span>
              </div>
              <div className="h-2 bg-[rgba(16,22,34,0.72)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#DC2626] rounded-full transition-all"
                  style={{ width: `${Math.min(100, todayNutrition.complianceScore)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[#6B6B6B]">No meals logged today</p>
          )}
        </Card>

        <Card title="Supplements" icon={<Pill size={20} />} iconColor="text-[#DC2626]">
          {todaySupplements ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold font-mono tabular-nums text-[#F5F5F5]">
                  {todaySupplements.compliancePercent}
                </span>
                <span className="text-sm text-[#6B6B6B]">%</span>
              </div>
              <p className="text-sm text-[#6B6B6B]">compliance today</p>
            </div>
          ) : (
            <p className="text-[#6B6B6B]">No supplements logged today</p>
          )}
        </Card>

        <Card title="Coaching Notes" icon={<FileText size={20} />} iconColor="text-[#6B6B6B]">
          {recentNotes && recentNotes.length > 0 ? (
            <div className="space-y-2">
              <p className="font-medium text-[#F5F5F5] line-clamp-2">{recentNotes[0].title}</p>
              <p className="text-sm text-[#6B6B6B] line-clamp-2">{recentNotes[0].content}</p>
              <p className="text-xs text-[#6B6B6B]/60">{formatDisplayDate(recentNotes[0].date)}</p>
            </div>
          ) : (
            <p className="text-[#6B6B6B]">No recent notes</p>
          )}
        </Card>

        {/* Training Density */}
        {lastWorkout && <DensityCard workout={lastWorkout} />}

        {/* Weekly Volume */}
        {weeklyVolume && weeklyVolume.length > 0 && (
          <Card title="Weekly Volume vs Landmarks" icon={<TrendingUp size={20} />} iconColor="text-[#6B6B6B]" fullWidth>
            <div className="space-y-3">
              {weeklyVolume.map((muscle: {
                muscleGroup: string; currentSets: number; targetSets: number;
                mev: number; mav: number; mrv: number;
              }) => (
                <div key={muscle.muscleGroup} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#F5F5F5] capitalize">{muscle.muscleGroup}</span>
                    <span className="font-mono tabular-nums text-[#6B6B6B]">
                      {muscle.currentSets} / {muscle.targetSets} sets
                    </span>
                  </div>
                  <div className="h-2 bg-[rgba(16,22,34,0.72)] rounded-full overflow-hidden relative">
                    <div className="absolute h-full bg-[#6B6B6B]/30 rounded-l-full"
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
                {[['#6B6B6B', 'MV→MEV'], ['#DC2626', 'MEV→MRV'], ['#DC2626', 'Current']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5 text-xs text-[#6B6B6B]">
                    <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ title, icon, iconColor, children, fullWidth = false }: {
  title: string; icon: React.ReactNode; iconColor: string; children: React.ReactNode; fullWidth?: boolean;
}) {
  return (
    <div className={`glass-panel p-4 card-hover ${fullWidth ? 'col-span-full' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={iconColor}>{icon}</span>
        <h3 className="font-medium text-[#F5F5F5]">{title}</h3>
      </div>
      {children}
    </div>
  );
}
