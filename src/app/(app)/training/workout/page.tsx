'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useActiveProgram, useCreateWorkout } from '@/controllers';
import { getCycleDay, today } from '@/lib/utils';
import { ArrowLeft, CheckCircle2, Timer, ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionExercise, WorkoutExercise, ExerciseSet } from '@/lib/types';

/* ── Muscle group inference ───────────────────────────────────── */
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

/* ── Set log state ────────────────────────────────────────────── */
interface SetLog {
  weight: string;
  reps: string;
  timeStamped: string | null;
}
type SetLogs = Record<string, SetLog[]>;

function initSetLogs(exercises: SessionExercise[]): SetLogs {
  return Object.fromEntries(
    exercises.map((ex) => [
      ex.exerciseId,
      Array.from({ length: ex.sets }, () => ({
        weight: '',
        reps: typeof ex.reps === 'number' ? String(ex.reps) : '',
        timeStamped: null,
      })),
    ]),
  );
}

function nowHHMM() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
}

/* ── Timer hook ───────────────────────────────────────────────── */
function useElapsed(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return elapsed;
}
function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function WorkoutPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const { data: program } = useActiveProgram(userId);
  const { mutate: createWorkout, isPending: isSaving } = useCreateWorkout(userId);

  const todayStr = today();
  const cycleDay = program
    ? getCycleDay(program.startDate ?? todayStr, todayStr, program.cycleLengthDays)
    : null;
  const session = program?.sessions.find((s) => s.dayNumber === cycleDay);
  const exercises = session?.exercises ?? [];

  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [setLogs, setSetLogs] = useState<SetLogs>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [startedAt] = useState(() => new Date().toISOString());
  const elapsed = useElapsed(started && !finished);

  useEffect(() => {
    if (exercises.length && !Object.keys(setLogs).length) {
      setSetLogs(initSetLogs(exercises));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises]);

  const completedSets = Object.values(setLogs).reduce(
    (s, arr) => s + arr.filter((a) => a.timeStamped !== null).length,
    0,
  );
  const totalSets = exercises.reduce((s, e) => s + e.sets, 0);
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const updateSet = useCallback(
    (exerciseId: string, idx: number, field: 'weight' | 'reps', val: string) => {
      setSetLogs((prev) => {
        const arr = [...(prev[exerciseId] ?? [])];
        arr[idx] = { ...arr[idx], [field]: val };
        return { ...prev, [exerciseId]: arr };
      });
    },
    [],
  );

  const stampSet = useCallback(
    (exerciseId: string, idx: number) => {
      setSetLogs((prev) => {
        const arr = [...(prev[exerciseId] ?? [])];
        // Toggle: if already stamped, clear it; otherwise record now
        arr[idx] = { ...arr[idx], timeStamped: arr[idx].timeStamped ? null : nowHHMM() };
        return { ...prev, [exerciseId]: arr };
      });
      if (!started) setStarted(true);
    },
    [started],
  );

  const handleFinish = () => {
    setFinished(true);
    const workoutExercises: WorkoutExercise[] = exercises.map((ex) => {
      const logs = setLogs[ex.exerciseId] ?? [];
      const sets: ExerciseSet[] = logs.map((log, si) => ({
        setNumber: si + 1,
        type: 'working' as const,
        weight: parseFloat(log.weight) || 0,
        reps: parseInt(log.reps) || 0,
        completed: log.timeStamped !== null,
      }));
      return {
        exerciseId: ex.exerciseId,
        name: ex.name,
        muscleGroup: inferMuscle(ex.name),
        sets,
        notes: ex.notes,
      };
    });

    createWorkout({
      programId: program?.id ?? '',
      cycleDayNumber: cycleDay ?? 0,
      sessionName: session?.name ?? '',
      sessionType: 'lift',
      date: todayStr,
      exercises: workoutExercises,
      durationMinutes: Math.max(1, Math.round(elapsed / 60)),
      notes: notes || undefined,
      startedAt,
      completedAt: new Date().toISOString(),
    });
  };

  /* ── Guard states ─────────────────────────────────────────────── */
  if (!program || !session) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[color:var(--text-2)] hover:text-[color:var(--text-0)]"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="glass-panel p-8 text-center">
          <p className="text-[color:var(--text-2)]">No session found for today.</p>
        </div>
      </div>
    );
  }
  if (session.type !== 'lift') {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[color:var(--text-2)] hover:text-[color:var(--text-0)]"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="glass-panel p-8 text-center space-y-3">
          <p className="text-lg font-semibold text-[color:var(--text-0)]">{session.name}</p>
          <p className="text-[color:var(--text-2)]">Today is a {session.type} day.</p>
          <button onClick={() => router.push('/recovery')} className="btn-primary mt-2">
            Log Recovery
          </button>
        </div>
      </div>
    );
  }

  /* ── Done state ─────────────────────────────────────────────── */
  if (finished) {
    const totalVolume = exercises.reduce((s, ex) => {
      const logs = setLogs[ex.exerciseId] ?? [];
      return (
        s +
        logs.reduce(
          (ss, l) =>
            ss + (l.timeStamped ? (parseFloat(l.weight) || 0) * (parseFloat(l.reps) || 0) : 0),
          0,
        )
      );
    }, 0);
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        <div className="glass-panel p-6 text-center space-y-4 border-[3px] border-[rgba(16,185,129,0.3)]">
          <CheckCircle2 size={40} className="text-[#10B981] mx-auto" />
          <div>
            <h2 className="text-xl font-bold text-[color:var(--text-0)]">Session Complete</h2>
            <p className="text-[color:var(--text-2)]">
              {session.name} · {fmtTime(elapsed)}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Volume', value: `${Math.round(totalVolume).toLocaleString()} kg` },
              { label: 'Sets', value: `${completedSets}/${totalSets}` },
              {
                label: 'Density',
                value: `${Math.round(totalVolume / Math.max(1, elapsed / 60))} kg/min`,
              },
            ].map((s) => (
              <div key={s.label} className="bg-[rgba(18,14,14,0.6)] rounded-lg p-3">
                <p className="text-xs text-[color:var(--text-2)] mb-1">{s.label}</p>
                <p className="font-mono tabular-nums font-bold text-[color:var(--text-0)]">
                  {s.value}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-[color:var(--text-2)]">
            Full density breakdown available on the Dashboard.
          </p>
        </div>
        <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">
          Back to Dashboard
        </button>
      </div>
    );
  }

  /* ── Active session ─────────────────────────────────────────── */
  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-8">
      {/* Sticky header */}
      <div className="sticky top-14 z-20 glass-panel px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 text-[color:var(--text-2)] hover:text-[color:var(--text-0)]"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[color:var(--text-2)] font-semibold uppercase tracking-wider">
            Day {cycleDay} of {program.cycleLengthDays}
          </p>
          <h1 className="text-base font-bold text-[color:var(--text-0)] truncate">
            {session.name}
          </h1>
        </div>
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1 rounded-full font-mono tabular-nums text-sm font-bold',
            started
              ? 'bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.35)] text-[#10B981]'
              : 'bg-[rgba(65,50,50,0.12)] border border-[rgba(65,50,50,0.25)] text-[color:var(--text-2)]',
          )}
        >
          <Timer size={14} />
          {fmtTime(elapsed)}
        </div>
        <span className="font-mono tabular-nums text-[color:var(--accent)] font-bold text-sm">
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[rgba(18,14,14,0.72)] rounded-full overflow-hidden mx-1">
        <div
          className="h-full bg-[color:var(--accent)] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Session note */}
      {session.notes && (
        <div className="glass-panel p-3 border-l-4 border-[#F59E0B]">
          <p className="text-sm text-[color:var(--text-2)]">{session.notes}</p>
        </div>
      )}

      {/* Exercise list */}
      <div className="space-y-2">
        {exercises.map((exercise: SessionExercise) => {
          const sets = setLogs[exercise.exerciseId] ?? [];
          const doneSets = sets.filter((s) => s.timeStamped !== null).length;
          const allDone = doneSets === exercise.sets;
          const isOpen = expanded === exercise.exerciseId;
          const exVolume = sets.reduce(
            (s, l) =>
              s + (l.timeStamped ? (parseFloat(l.weight) || 0) * (parseFloat(l.reps) || 0) : 0),
            0,
          );

          return (
            <div
              key={exercise.exerciseId}
              className={cn('glass-panel overflow-hidden', allDone && 'opacity-80')}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : exercise.exerciseId)}
                className="w-full flex items-center gap-3 p-4"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    allDone
                      ? 'border-[#10B981] bg-[rgba(16,185,129,0.15)]'
                      : 'border-[rgba(65,50,50,0.4)]',
                  )}
                >
                  {allDone && <div className="w-2 h-2 rounded-full bg-[#10B981]" />}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[color:var(--text-0)]">
                      {exercise.name}
                    </span>
                    {exercise.isKPI && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[rgba(16,16,16,0.78)] text-[color:var(--accent)] border border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]">
                        KPI
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[color:var(--text-2)]">
                    {exercise.sets} × {exercise.reps} · {exercise.rest}s rest
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {exVolume > 0 && (
                    <span className="text-xs font-mono tabular-nums text-[#F59E0B]">
                      {Math.round(exVolume).toLocaleString()} kg
                    </span>
                  )}
                  <span className="text-xs font-mono tabular-nums text-[color:var(--text-2)]">
                    {doneSets}/{exercise.sets}
                  </span>
                  {isOpen ? (
                    <ChevronUp size={16} className="text-[color:var(--text-2)]" />
                  ) : (
                    <ChevronDown size={16} className="text-[color:var(--text-2)]" />
                  )}
                </div>
              </button>

              <div className="accordion-wrapper" data-open={isOpen}>
                <div className="accordion-inner">
                  <div className="px-4 pb-4 space-y-2">
                    <div className="grid grid-cols-[2.5rem_1fr_1fr_5rem] gap-2 px-1">
                      <span className="text-xs text-[color:var(--text-2)]">Set</span>
                      <span className="text-xs text-[color:var(--text-2)]">Weight kg</span>
                      <span className="text-xs text-[color:var(--text-2)]">Reps</span>
                      <span className="text-xs text-[color:var(--text-2)] text-center">Time</span>
                    </div>

                    {sets.map((log, i) => (
                      <div
                        key={i}
                        className={cn(
                          'grid grid-cols-[2.5rem_1fr_1fr_5rem] gap-2 items-center p-2 rounded-lg border transition-all',
                          log.timeStamped
                            ? 'border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.06)]'
                            : 'border-[rgba(65,50,50,0.2)] bg-[rgba(18,14,14,0.4)]',
                        )}
                      >
                        <span className="text-xs font-mono text-[color:var(--text-2)] text-center">
                          {i + 1}
                        </span>

                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={log.weight}
                          onChange={(e) =>
                            updateSet(exercise.exerciseId, i, 'weight', e.target.value)
                          }
                          placeholder={i > 0 ? sets[i - 1].weight || '—' : '—'}
                          className="w-full bg-[rgba(18,14,14,0.7)] border border-[rgba(65,50,50,0.25)] rounded px-2 py-1.5 text-sm text-[color:var(--text-0)] font-mono tabular-nums placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color-mix(in srgb,var(--accent) 40%,transparent0.4)]"
                        />

                        <input
                          type="number"
                          min="0"
                          value={log.reps}
                          onChange={(e) =>
                            updateSet(exercise.exerciseId, i, 'reps', e.target.value)
                          }
                          placeholder="—"
                          className="w-full bg-[rgba(18,14,14,0.7)] border border-[rgba(65,50,50,0.25)] rounded px-2 py-1.5 text-sm text-[color:var(--text-0)] font-mono tabular-nums placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color-mix(in srgb,var(--accent) 40%,transparent0.4)]"
                        />

                        <button
                          onClick={() => stampSet(exercise.exerciseId, i)}
                          className={cn(
                            'w-full h-8 rounded-lg text-xs font-mono font-semibold border transition-all',
                            log.timeStamped
                              ? 'border-[rgba(16,185,129,0.4)] bg-[rgba(16,185,129,0.12)] text-[#10B981]'
                              : 'border-[rgba(65,50,50,0.3)] text-[color:var(--text-2)] hover:border-[color-mix(in srgb,var(--accent) 40%,transparent0.4)] hover:text-[color:var(--text-0)]',
                          )}
                        >
                          {log.timeStamped ?? '—'}
                        </button>
                      </div>
                    ))}

                    {exercise.notes && (
                      <p className="text-xs text-[color:var(--text-2)] italic pt-1 px-1">
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Session notes */}
      <div className="glass-panel p-4 space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-1)]">Session Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Felt strong / fatigue / PR notes…"
          rows={2}
          className="w-full bg-[rgba(18,14,14,0.6)] border border-[rgba(65,50,50,0.25)] rounded-lg p-3 text-sm text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color-mix(in srgb,var(--accent) 40%,transparent0.4)] resize-none"
        />
      </div>

      {/* Finish */}
      <button
        onClick={handleFinish}
        disabled={isSaving || completedSets === 0}
        className={cn(
          'btn-primary w-full flex items-center justify-center gap-2',
          (isSaving || completedSets === 0) && 'opacity-40 cursor-not-allowed',
        )}
      >
        {isSaving ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
        ) : (
          <Trophy size={18} />
        )}
        {isSaving ? 'Saving…' : `Finish Session (${completedSets}/${totalSets} sets)`}
      </button>
    </div>
  );
}
