// Per-domain stale time configuration
// Tuned to actual usage patterns to minimize API calls
// All values in milliseconds

export const staleTimes = {
  // Profile - changes rarely, only on manual edit
  profile: Infinity,

  // Training
  activeProgram: Infinity,      // Changes only when user switches programs
  programs: Infinity,            // Changes only on create/edit
  workouts: 5 * 60 * 1000,      // 5 min - recent workouts might be viewed across pages
  exercises: Infinity,           // Static data, never changes

  // Nutrition
  nutritionDay: 2 * 60 * 1000,   // 2 min - actively logging meals
  nutritionHistory: 5 * 60 * 1000, // 5 min
  macroTargets: Infinity,      // Changes only on manual edit

  // Recovery
  recovery: 10 * 60 * 1000,      // 10 min - logged once per morning
  recoveryTrend: 10 * 60 * 1000, // 10 min

  // Physique
  checkIns: Infinity,           // Changes only on new check-in
  weightTrend: 10 * 60 * 1000, // 10 min
  measurements: Infinity,       // Changes only on new check-in

  // Supplements
  protocol: Infinity,           // Supplement protocol rarely changes
  supplementLog: 30 * 1000,     // 30 sec - actively checking items
  supplementCompliance: 2 * 60 * 1000, // 2 min

  // Coaching
  phases: Infinity,            // Changes rarely
  journal: 5 * 60 * 1000,       // 5 min

  // Volume & Alerts
  landmarks: Infinity,          // Manual configuration
  weeklyVolume: 5 * 60 * 1000, // 5 min - computed from workouts
  alerts: 5 * 60 * 1000,        // 5 min - computed from other data

  // Export
  exportSummary: 2 * 60 * 1000, // 2 min
} as const;

// Garbage collection time - data stays in cache for 30 minutes after unmount
export const gcTime = 30 * 60 * 1000; // 30 minutes

// Retry configuration
export const retryConfig = {
  default: 3,
  mutations: 2,
} as const;

// Refetch configuration
export const refetchConfig = {
  // Don't refetch on window focus by default to save API calls
  refetchOnWindowFocus: false,
  // Don't refetch on reconnect by default
  refetchOnReconnect: false,
  // Retry failed queries
  retry: retryConfig.default,
} as const;
