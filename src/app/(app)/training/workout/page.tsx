'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isValid, parseISO } from 'date-fns';
import { useAuthStore } from '@/stores';
import {
  useActiveProgram,
  useCreateWorkout,
  useWorkoutMediaPreference,
  useSaveWorkoutMediaPreference,
} from '@/controllers';
import { TrainingMediaModal } from '@/components/training/training-media-modal';
import { sessionTypeUsesMediaGate } from '@/lib/program-session-routes';
import { getCycleDay, findProgramSessionForCycleDay, today } from '@/lib/utils';
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

function parseSessionDateParam(raw: string | null, fallback: string): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return fallback;
  const d = parseISO(raw);
  return isValid(d) ? raw : fallback;
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function WorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const { data: program } = useActiveProgram(userId);
  const { mutate: createWorkout, isPending: isSaving } = useCreateWorkout(userId);
  const { data: savedWorkoutMediaUrl } = useWorkoutMediaPreference(userId);
  const { mutate: saveWorkoutMediaPreference } = useSaveWorkoutMediaPreference(userId);

  const todayStr = today();
  const sessionDate = parseSessionDateParam(searchParams.get('date'), todayStr);
  const mediaBypassRequested = searchParams.get('media') === '1';
  const cycleDay = program
    ? getCycleDay(program.startDate ?? todayStr, sessionDate, program.cycleLengthDays)
    : null;
  const session = findProgramSessionForCycleDay(program?.sessions, cycleDay);
  const exercises = session?.exercises ?? [];

  const needsSessionMediaGate = Boolean(
    program && session && sessionTypeUsesMediaGate(session.type),
  );
  const [mediaGatePassed, setMediaGatePassed] = useState(mediaBypassRequested);

  useEffect(() => {
    setMediaGatePassed(mediaBypassRequested);
  }, [mediaBypassRequested, sessionDate]);

  const showSessionMediaGate = needsSessionMediaGate && !mediaGatePassed;

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
      date: sessionDate,
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
          <p className="text-[color:var(--text-2)]">
            {sessionDate === todayStr
              ? 'No session found for today.'
              : 'No session found for the selected day.'}
          </p>
        </div>
      </div>
    );
  }

  if (showSessionMediaGate) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <TrainingMediaModal
          open
          sessionTitle={session.name}
          initialLastYouTubeUrl={savedWorkoutMediaUrl}
          onClose={() => router.push('/training')}
          onContinue={(result) => {
            saveWorkoutMediaPreference(result.youtubeUrl);
            setMediaGatePassed(true);
          }}
        />
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
          <button
            onClick={() =>
              session.type === 'recovery' ? router.push('/recovery') : router.push('/training')
            }
            className="btn-primary mt-2"
          >
            {session.type === 'recovery' ? 'Log Recovery' : 'Back to Training'}
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
        <div className="glass-panel p-6 text-center space-y-4 border-[3px] border-[color:color-mix(in_srgb,var(--good)_42%,transparent)]">
          <CheckCircle2 size={40} className="mx-auto text-[color:var(--good)]" aria-hidden />
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
              <div key={s.label} className="rounded-lg bg-[color:var(--surface-well)] p-3">
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
    <div className="mx-auto max-w-4xl space-y-4 pb-8 font-sans">
      {/* Sticky header */}
      <div className="sticky top-14 z-20 flex items-center gap-3 border-b border-[color:var(--chrome-border-subtle)] bg-[color:color-mix(in_srgb,var(--chrome-bg)_88%,transparent)] px-4 py-3 shadow-[var(--chrome-header-shadow)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-1.5 text-[color:var(--text-2)] hover:text-[color:var(--text-0)]"
          aria-label="Back"
        >
          <ArrowLeft size={18} className="text-current" aria-hidden />
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
            'flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-sm font-bold tabular-nums',
            started
              ? 'border-[color:color-mix(in_srgb,var(--good)_38%,transparent)] bg-[color:color-mix(in_srgb,var(--good)_12%,transparent)] text-[color:var(--good)]'
              : 'border-[color:var(--chrome-border)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)] text-[color:var(--text-2)]',
          )}
        >
          <Timer size={14} className="shrink-0 text-current" aria-hidden />
          {fmtTime(elapsed)}
        </div>
        <span className="font-mono tabular-nums text-[color:var(--accent)] font-bold text-sm">
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-1 h-1 overflow-hidden rounded-full bg-[color:var(--surface-track)]">
        <div
          className="h-full bg-[color:var(--accent)] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Session coaching / RIR — full accent frame (theme token, not edge-only) */}
      {session.notes && (
        <div className="glass-panel border border-[color:color-mix(in_srgb,var(--accent)_36%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)] p-3 sm:p-4">
          <p className="font-sans text-sm leading-relaxed text-[color:var(--text-0)]">
            {session.notes}
          </p>
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
              className={cn(
                'glass-panel overflow-hidden transition-[border-color,box-shadow] duration-200',
                allDone && 'opacity-80',
                isOpen && 'is-selected',
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : exercise.exerciseId)}
                className="flex w-full items-center gap-3 p-4 font-sans text-left"
              >
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    allDone
                      ? 'border-[color:var(--good)] bg-[color:color-mix(in_srgb,var(--good)_16%,transparent)]'
                      : 'border-[color:var(--chrome-border)]',
                  )}
                  aria-hidden
                >
                  {allDone && <div className="h-2 w-2 rounded-full bg-[color:var(--good)]" />}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[color:var(--text-0)]">
                      {exercise.name}
                    </span>
                    {exercise.isKPI && <span className="workout-kpi-badge">KPI</span>}
                  </div>
                  <p className="text-xs text-[color:var(--text-2)]">
                    {exercise.sets} × {exercise.reps} · {exercise.rest}s rest
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {exVolume > 0 && (
                    <span className="font-mono tabular-nums workout-volume-metric">
                      {Math.round(exVolume).toLocaleString()} kg
                    </span>
                  )}
                  <span className="text-xs font-mono tabular-nums text-[color:var(--text-2)]">
                    {doneSets}/{exercise.sets}
                  </span>
                  {isOpen ? (
                    <ChevronUp
                      size={16}
                      className="shrink-0 text-[color:var(--text-2)]"
                      aria-hidden
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="shrink-0 text-[color:var(--text-2)]"
                      aria-hidden
                    />
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
                          'grid grid-cols-[2.5rem_1fr_1fr_5rem] items-center gap-2 rounded-lg border p-2 transition-[border-color,box-shadow,background-color]',
                          log.timeStamped
                            ? 'border-[color:color-mix(in_srgb,var(--good)_38%,transparent)] bg-[color:color-mix(in_srgb,var(--good)_8%,transparent)]'
                            : 'border-[color:var(--chrome-border-subtle)] bg-[color:var(--surface-well)] focus-within:border-[color:color-mix(in_srgb,var(--accent)_48%,transparent)] focus-within:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_22%,transparent)]',
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
                          className="w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-1.5 font-mono text-sm tabular-nums text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                        />

                        <input
                          type="number"
                          min="0"
                          value={log.reps}
                          onChange={(e) =>
                            updateSet(exercise.exerciseId, i, 'reps', e.target.value)
                          }
                          placeholder="—"
                          className="w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-1.5 font-mono text-sm tabular-nums text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                        />

                        <button
                          type="button"
                          onClick={() => stampSet(exercise.exerciseId, i)}
                          className={cn(
                            'h-8 w-full rounded-lg border font-mono text-xs font-semibold transition-all',
                            log.timeStamped
                              ? 'border-[color:color-mix(in_srgb,var(--good)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--good)_14%,transparent)] text-[color:var(--good)]'
                              : 'border-[color:var(--chrome-border)] text-[color:var(--text-2)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[color:var(--text-0)]',
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
          className="w-full resize-none rounded-lg border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] p-3 font-sans text-sm text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
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
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[color:color-mix(in_srgb,var(--text-0)_35%,transparent)] border-t-[color:var(--text-0)]"
            aria-hidden
          />
        ) : (
          <Trophy size={18} className="shrink-0" aria-hidden />
        )}
        {isSaving ? 'Saving…' : `Finish Session (${completedSets}/${totalSets} sets)`}
      </button>
    </div>
  );
}
