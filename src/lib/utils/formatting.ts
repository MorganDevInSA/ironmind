export function formatWeight(value: number, decimals = 1): string {
  return value.toFixed(decimals);
}

export function formatReps(reps: number | string): string {
  if (typeof reps === 'string') return reps;
  return reps.toString();
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatPercentage(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCalories(value: number): string {
  return value.toLocaleString();
}

export function formatMacro(value: number, unit = 'g'): string {
  return `${Math.round(value)}${unit}`;
}

export function formatRestTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatRPE(rpe: number): string {
  return rpe.toFixed(1);
}

export function formatReadinessScore(score: number): string {
  return Math.round(score).toString();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function snakeToTitle(str: string): string {
  return str
    .split('_')
    .map(word => capitalize(word))
    .join(' ');
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toFixed(decimals);
}

export function formatTrend(value: number, unit = 'kg'): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}${unit}`;
}

export function formatVolume(sets: number): string {
  return `${sets} ${sets === 1 ? 'set' : 'sets'}`;
}
