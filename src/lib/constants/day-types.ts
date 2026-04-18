import type { DayType } from '@/lib/types';

export const dayTypes: { value: DayType; label: string; description: string }[] = [
  {
    value: 'recovery',
    label: 'Recovery',
    description: 'Rest day - lower calories, focus on recovery',
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Light training or cardio day',
  },
  {
    value: 'high',
    label: 'High',
    description: 'Standard training day',
  },
  {
    value: 'highest',
    label: 'Highest',
    description: 'Heavy training day - highest output',
  },
];

export const defaultMacroTargets: Record<DayType, { calories: [number, number]; protein: number; carbs: [number, number]; fat: [number, number] | null }> = {
  recovery: {
    calories: [2500, 2900],
    protein: 190,
    carbs: [180, 250],
    fat: null,
  },
  moderate: {
    calories: [2900, 3300],
    protein: 190,
    carbs: [275, 350],
    fat: null,
  },
  high: {
    calories: [3200, 3600],
    protein: 190,
    carbs: [350, 450],
    fat: null,
  },
  highest: {
    calories: [3400, 3800],
    protein: 190,
    carbs: [400, 500],
    fat: null,
  },
};

export function getDayTypeLabel(type: DayType): string {
  return dayTypes.find(d => d.value === type)?.label || type;
}

export function getDayTypeDescription(type: DayType): string {
  return dayTypes.find(d => d.value === type)?.description || '';
}
