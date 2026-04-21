// Centralized TanStack Query key factory
// All keys are scoped by userId — prevents cross-user cache bleed on sign-in/sign-out.
// Every call site: queryKeys(userId).domain.key()

export function queryKeys(userId: string) {
  return {
    profile: {
      all:      [userId, 'profile'] as const,
      detail:   () => [userId, 'profile', 'detail'] as const,
      isSeeded: () => [userId, 'profile', 'is-seeded'] as const,
    },
    training: {
      all:           [userId, 'training'] as const,
      programs:      () => [userId, 'training', 'programs'] as const,
      activeProgram: () => [userId, 'training', 'active-program'] as const,
      workouts:      (dateRange?: { from: string; to: string }) =>
                       [userId, 'training', 'workouts', dateRange] as const,
      workout:       (id: string) => [userId, 'training', 'workout', id] as const,
      exercises:     () => [userId, 'training', 'exercises'] as const,
    },
    nutrition: {
      all:        [userId, 'nutrition'] as const,
      day:        (date: string) => [userId, 'nutrition', 'day', date] as const,
      history:    (dateRange: { from: string; to: string }) =>
                    [userId, 'nutrition', 'history', dateRange] as const,
      recentDays: (days: number) => [userId, 'nutrition', 'recent-days', days] as const,
      plan:       () => [userId, 'nutrition', 'plan'] as const,
    },
    recovery: {
      all:              [userId, 'recovery'] as const,
      entry:            (date: string) => [userId, 'recovery', 'entry', date] as const,
      trend:            (days: number) => [userId, 'recovery', 'trend', days] as const,
      latest:           () => [userId, 'recovery', 'latest'] as const,
      averageReadiness: (days: number) => [userId, 'recovery', 'average-readiness', days] as const,
    },
    physique: {
      all:            [userId, 'physique'] as const,
      checkIns:       () => [userId, 'physique', 'check-ins'] as const,
      recentCheckIns: (limit: number) => [userId, 'physique', 'recent-check-ins', limit] as const,
      latestCheckIn:  () => [userId, 'physique', 'latest-check-in'] as const,
      weightTrend:    (days: number) => [userId, 'physique', 'weight-trend', days] as const,
      measurements:   () => [userId, 'physique', 'measurements'] as const,
    },
    supplements: {
      all:        [userId, 'supplements'] as const,
      protocol:   () => [userId, 'supplements', 'protocol'] as const,
      log:        (date: string) => [userId, 'supplements', 'log', date] as const,
      compliance: (days: number) => [userId, 'supplements', 'compliance', days] as const,
    },
    coaching: {
      all:         [userId, 'coaching'] as const,
      phases:      () => [userId, 'coaching', 'phases'] as const,
      activePhase: () => [userId, 'coaching', 'active-phase'] as const,
      journal:     (limit?: number) => [userId, 'coaching', 'journal', limit] as const,
    },
    volume: {
      all:       [userId, 'volume'] as const,
      landmarks: () => [userId, 'volume', 'landmarks'] as const,
      weekly:    () => [userId, 'volume', 'weekly'] as const,
      trend:     (muscleGroup: string, weeks: number) =>
                   [userId, 'volume', 'trend', muscleGroup, weeks] as const,
    },
    alerts: {
      all:     [userId, 'alerts'] as const,
      active:  () => [userId, 'alerts', 'active'] as const,
      summary: () => [userId, 'alerts', 'summary'] as const,
    },
    export: {
      all:     [userId, 'export'] as const,
      summary: (options: unknown) => [userId, 'export', 'summary', options] as const,
    },
  };
}

export type QueryKeys = ReturnType<typeof queryKeys>;
