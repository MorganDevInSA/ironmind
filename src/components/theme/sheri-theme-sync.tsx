'use client';

import { useEffect } from 'react';
import { useAuthStore, useUIStore } from '@/stores';
import { useProfile } from '@/controllers';

/** When the Sheri demo profile is active, use the Hot Pink theme preset. */
export function SheriThemeSync() {
  const userId = useAuthStore((s) => s.user?.uid) ?? '';
  const { data: profile } = useProfile(userId);
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    if (profile?.clientName === 'Sheri') {
      setTheme('hot-pink');
    }
  }, [profile?.clientName, setTheme]);

  return null;
}
