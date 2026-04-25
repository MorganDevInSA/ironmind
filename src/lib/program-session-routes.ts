import type { ProgramSession } from '@/lib/types';

function withSessionDateQuery(path: string, sessionDate?: string): string {
  if (!sessionDate) return path;
  return `${path}?date=${encodeURIComponent(sessionDate)}`;
}

/** Marks destination as already passed playlist picker to avoid duplicate modal in /training/workout. */
export function appendMediaGateBypass(href: string): string {
  return href.includes('?') ? `${href}&media=1` : `${href}?media=1`;
}

/** Where to send the user after optional session audio (lift + cardio → workout stub; recovery → recovery log). */
export function postSessionMediaHref(session: ProgramSession, sessionDate?: string): string {
  const path = session.type === 'recovery' ? '/recovery' : '/training/workout';
  return withSessionDateQuery(path, sessionDate);
}

/** Whether today’s session type should show the optional YouTube / audio picker before navigation. */
export function sessionTypeUsesMediaGate(type: ProgramSession['type']): boolean {
  return type === 'lift' || type === 'cardio' || type === 'recovery';
}

/** Primary route when the user starts/opens a planned session from Training or Dashboard. */
export function routeForTodaySessionStart(session: ProgramSession, sessionDate?: string): string {
  switch (session.type) {
    case 'lift':
      return withSessionDateQuery('/training/workout', sessionDate);
    case 'recovery':
      return withSessionDateQuery('/recovery', sessionDate);
    case 'cardio':
    default:
      // Must not be `/training` — same-page Link appears broken. Workout page shows the plan for the given date.
      return withSessionDateQuery('/training/workout', sessionDate);
  }
}
