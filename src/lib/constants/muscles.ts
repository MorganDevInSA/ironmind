export const muscleGroups = {
  chest: { label: 'Chest', priority: 'weakpoint' as const },
  back: { label: 'Back', priority: 'weakpoint' as const },
  quads: { label: 'Quads', priority: 'weakpoint' as const },
  hamstrings: { label: 'Hamstrings', priority: 'normal' as const },
  delts: { label: 'Shoulders', priority: 'strength' as const },
  biceps: { label: 'Biceps', priority: 'strength' as const },
  triceps: { label: 'Triceps', priority: 'normal' as const },
  calves: { label: 'Calves', priority: 'strength' as const },
  abs: { label: 'Abs', priority: 'normal' as const },
  forearms: { label: 'Forearms', priority: 'normal' as const },
  traps: { label: 'Traps', priority: 'normal' as const },
  glutes: { label: 'Glutes', priority: 'normal' as const },
} as const;

export type MuscleGroup = keyof typeof muscleGroups;

export const weakpointMuscles: MuscleGroup[] = Object.entries(muscleGroups)
  .filter(([, v]) => v.priority === 'weakpoint')
  .map(([k]) => k as MuscleGroup);

export const strengthMuscles: MuscleGroup[] = Object.entries(muscleGroups)
  .filter(([, v]) => v.priority === 'strength')
  .map(([k]) => k as MuscleGroup);

export function getMuscleLabel(group: MuscleGroup): string {
  return muscleGroups[group].label;
}

export function isWeakpoint(group: MuscleGroup): boolean {
  return muscleGroups[group].priority === 'weakpoint';
}

export function isStrength(group: MuscleGroup): boolean {
  return muscleGroups[group].priority === 'strength';
}
