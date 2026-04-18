// Centralized TanStack Query key factory
// All cache keys defined in one place, namespaced by domain
// Prevents key collisions and makes invalidation predictable

export const queryKeys = {
  profile: {
    all: ['profile'] as const,
    detail: () => [...queryKeys.profile.all, 'detail'] as const,
  },
  training: {
    all: ['training'] as const,
    programs: () => [...queryKeys.training.all, 'programs'] as const,
    activeProgram: () => [...queryKeys.training.all, 'active-program'] as const,
    workouts: (dateRange?: { from: string; to: string }) =>
      [...queryKeys.training.all, 'workouts', dateRange] as const,
    workout: (id: string) => [...queryKeys.training.all, 'workout', id] as const,
    exercises: () => [...queryKeys.training.all, 'exercises'] as const,
  },
  nutrition: {
    all: ['nutrition'] as const,
    day: (date: string) => [...queryKeys.nutrition.all, 'day', date] as const,
    history: (dateRange: { from: string; to: string }) =>
      [...queryKeys.nutrition.all, 'history', dateRange] as const,
    macroTargets: () => [...queryKeys.nutrition.all, 'macro-targets'] as const,
  },
  recovery: {
    all: ['recovery'] as const,
    entry: (date: string) => [...queryKeys.recovery.all, 'entry', date] as const,
    trend: (days: number) => [...queryKeys.recovery.all, 'trend', days] as const,
    latest: () => [...queryKeys.recovery.all, 'latest'] as const,
  },
  physique: {
    all: ['physique'] as const,
    checkIns: () => [...queryKeys.physique.all, 'check-ins'] as const,
    weightTrend: (days: number) => [...queryKeys.physique.all, 'weight-trend', days] as const,
    measurements: () => [...queryKeys.physique.all, 'measurements'] as const,
  },
  supplements: {
    all: ['supplements'] as const,
    protocol: () => [...queryKeys.supplements.all, 'protocol'] as const,
    log: (date: string) => [...queryKeys.supplements.all, 'log', date] as const,
    compliance: (days: number) => [...queryKeys.supplements.all, 'compliance', days] as const,
  },
  coaching: {
    all: ['coaching'] as const,
    phases: () => [...queryKeys.coaching.all, 'phases'] as const,
    journal: (limit?: number) => [...queryKeys.coaching.all, 'journal', limit] as const,
  },
  volume: {
    all: ['volume'] as const,
    landmarks: () => [...queryKeys.volume.all, 'landmarks'] as const,
    weekly: () => [...queryKeys.volume.all, 'weekly'] as const,
  },
  alerts: {
    all: ['alerts'] as const,
    active: () => [...queryKeys.alerts.all, 'active'] as const,
  },
  export: {
    all: ['export'] as const,
    summary: (options: unknown) => [...queryKeys.export.all, 'summary', options] as const,
  },
} as const;

// Type-safe query key helper
export type QueryKeys = typeof queryKeys;
