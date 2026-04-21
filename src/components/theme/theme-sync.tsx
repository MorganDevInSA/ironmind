'use client';

import { useEffect } from 'react';
import tinycolor from 'tinycolor2';
import { useUIStore } from '@/stores';

/** Legacy persisted value before `custom` + colour picker */
const LEGACY_CHLORINE = 'chlorine-blue';

const INLINE_THEME_VARS = [
  '--accent',
  '--accent-2',
  '--accent-light',
  '--crimson',
  '--crimson-light',
  '--crimson-dark',
  '--gold',
  '--gold-light',
  '--gold-dark',
  '--shadow-accent',
  '--dashboard-overview-border',
  '--body-glow-1',
  '--body-glow-2',
  '--body-glow-3',
] as const;

export function ThemeSync() {
  const theme = useUIStore((state) => state.theme);
  const customAccent = useUIStore((state) => state.customAccent);
  const setTheme = useUIStore((state) => state.setTheme);
  const setCustomAccent = useUIStore((state) => state.setCustomAccent);

  useEffect(() => {
    const state = useUIStore.getState();
    const raw = state.theme as string;

    if (raw === LEGACY_CHLORINE) {
      setTheme('custom');
      setCustomAccent(state.customAccent || '#DC2626');
      return;
    }

    const root = document.documentElement;

    if (theme === 'custom') {
      const base = tinycolor(customAccent);
      if (!base.isValid()) {
        root.setAttribute('data-theme', 'custom');
        return;
      }
      const dark = base.clone().darken(25).toHexString();
      const light = base.clone().lighten(15).toHexString();
      const { r, g, b } = base.toRgb();

      root.setAttribute('data-theme', 'custom');
      root.style.setProperty('--accent', customAccent);
      root.style.setProperty('--accent-2', dark);
      root.style.setProperty('--accent-light', light);
      root.style.setProperty('--crimson', customAccent);
      root.style.setProperty('--crimson-light', light);
      root.style.setProperty('--crimson-dark', dark);
      root.style.setProperty('--gold', customAccent);
      root.style.setProperty('--gold-light', light);
      root.style.setProperty('--gold-dark', dark);
      root.style.setProperty('--shadow-accent', `0 8px 32px rgba(${r},${g},${b},0.20)`);
      root.style.setProperty('--dashboard-overview-border', `rgba(${r},${g},${b},0.26)`);
      root.style.setProperty('--body-glow-1', `rgba(${r},${g},${b},0.06)`);
      root.style.setProperty('--body-glow-2', `rgba(${r},${g},${b},0.04)`);
      root.style.setProperty('--body-glow-3', `rgba(${r},${g},${b},0.03)`);
    } else {
      INLINE_THEME_VARS.forEach((v) => root.style.removeProperty(v));
      root.setAttribute('data-theme', theme);
    }
  }, [theme, customAccent, setTheme, setCustomAccent]);

  return null;
}
