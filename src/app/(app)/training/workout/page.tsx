'use client';

import { useState, useEffect, useCallback, useMemo, useReducer } from 'react';
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

/* ── Session-only workout draft state ─────────────────────────── */
type DraftSet = {
  id: string;
  weight: string;
  reps: string;
  timeStamped: string | null;
};

type DraftExercise = {
  id: string;
  sourceExerciseId?: string;
  name: string;
  repsTarget: number | string;
  restSec: number;
  isKPI?: boolean;
  notes?: string;
  muscleGroup?: string;
  sets: DraftSet[];
  order: number;
  isAddedByUser: boolean;
};

type WorkoutDraftState = {
  notes: string;
  startedAt: string;
  started: boolean;
  finished: boolean;
  expandedExerciseId: string | null;
  initializedSessionKey: string | null;
  exercises: DraftExercise[];
};

type WorkoutDraftAction =
  | { type: 'INIT_FROM_SESSION'; payload: { sessionKey: string; exercises: DraftExercise[] } }
  | { type: 'TOGGLE_EXPANDED'; payload: { exerciseId: string } }
  | { type: 'SET_SESSION_NOTES'; payload: { notes: string } }
  | { type: 'MARK_STARTED' }
  | { type: 'MARK_FINISHED' }
  | { type: 'ADD_EXERCISE'; payload: { exercise: DraftExercise } }
  | { type: 'REMOVE_EXERCISE'; payload: { exerciseId: string } }
  | {
      type: 'UPDATE_EXERCISE_FIELDS';
      payload: {
        exerciseId: string;
        patch: Partial<
          Pick<DraftExercise, 'name' | 'repsTarget' | 'restSec' | 'notes' | 'muscleGroup'>
        >;
      };
    }
  | { type: 'ADD_SET'; payload: { exerciseId: string } }
  | { type: 'SET_EXERCISE_SET_COUNT'; payload: { exerciseId: string; count: number } }
  | {
      type: 'UPDATE_SET_FIELD';
      payload: { exerciseId: string; setId: string; field: 'weight' | 'reps'; value: string };
    }
  | { type: 'TOGGLE_SET_STAMP'; payload: { exerciseId: string; setId: string; nowHHMM: string } };

function makeId(prefix: string) {
  return `${prefix}:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
}

function buildDraftSet(defaultReps: number | string): DraftSet {
  return {
    id: makeId('set'),
    weight: '',
    reps: typeof defaultReps === 'number' ? String(defaultReps) : '',
    timeStamped: null,
  };
}

function buildDraftExercises(exercises: SessionExercise[]): DraftExercise[] {
  return exercises.map((ex, index) => ({
    id: `ex:${ex.exerciseId}:${index}`,
    sourceExerciseId: ex.exerciseId,
    name: ex.name,
    repsTarget: ex.reps,
    restSec: ex.rest,
    isKPI: ex.isKPI,
    notes: ex.notes,
    muscleGroup: inferMuscle(ex.name),
    sets: Array.from({ length: ex.sets }, () => buildDraftSet(ex.reps)),
    order: index,
    isAddedByUser: false,
  }));
}

function workoutDraftReducer(
  state: WorkoutDraftState,
  action: WorkoutDraftAction,
): WorkoutDraftState {
  switch (action.type) {
    case 'INIT_FROM_SESSION':
      if (state.initializedSessionKey === action.payload.sessionKey) return state;
      return {
        ...state,
        initializedSessionKey: action.payload.sessionKey,
        exercises: action.payload.exercises,
        expandedExerciseId: action.payload.exercises[0]?.id ?? null,
      };
    case 'TOGGLE_EXPANDED':
      return {
        ...state,
        expandedExerciseId:
          state.expandedExerciseId === action.payload.exerciseId ? null : action.payload.exerciseId,
      };
    case 'SET_SESSION_NOTES':
      return { ...state, notes: action.payload.notes };
    case 'MARK_STARTED':
      return state.started ? state : { ...state, started: true };
    case 'MARK_FINISHED':
      return { ...state, finished: true };
    case 'ADD_EXERCISE': {
      const exercises = [
        ...state.exercises,
        { ...action.payload.exercise, order: state.exercises.length },
      ];
      return { ...state, exercises, expandedExerciseId: action.payload.exercise.id };
    }
    case 'REMOVE_EXERCISE': {
      const exercises = state.exercises
        .filter((ex) => ex.id !== action.payload.exerciseId)
        .map((ex, idx) => ({ ...ex, order: idx }));
      return {
        ...state,
        exercises,
        expandedExerciseId:
          state.expandedExerciseId === action.payload.exerciseId ? null : state.expandedExerciseId,
      };
    }
    case 'UPDATE_EXERCISE_FIELDS':
      return {
        ...state,
        exercises: state.exercises.map((ex) =>
          ex.id === action.payload.exerciseId ? { ...ex, ...action.payload.patch } : ex,
        ),
      };
    case 'ADD_SET':
      return {
        ...state,
        exercises: state.exercises.map((ex) =>
          ex.id === action.payload.exerciseId
            ? { ...ex, sets: [...ex.sets, buildDraftSet(ex.repsTarget)] }
            : ex,
        ),
      };
    case 'SET_EXERCISE_SET_COUNT':
      return {
        ...state,
        exercises: state.exercises.map((ex) => {
          if (ex.id !== action.payload.exerciseId) return ex;
          const nextCount = Math.max(1, Math.min(20, action.payload.count));
          if (nextCount === ex.sets.length) return ex;
          if (nextCount < ex.sets.length) {
            return { ...ex, sets: ex.sets.slice(0, nextCount) };
          }
          const add = Array.from({ length: nextCount - ex.sets.length }, () =>
            buildDraftSet(ex.repsTarget),
          );
          return { ...ex, sets: [...ex.sets, ...add] };
        }),
      };
    case 'UPDATE_SET_FIELD':
      return {
        ...state,
        exercises: state.exercises.map((ex) =>
          ex.id === action.payload.exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((set) =>
                  set.id === action.payload.setId
                    ? { ...set, [action.payload.field]: action.payload.value }
                    : set,
                ),
              }
            : ex,
        ),
      };
    case 'TOGGLE_SET_STAMP':
      return {
        ...state,
        exercises: state.exercises.map((ex) =>
          ex.id === action.payload.exerciseId
            ? {
                ...ex,
                sets: ex.sets.map((set) =>
                  set.id === action.payload.setId
                    ? {
                        ...set,
                        timeStamped: set.timeStamped ? null : action.payload.nowHHMM,
                      }
                    : set,
                ),
              }
            : ex,
        ),
      };
    default:
      return state;
  }
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
  const exercises = useMemo(() => session?.exercises ?? [], [session?.exercises]);

  const needsSessionMediaGate = Boolean(
    program && session && sessionTypeUsesMediaGate(session.type),
  );
  const [mediaGatePassed, setMediaGatePassed] = useState(mediaBypassRequested);

  useEffect(() => {
    setMediaGatePassed(mediaBypassRequested);
  }, [mediaBypassRequested, sessionDate]);

  const showSessionMediaGate = needsSessionMediaGate && !mediaGatePassed;

  const [draft, dispatch] = useReducer(workoutDraftReducer, {
    notes: '',
    startedAt: new Date().toISOString(),
    started: false,
    finished: false,
    expandedExerciseId: null,
    initializedSessionKey: null,
    exercises: [],
  });
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseReps, setNewExerciseReps] = useState('10');
  const [newExerciseRest, setNewExerciseRest] = useState('90');
  const [editExerciseModal, setEditExerciseModal] = useState<{
    open: boolean;
    exerciseId: string | null;
    name: string;
    repsTarget: string;
    restSec: string;
    setCount: string;
    notes: string;
  }>({
    open: false,
    exerciseId: null,
    name: '',
    repsTarget: '10',
    restSec: '90',
    setCount: '1',
    notes: '',
  });
  const elapsed = useElapsed(draft.started && !draft.finished);

  const sessionKey = `${sessionDate}:${session?.name ?? 'no-session'}:${exercises.length}`;
  useEffect(() => {
    if (!exercises.length) return;
    dispatch({
      type: 'INIT_FROM_SESSION',
      payload: {
        sessionKey,
        exercises: buildDraftExercises(exercises),
      },
    });
  }, [sessionKey, exercises]);

  const completedSets = draft.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((set) => set.timeStamped !== null).length,
    0,
  );
  const totalSets = draft.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
  const progress = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  const updateSet = useCallback(
    (exerciseId: string, setId: string, field: 'weight' | 'reps', val: string) => {
      dispatch({
        type: 'UPDATE_SET_FIELD',
        payload: { exerciseId, setId, field, value: val },
      });
    },
    [],
  );

  const stampSet = useCallback((exerciseId: string, setId: string) => {
    dispatch({
      type: 'TOGGLE_SET_STAMP',
      payload: { exerciseId, setId, nowHHMM: nowHHMM() },
    });
    dispatch({ type: 'MARK_STARTED' });
  }, []);

  const handleFinish = () => {
    dispatch({ type: 'MARK_FINISHED' });
    const workoutExercises: WorkoutExercise[] = draft.exercises.map((ex) => {
      const sets: ExerciseSet[] = ex.sets.map((log, si) => ({
        setNumber: si + 1,
        type: 'working' as const,
        weight: parseFloat(log.weight) || 0,
        reps: parseInt(log.reps) || 0,
        completed: log.timeStamped !== null,
      }));
      return {
        exerciseId: ex.sourceExerciseId ?? ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup ?? inferMuscle(ex.name),
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
      notes: draft.notes || undefined,
      startedAt: draft.startedAt,
      completedAt: new Date().toISOString(),
    });
  };

  const openEditExerciseModal = (exercise: DraftExercise) => {
    setEditExerciseModal({
      open: true,
      exerciseId: exercise.id,
      name: exercise.name,
      repsTarget: String(exercise.repsTarget),
      restSec: String(exercise.restSec),
      setCount: String(exercise.sets.length),
      notes: exercise.notes ?? '',
    });
  };

  const closeEditExerciseModal = () => {
    setEditExerciseModal((prev) => ({ ...prev, open: false, exerciseId: null }));
  };

  const saveEditExerciseModal = () => {
    if (!editExerciseModal.exerciseId) return;
    const name = editExerciseModal.name.trim();
    if (!name) return;
    const repsTargetRaw = editExerciseModal.repsTarget.trim();
    const repsTargetNum = Number(repsTargetRaw);
    const repsTarget =
      Number.isFinite(repsTargetNum) && repsTargetRaw !== '' ? repsTargetNum : repsTargetRaw;
    const restSec = Number.isFinite(Number(editExerciseModal.restSec))
      ? Math.max(0, Math.round(Number(editExerciseModal.restSec)))
      : 0;
    const setCount = Number.isFinite(Number(editExerciseModal.setCount))
      ? Math.max(1, Math.round(Number(editExerciseModal.setCount)))
      : 1;

    dispatch({
      type: 'UPDATE_EXERCISE_FIELDS',
      payload: {
        exerciseId: editExerciseModal.exerciseId,
        patch: {
          name,
          repsTarget,
          restSec,
          notes: editExerciseModal.notes.trim() || undefined,
          muscleGroup: inferMuscle(name),
        },
      },
    });
    dispatch({
      type: 'SET_EXERCISE_SET_COUNT',
      payload: { exerciseId: editExerciseModal.exerciseId, count: setCount },
    });
    closeEditExerciseModal();
  };

  const addExercisePanel = () => {
    const baseName = newExerciseName.trim() || 'Custom Exercise';
    const repsRaw = newExerciseReps.trim();
    const repsNum = Number(repsRaw);
    const repsTarget = Number.isFinite(repsNum) && repsRaw !== '' ? repsNum : repsRaw || '10';
    const restSec = Number.isFinite(Number(newExerciseRest))
      ? Math.max(0, Math.round(Number(newExerciseRest)))
      : 90;
    const exercise: DraftExercise = {
      id: makeId('ex'),
      name: baseName,
      repsTarget,
      restSec,
      sets: [buildDraftSet(repsTarget)],
      order: draft.exercises.length,
      isAddedByUser: true,
      muscleGroup: inferMuscle(baseName),
    };
    dispatch({ type: 'ADD_EXERCISE', payload: { exercise } });
    setNewExerciseName('');
    setNewExerciseReps('10');
    setNewExerciseRest('90');
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
  if (draft.finished) {
    const totalVolume = draft.exercises.reduce((s, ex) => {
      const logs = ex.sets ?? [];
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
            draft.started
              ? 'border-[color:color-mix(in_srgb,var(--accent)_42%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] text-[color:var(--accent-light)]'
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
        {draft.exercises.map((exercise) => {
          const sets = exercise.sets ?? [];
          const doneSets = sets.filter((s) => s.timeStamped !== null).length;
          const allDone = doneSets === exercise.sets.length;
          const isOpen = draft.expandedExerciseId === exercise.id;
          const exVolume = sets.reduce(
            (s, l) =>
              s + (l.timeStamped ? (parseFloat(l.weight) || 0) * (parseFloat(l.reps) || 0) : 0),
            0,
          );

          return (
            <div
              key={exercise.id}
              className={cn(
                'glass-panel overflow-hidden transition-[border-color,box-shadow] duration-200',
                allDone && 'opacity-80',
                isOpen && 'is-selected',
              )}
            >
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'TOGGLE_EXPANDED',
                    payload: { exerciseId: exercise.id },
                  })
                }
                className="flex w-full items-center gap-3 p-4 font-sans text-left"
              >
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                    allDone
                      ? 'border-[color:var(--accent-light)] bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)]'
                      : 'border-[color:var(--chrome-border)]',
                  )}
                  aria-hidden
                >
                  {allDone && (
                    <div className="h-2 w-2 rounded-full bg-[color:var(--accent-light)]" />
                  )}
                </div>

                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[color:var(--text-0)]">
                      {exercise.name}
                    </span>
                    {exercise.isKPI && <span className="workout-kpi-badge">KPI</span>}
                  </div>
                  <p className="text-sm text-[color:var(--text-0)]">
                    {exercise.sets.length} × {exercise.repsTarget} · {exercise.restSec}s rest
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {exVolume > 0 && (
                    <span className="font-mono tabular-nums workout-volume-metric">
                      {Math.round(exVolume).toLocaleString()} kg
                    </span>
                  )}
                  <span className="text-xs font-mono tabular-nums text-[color:var(--text-2)]">
                    {doneSets}/{exercise.sets.length}
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
                        key={log.id}
                        className={cn(
                          'grid grid-cols-[2.5rem_1fr_1fr_5rem] items-center gap-2 rounded-lg border p-2 transition-[border-color,box-shadow,background-color]',
                          log.timeStamped
                            ? 'border-[color:color-mix(in_srgb,var(--accent)_36%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)]'
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
                          onChange={(e) => updateSet(exercise.id, log.id, 'weight', e.target.value)}
                          placeholder={i > 0 ? sets[i - 1].weight || '—' : '—'}
                          className="w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-1.5 font-mono text-sm tabular-nums text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                        />

                        <input
                          type="number"
                          min="0"
                          value={log.reps}
                          onChange={(e) => updateSet(exercise.id, log.id, 'reps', e.target.value)}
                          placeholder="—"
                          className="w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-1.5 font-mono text-sm tabular-nums text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                        />

                        <button
                          type="button"
                          onClick={() => stampSet(exercise.id, log.id)}
                          className={cn(
                            'h-8 w-full rounded-lg border font-mono text-xs font-semibold transition-all',
                            log.timeStamped
                              ? 'border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_14%,transparent)] text-[color:var(--accent-light)]'
                              : 'border-[color:var(--chrome-border)] text-[color:var(--text-2)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[color:var(--text-0)]',
                          )}
                        >
                          {log.timeStamped ?? 'Start'}
                        </button>
                      </div>
                    ))}

                    {exercise.notes && (
                      <p className="text-xs text-[color:var(--text-2)] italic pt-1 px-1">
                        {exercise.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({ type: 'ADD_SET', payload: { exerciseId: exercise.id } })
                        }
                        className="btn-ghost px-3 py-1.5 text-xs"
                      >
                        + Add set
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditExerciseModal(exercise)}
                        className="btn-ghost px-3 py-1.5 text-xs"
                      >
                        Edit exercise
                      </button>
                      {draft.exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            dispatch({
                              type: 'REMOVE_EXERCISE',
                              payload: { exerciseId: exercise.id },
                            })
                          }
                          className="btn-ghost px-3 py-1.5 text-xs text-[color:var(--text-2)] hover:text-[color:var(--bad)]"
                        >
                          Remove panel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Add exercise panel (session-only) — directly below last exercise / sets */}
        <div className="glass-panel p-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
            Add Exercise (today only)
          </p>
          <div className="grid gap-2 sm:grid-cols-[1.5fr_0.7fr_0.7fr_auto]">
            <input
              type="text"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              placeholder="Exercise name"
              className="w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-2 text-sm text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
            />
            <input
              type="text"
              value={newExerciseReps}
              onChange={(e) => setNewExerciseReps(e.target.value)}
              placeholder="Reps"
              className="w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-2 text-sm text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
            />
            <input
              type="number"
              min={0}
              value={newExerciseRest}
              onChange={(e) => setNewExerciseRest(e.target.value)}
              placeholder="Rest s"
              className="w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-2 text-sm text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
            />
            <button
              type="button"
              onClick={addExercisePanel}
              className="btn-secondary px-3 py-2 text-sm"
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      {(session.cardio ||
        (session.breathWork?.length ?? 0) > 0 ||
        (session.coreWork?.length ?? 0) > 0 ||
        (session.mobility?.length ?? 0) > 0) && (
        <div className="glass-panel p-4 space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
            Session Plan Extras
          </p>

          {session.cardio && (
            <div className="space-y-1 rounded-lg bg-[color:var(--surface-track)] p-3">
              <p className="text-sm font-medium text-[color:var(--text-0)]">Cardio</p>
              <p className="text-sm text-[color:var(--text-0)]">
                {session.cardio.type} · {session.cardio.duration} min
                {session.cardio.note ? ` · ${session.cardio.note}` : ''}
              </p>
              {session.cardio.intervals && (
                <p className="text-sm text-[color:var(--text-0)] tabular-nums">
                  {session.cardio.intervals.work}s work / {session.cardio.intervals.rest}s rest ×{' '}
                  {session.cardio.intervals.rounds} rounds
                </p>
              )}
            </div>
          )}

          {(session.breathWork?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
                Breath Work
              </p>
              <ul className="space-y-1.5">
                {session.breathWork?.map((bw, i) => (
                  <li key={`${bw.name}-${i}`} className="text-sm">
                    <span className="font-medium text-[color:var(--text-0)]">{bw.name}</span>
                    <span className="ml-2 text-sm tabular-nums text-[color:var(--text-0)]">
                      in {bw.inhale}s{bw.hold != null ? ` · hold ${bw.hold}s` : ''} · out{' '}
                      {bw.exhale}s{bw.holdOut != null ? ` · pause ${bw.holdOut}s` : ''} ·{' '}
                      {bw.rounds} rnd
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(session.coreWork?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
                Core
              </p>
              <ul className="space-y-1.5">
                {session.coreWork?.map((core, i) => (
                  <li
                    key={`${core.name}-${i}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-[color:var(--text-0)]">{core.name}</span>
                    <span className="text-sm tabular-nums text-[color:var(--text-0)]">
                      {core.sets}×
                      {core.reps != null
                        ? core.reps
                        : core.holdSec != null
                          ? `${core.holdSec}s`
                          : '—'}
                      {core.perSide ? ' / side' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(session.mobility?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
                Mobility
              </p>
              <ul className="space-y-1.5">
                {session.mobility?.map((m, i) => (
                  <li
                    key={`${m}-${i}`}
                    className="border-l-2 border-[color:color-mix(in_srgb,var(--accent)_28%,transparent)] pl-2 text-sm text-[color:var(--text-0)]"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Session notes */}
      <div className="glass-panel p-4 space-y-2">
        <label className="text-sm font-medium text-[color:var(--text-1)]">Session Notes</label>
        <textarea
          value={draft.notes}
          onChange={(e) =>
            dispatch({ type: 'SET_SESSION_NOTES', payload: { notes: e.target.value } })
          }
          placeholder="Felt strong / fatigue / PR notes…"
          rows={2}
          className="w-full resize-none rounded-lg border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] p-3 font-sans text-sm text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
        />
      </div>

      {/* Edit exercise modal */}
      {editExerciseModal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close exercise editor"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeEditExerciseModal}
          />
          <div className="relative w-full max-w-lg glass-panel-strong p-4 space-y-3">
            <h3 className="text-base font-semibold text-[color:var(--text-0)]">
              Edit exercise panel
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs text-[color:var(--text-2)]">
                Name
                <input
                  type="text"
                  value={editExerciseModal.name}
                  onChange={(e) =>
                    setEditExerciseModal((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-2 text-sm text-[color:var(--text-0)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                />
              </label>
              <label className="text-xs text-[color:var(--text-2)]">
                Reps target
                <input
                  type="text"
                  value={editExerciseModal.repsTarget}
                  onChange={(e) =>
                    setEditExerciseModal((prev) => ({ ...prev, repsTarget: e.target.value }))
                  }
                  className="mt-1 w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-2 text-sm text-[color:var(--text-0)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                />
              </label>
              <label className="text-xs text-[color:var(--text-2)]">
                Rest (seconds)
                <input
                  type="number"
                  min={0}
                  value={editExerciseModal.restSec}
                  onChange={(e) =>
                    setEditExerciseModal((prev) => ({ ...prev, restSec: e.target.value }))
                  }
                  className="mt-1 w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-2 text-sm text-[color:var(--text-0)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                />
              </label>
              <label className="text-xs text-[color:var(--text-2)]">
                Number of sets
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={editExerciseModal.setCount}
                  onChange={(e) =>
                    setEditExerciseModal((prev) => ({ ...prev, setCount: e.target.value }))
                  }
                  className="mt-1 w-full rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-2 text-sm text-[color:var(--text-0)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                />
              </label>
            </div>
            <label className="text-xs text-[color:var(--text-2)] block">
              Notes
              <textarea
                rows={2}
                value={editExerciseModal.notes}
                onChange={(e) =>
                  setEditExerciseModal((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="mt-1 w-full resize-none rounded border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-2 py-2 text-sm text-[color:var(--text-0)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditExerciseModal}
                className="btn-ghost px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEditExerciseModal}
                className="btn-primary px-3 py-2 text-sm"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

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
