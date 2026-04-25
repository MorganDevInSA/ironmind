import { format, parseISO, addDays, subDays, isSameDay, isToday as isTodayDateFns } from 'date-fns';

export function formatDate(date: Date | string | number, pattern = 'yyyy-MM-dd'): string {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  return format(d, pattern);
}

export function formatDisplayDate(date: Date | string | number): string {
  return formatDate(date, 'dd/MM/yyyy');
}

export function formatShortDate(date: Date | string | number): string {
  return formatDate(date, 'dd/MM');
}

export function today(): string {
  return formatDate(new Date());
}

/**
 * Calendar key for comparisons and charts. Firestore converters may surface
 * `date` as full ISO (`2026-04-19T00:00:00.000Z`); those strings sort *after*
 * plain `yyyy-MM-dd` bounds and fail `<= trendTo` filters even when the day is in range.
 */
export function toDateOnlyKey(raw: string | undefined | null): string {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : s;
}

export function parseDate(dateString: string): Date {
  return parseISO(dateString);
}

export function getDaysInRange(from: string, to: string): string[] {
  const days: string[] = [];
  let current = parseISO(from);
  const end = parseISO(to);

  while (current <= end) {
    days.push(formatDate(current));
    current = addDays(current, 1);
  }

  return days;
}

export function getLastNDays(n: number): string[] {
  const today = new Date();
  const days: string[] = [];

  for (let i = n - 1; i >= 0; i--) {
    days.push(formatDate(subDays(today, i)));
  }

  return days;
}

export function isSameDate(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return isSameDay(d1, d2);
}

export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isTodayDateFns(d);
}

export function getWeekStart(date: Date | string = new Date()): Date {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

export function getWeekEnd(date: Date | string = new Date()): Date {
  const start = getWeekStart(date);
  return addDays(start, 6);
}

export function getDayName(date: Date | string, short = false): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, short ? 'EEE' : 'EEEE');
}
