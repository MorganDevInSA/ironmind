// User & Profile Types
export interface AthleteProfile {
  clientName?: string;
  sex?: 'male' | 'female';
  age: number;
  height: string;
  currentWeight: number;
  targetWeight: number;
  weightUnit: 'kg' | 'lbs';
  trainingAge: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  currentPhase: string;
  primaryGoal: string;
  secondaryGoals: string[];
  injuryConstraints: InjuryConstraint[];
  strengthBodyparts: string[];
  weakpointBodyparts: string[];
  nutritionStyle: string;
  metabolismNote?: string;
}

export interface InjuryConstraint {
  name: string;
  implications: string[];
  adaptations: string[];
}

// Training Types
export type SessionType = 'lift' | 'cardio' | 'recovery';

export interface Program {
  id: string;
  name: string;
  cycleLengthDays: number;
  splitType: string;
  sessions: ProgramSession[];
  isActive: boolean;
  startDate?: string;
  kpis: KPI[];
  progressionRule: string;
  volumeTracking: Record<string, VolumeTrackingInfo>;
}

export interface ProgramSession {
  dayNumber: number;
  name: string;
  type: SessionType;
  exercises?: SessionExercise[];
  cardio?: CardioBlock;
  breathWork?: BreathWorkBlock[];
  coreWork?: CoreExercise[];
  mobility?: string[];
  notes?: string;
}

export interface SessionExercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number | string;
  rest: number;
  isKPI?: boolean;
  notes?: string;
}

export interface CardioBlock {
  type: string;
  duration: number;
  intervals?: { work: number; rest: number; rounds: number };
  note?: string;
}

export interface BreathWorkBlock {
  name: string;
  inhale: number;
  hold?: number;
  exhale: number;
  holdOut?: number;
  rounds: number;
}

export interface CoreExercise {
  name: string;
  sets: number;
  reps?: number;
  holdSec?: number;
  perSide: boolean;
  prolapseSafe: boolean;
}

export interface KPI {
  exercise: string;
  metric: string;
  days: number[];
}

export interface VolumeTrackingInfo {
  setsPerCycle: number;
  setsPerWeek: number;
  status: string;
}

export interface Workout {
  id: string;
  programId: string;
  cycleDayNumber: number;
  sessionName: string;
  sessionType: SessionType;
  date: string;
  exercises: WorkoutExercise[];
  durationMinutes: number;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  /** Firestore `updatedAt` (ISO) — used for optimistic concurrency on set-level writes */
  updatedAt?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface ExerciseSet {
  setNumber: number;
  type: 'working' | 'warmup' | 'dropset' | 'failure';
  weight: number;
  reps: number;
  rpe?: number;
  rir?: number;
  tempo?: string;
  completed: boolean;
  isPersonalRecord?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  movementPattern: string;
  prolapseSafe: boolean;
  instructions?: string;
}

// Nutrition Types
export type DayType = 'recovery' | 'moderate' | 'high' | 'highest';

export interface NutritionDay {
  id: string;
  date: string;
  dayType: DayType;
  meals: Meal[];
  macroTargets: MacroTargetRange;
  macroActuals: MacroActuals;
  complianceScore: number;
  agentNotes?: string;
}

export interface Meal {
  slot: string;
  time: string;
  foods: Food[];
  completed: boolean;
  /** Selected meal-plan line from schedule options; persisted on the nutrition day document. */
  planLine?: string;
}

export interface Food {
  id: string;
  name: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  quantity: number;
  unit: string;
}

export interface MacroTargetRange {
  calories: [number, number];
  protein: number;
  carbs: [number, number];
  fat: [number, number] | null;
}

export interface MacroActuals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealSlot {
  slot: string;
  time: string;
  liftDay?: string;
  recoveryDay?: string;
  liftDayOnly?: boolean;
  default: string;
}

// Supplement Types
export interface SupplementProtocol {
  windows: SupplementWindow[];
  notes: string[];
  intent: string[];
}

export interface SupplementWindow {
  timing: 'morning' | 'lunch' | 'afternoon' | 'dinner' | 'bed';
  withMeal: string | null;
  time?: string;
  supplements: string[];
  optional?: string[];
}

export interface SupplementLog {
  id: string;
  date: string;
  windows: Record<string, Record<string, boolean>>;
  compliancePercent: number;
}

// Recovery Types
export interface RecoveryEntry {
  id: string;
  date: string;
  sleepHours: number;
  sleepQuality: number;
  hrv: number;
  mood: number;
  stress: number;
  energy: number;
  doms: number;
  /** @deprecated Removed from UI — kept optional for historical entries */
  pelvicComfort?: number;
  readinessScore: number;
  cardioSession?: CardioSessionLog;
  breathWork?: BreathWorkLog[];
  coreWork?: CoreWorkLog[];
}

export interface CardioSessionLog {
  type: string;
  duration: number;
  notes?: string;
}

export interface BreathWorkLog {
  name: string;
  completed: boolean;
  notes?: string;
}

export interface CoreWorkLog {
  name: string;
  sets: number;
  reps?: number;
  holdSec?: number;
  perSide: boolean;
  completed: boolean;
}

// Physique Types
export interface CheckIn {
  id: string;
  date: string;
  bodyweight: number;
  measurements: Measurements;
  photoUrls: string[];
  conditioningScore: number;
  symmetryNotes: string;
  coachNotes: string;
}

export interface Measurements {
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;
  shoulders?: number;
}

// Coaching Types
export interface Phase {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  targets: PhaseTargets;
}

export interface PhaseTargets {
  startWeight: number;
  targetWeight: number;
  weightUnit: 'kg' | 'lbs';
  strategy: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  tags: string[];
}

// Volume Landmarks
/** Persisted aggregate for dashboard weekly volume card (`weeklyVolumeRollups/{weekStart}`). */
export interface WeeklyVolumeRollup {
  id: string;
  /** Monday calendar date `yyyy-MM-dd` (same as document id). */
  weekStart: string;
  /** Completed set counts per muscle group key for this ISO week. */
  muscleSets: Record<string, number>;
  computedAt: string;
}

export interface VolumeLandmarks {
  chest: LandmarkRange;
  back: LandmarkRange;
  quads: LandmarkRange;
  hamstrings: LandmarkRange;
  delts: LandmarkRange;
  biceps: LandmarkRange;
  triceps: LandmarkRange;
  calves: LandmarkRange;
}

export interface LandmarkRange {
  mv: number;
  mev: number;
  mav: number;
  mrv: number;
  currentTarget: number;
  unit: string;
}

// Alerts
export interface SmartAlert {
  id: string;
  type: 'spillover' | 'fatigue' | 'calorie_emergency' | 'pelvic_comfort' | 'progression' | 'info';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  action?: string;
  createdAt: string;
}

/** Bump when stored shapes or parsers change in a breaking way (see ARCHITECTURE.md). */
export const CURRENT_DATA_SCHEMA_VERSION = 1 as const;

// User
export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  createdAt: string;
  isSeeded: boolean;
  /** Optional; missing treated as `1` for reads. */
  dataSchemaVersion?: number;
  /**
   * Last session-audio choice for training (canonical https YouTube URL).
   * `null` means the user explicitly chose “Skip audio”; omit/`undefined` if never saved.
   */
  lastWorkoutYouTubeUrl?: string | null;
}

// Export Options
export interface ExportOptions {
  historyDays: number;
  includeProfile: boolean;
  includeProgram: boolean;
  includeWorkouts: boolean;
  includeNutrition: boolean;
  includeRecovery: boolean;
  includePhysique: boolean;
  includeSupplements: boolean;
  includeAlerts: boolean;
  includeCoachingNotes: boolean;
}
