'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores';

export function ThemeSync() {
  const theme = useUIStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return null;
}
