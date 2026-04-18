export const weightUnits = {
  kg: { label: 'kg', conversion: 1 },
  lbs: { label: 'lbs', conversion: 2.20462 },
} as const;

export const lengthUnits = {
  cm: { label: 'cm', conversion: 1 },
  in: { label: 'in', conversion: 0.393701 },
} as const;

export function convertWeight(value: number, from: 'kg' | 'lbs', to: 'kg' | 'lbs'): number {
  if (from === to) return value;
  if (from === 'kg' && to === 'lbs') return value * weightUnits.lbs.conversion;
  return value / weightUnits.lbs.conversion;
}

export function convertLength(value: number, from: 'cm' | 'in', to: 'cm' | 'in'): number {
  if (from === to) return value;
  if (from === 'cm' && to === 'in') return value * lengthUnits.in.conversion;
  return value / lengthUnits.in.conversion;
}

export function formatWeight(value: number, unit: 'kg' | 'lbs'): string {
  return `${value.toFixed(1)} ${weightUnits[unit].label}`;
}

export function formatLength(value: number, unit: 'cm' | 'in'): string {
  return `${value.toFixed(1)} ${lengthUnits[unit].label}`;
}
