const SESSION_KEY = 'ironmind:applyDashboardTrend28d';

/** Call after demo seed succeeds so the next dashboard visit opens a 4-week trend window. */
export function markDashboardTrendWindowFourWeeksAfterDemo(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* private mode / quota */
  }
}

/** Returns true once if a demo load requested the 4-week preset; clears the flag. */
export function consumeDashboardTrendWindowFourWeeksBootstrap(): boolean {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      sessionStorage.removeItem(SESSION_KEY);
      return true;
    }
  } catch {
    /* noop */
  }
  return false;
}
