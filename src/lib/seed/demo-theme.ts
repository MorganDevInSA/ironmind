import type { AppTheme } from '@/stores/ui-store';

/** Demo profile picker `id` → accent preset (IRONMIND curated). */
export const DEMO_THEME_BY_PROFILE_ID: Record<string, AppTheme> = {
  morton: 'crimson',
  sheri: 'hot-pink',
  alex: 'emerald',
  jordan: 'forge',
  fez: 'cobalt',
  maria: 'violet',
};

const DEMO_THEME_BY_CLIENT_NAME_LOWER: Record<string, AppTheme> = {
  morton: 'crimson',
  sheri: 'hot-pink',
  alex: 'emerald',
  jordan: 'forge',
  fez: 'cobalt',
  maria: 'violet',
};

/** Theme for a seeded demo athlete (`clientName` matches profile seed). */
export function getDemoThemeForClientName(clientName: string | undefined): AppTheme | null {
  if (!clientName?.trim()) return null;
  return DEMO_THEME_BY_CLIENT_NAME_LOWER[clientName.trim().toLowerCase()] ?? null;
}

export function getDemoThemeForProfileId(profileId: string | undefined): AppTheme | null {
  if (!profileId) return null;
  return DEMO_THEME_BY_PROFILE_ID[profileId] ?? null;
}
