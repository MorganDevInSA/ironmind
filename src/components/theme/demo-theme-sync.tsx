'use client';

import { useEffect } from 'react';
import { useAuthStore, useUIStore } from '@/stores';
import { useProfile } from '@/controllers';
import { getDemoThemeForClientName } from '@/lib/seed';

/**
 * When the active profile is a seeded demo athlete, apply the curated accent preset.
 * Keeps theme aligned with demo data if the user navigates away and returns.
 */
export function DemoThemeSync() {
  const userId = useAuthStore((s) => s.user?.uid) ?? '';
  const { data: profile } = useProfile(userId);
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    const theme = getDemoThemeForClientName(profile?.clientName);
    if (theme) setTheme(theme);
  }, [profile?.clientName, setTheme]);

  return null;
}
