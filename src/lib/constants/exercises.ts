import type { Exercise } from '@/lib/types';

export const exercises: Exercise[] = [
  // Shoulders (Morgan's strength)
  {
    id: 'seated-db-ohp',
    name: 'Seated DB Overhead Press',
    muscleGroup: 'delts',
    equipment: 'dumbbells',
    movementPattern: 'push',
    prolapseSafe: true,
    instructions: 'Seated position reduces intra-abdominal pressure. Control the tempo.',
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    muscleGroup: 'delts',
    equipment: 'dumbbells',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Light weight, controlled movement. Avoid swinging.',
  },
  {
    id: 'rear-delt-flye',
    name: 'Rear Delt Flye',
    muscleGroup: 'delts',
    equipment: 'dumbbells',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Bent over or seated. Keep back neutral.',
  },
  {
    id: 'shrug',
    name: 'Shrug',
    muscleGroup: 'traps',
    equipment: 'dumbbells',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Elevate shoulders toward ears. Control the descent.',
  },

  // Chest (Morgan's weakpoint)
  {
    id: 'db-bench',
    name: 'Dumbbell Bench Press',
    muscleGroup: 'chest',
    equipment: 'dumbbells',
    movementPattern: 'push',
    prolapseSafe: true,
    instructions: 'KPI exercise. Flat bench. Control tempo 3-1-2-0.',
  },
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    equipment: 'dumbbells',
    movementPattern: 'push',
    prolapseSafe: true,
    instructions: '30-45 degree incline. Watch for front delt fatigue from previous shoulder work.',
  },
  {
    id: 'decline-press',
    name: 'Decline Press',
    muscleGroup: 'chest',
    equipment: 'dumbbells',
    movementPattern: 'push',
    prolapseSafe: true,
    instructions: 'Decline bench targets lower chest.',
  },
  {
    id: 'cable-flye',
    name: 'Cable Flye / Pec Deck',
    muscleGroup: 'chest',
    equipment: 'cables',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Squeeze at peak contraction. Control the negative.',
  },
  {
    id: 'close-grip-bench',
    name: 'Close Grip Bench',
    muscleGroup: 'triceps',
    equipment: 'barbell',
    movementPattern: 'push',
    prolapseSafe: true,
    instructions: 'Hands shoulder-width apart. Focus on triceps.',
  },

  // Back (Morgan's weakpoint)
  {
    id: 'pull-ups',
    name: 'Pull-ups',
    muscleGroup: 'back',
    equipment: 'bodyweight',
    movementPattern: 'pull',
    prolapseSafe: true,
    instructions: 'KPI exercise. Track total reps across 3 sets. Use band assistance if needed.',
  },
  {
    id: 'meadows-row',
    name: 'Meadows Row',
    muscleGroup: 'back',
    equipment: 'barbell',
    movementPattern: 'pull',
    prolapseSafe: true,
    instructions: 'Landmine-style row. Great for lat thickness.',
  },
  {
    id: 't-bar-row',
    name: 'T-Bar Row',
    muscleGroup: 'back',
    equipment: 'barbell',
    movementPattern: 'pull',
    prolapseSafe: true,
    instructions: 'Chest supported if possible. Alternative to Meadows Row.',
  },
  {
    id: 'chest-supported-row',
    name: 'Chest Supported Row',
    muscleGroup: 'back',
    equipment: 'machine',
    movementPattern: 'pull',
    prolapseSafe: true,
    instructions: 'Prone position supports lower back.',
  },

  // Quads (Morgan's weakpoint) - Prolapse-safe alternatives
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    muscleGroup: 'quads',
    equipment: 'dumbbells',
    movementPattern: 'lunge',
    prolapseSafe: true,
    instructions: 'KPI exercise. Unilateral movement, easier on pelvic floor than squats. Control tempo.',
  },
  {
    id: 'sissy-squat',
    name: 'Sissy Squat',
    muscleGroup: 'quads',
    equipment: 'bodyweight',
    movementPattern: 'squat',
    prolapseSafe: true,
    instructions: 'Bodyweight only. Controlled tempo. Stop if pelvic discomfort occurs.',
  },
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    muscleGroup: 'quads',
    equipment: 'dumbbells',
    movementPattern: 'lunge',
    prolapseSafe: true,
    instructions: 'Unilateral movement. Rear foot elevated. Control descent.',
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    muscleGroup: 'quads',
    equipment: 'machine',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Machine-based isolation. No spinal loading.',
  },

  // Hamstrings
  {
    id: 'nordic-curl',
    name: 'Nordic Curl',
    muscleGroup: 'hamstrings',
    equipment: 'bodyweight',
    movementPattern: 'hinge',
    prolapseSafe: true,
    instructions: 'Anchor feet under pad. Lower under control. Use band assistance if needed.',
  },
  {
    id: 'floor-slide-curl',
    name: 'Floor Slide Curl',
    muscleGroup: 'hamstrings',
    equipment: 'bodyweight',
    movementPattern: 'hinge',
    prolapseSafe: true,
    instructions: 'Sliding leg curl on floor. No equipment needed.',
  },
  {
    id: 'roman-deadlift',
    name: 'Romanian Deadlift',
    muscleGroup: 'hamstrings',
    equipment: 'dumbbells',
    movementPattern: 'hinge',
    prolapseSafe: true,
    instructions: 'Light weight. Focus on hamstring stretch. Avoid heavy loading.',
  },
  {
    id: 'leg-curl',
    name: 'Lying Leg Curl',
    muscleGroup: 'hamstrings',
    equipment: 'machine',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Machine-based. No spinal loading.',
  },

  // Biceps (Morgan's strength)
  {
    id: 'bb-curl',
    name: 'Barbell Curl',
    muscleGroup: 'biceps',
    equipment: 'barbell',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Strict form. No swinging.',
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbells',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Neutral grip. Targets brachialis and forearms.',
  },
  {
    id: 'incline-curl',
    name: 'Incline Dumbbell Curl',
    muscleGroup: 'biceps',
    equipment: 'dumbbells',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Incline bench for stretch position.',
  },

  // Triceps
  {
    id: 'oh-extension',
    name: 'Overhead Extension',
    muscleGroup: 'triceps',
    equipment: 'dumbbells',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Single or double arm. Full stretch at bottom.',
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    muscleGroup: 'triceps',
    equipment: 'cables',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Keep elbows tucked. Squeeze at contraction.',
  },
  {
    id: 'skullcrusher',
    name: 'Skullcrusher',
    muscleGroup: 'triceps',
    equipment: 'barbell',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Control the descent. Keep upper arms fixed.',
  },

  // Calves (Morgan's strength)
  {
    id: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    muscleGroup: 'calves',
    equipment: 'machine',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Full range of motion. Pause at stretch and contraction.',
  },
  {
    id: 'seated-calf-raise',
    name: 'Seated Calf Raise',
    muscleGroup: 'calves',
    equipment: 'machine',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Targets soleus. High reps.',
  },
  {
    id: 'donkey-calf-raise',
    name: 'Donkey Calf Raise',
    muscleGroup: 'calves',
    equipment: 'machine',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Hinge at hips. Weight on lower back/hips.',
  },

  // Core - Prolapse-safe only
  {
    id: 'dead-bug',
    name: 'Dead Bug',
    muscleGroup: 'abs',
    equipment: 'bodyweight',
    movementPattern: 'core',
    prolapseSafe: true,
    instructions: 'Low intra-abdominal pressure. Opposite arm/leg extension.',
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    muscleGroup: 'abs',
    equipment: 'bodyweight',
    movementPattern: 'core',
    prolapseSafe: true,
    instructions: 'Hold position. Progress by increasing duration. Stop if pelvic discomfort.',
  },
  {
    id: 'pallof-press',
    name: 'Pallof Press',
    muscleGroup: 'abs',
    equipment: 'cables',
    movementPattern: 'core',
    prolapseSafe: true,
    instructions: 'Anti-rotation exercise. Resist the pull.',
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    muscleGroup: 'abs',
    equipment: 'bodyweight',
    movementPattern: 'core',
    prolapseSafe: true,
    instructions: 'Opposite arm/leg extension. Maintain neutral spine.',
  },
  {
    id: 'reverse-crunch',
    name: 'Reverse Crunch',
    muscleGroup: 'abs',
    equipment: 'bodyweight',
    movementPattern: 'core',
    prolapseSafe: true,
    instructions: 'Controlled movement. Monitor pelvic comfort.',
  },

  // Forearms
  {
    id: 'wrist-curl',
    name: 'Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'barbell',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Seated, forearms on thighs. Full wrist flexion.',
  },
  {
    id: 'reverse-wrist-curl',
    name: 'Reverse Wrist Curl',
    muscleGroup: 'forearms',
    equipment: 'barbell',
    movementPattern: 'isolation',
    prolapseSafe: true,
    instructions: 'Extensor focus. Light weight, high reps.',
  },
  {
    id: 'farmers-walk',
    name: "Farmer's Walk",
    muscleGroup: 'forearms',
    equipment: 'dumbbells',
    movementPattern: 'functional',
    prolapseSafe: true,
    instructions: 'Heavy dumbbells. Walk for time or distance.',
  },

  // Glutes
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    muscleGroup: 'glutes',
    equipment: 'barbell',
    movementPattern: 'hip-hinge',
    prolapseSafe: true,
    instructions: 'Shoulders on bench. Control the weight. Monitor pelvic comfort.',
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    muscleGroup: 'glutes',
    equipment: 'bodyweight',
    movementPattern: 'hip-hinge',
    prolapseSafe: true,
    instructions: 'Floor-based. No spinal loading. Squeeze glutes at top.',
  },
  {
    id: 'cable-pull-through',
    name: 'Cable Pull Through',
    muscleGroup: 'glutes',
    equipment: 'cables',
    movementPattern: 'hip-hinge',
    prolapseSafe: true,
    instructions: 'Hinge at hips. Cable provides constant tension.',
  },
];

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find(e => e.id === id);
}

export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  return exercises.filter(e => e.muscleGroup === muscleGroup);
}

export function getProlapseSafeExercises(): Exercise[] {
  return exercises.filter(e => e.prolapseSafe);
}

export function getKPIExercises(): Exercise[] {
  const kpiIds = ['db-bench', 'pull-ups', 'walking-lunge'];
  return exercises.filter(e => kpiIds.includes(e.id));
}
