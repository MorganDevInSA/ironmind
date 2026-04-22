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
  '--text-1',
  '--text-2',
  '--text-detail',
  '--shadow-accent',
  '--shadow-gold',
  '--exercise-index-border',
  '--chrome-border',
  '--chrome-border-subtle',
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
      const lr = base.clone().lighten(15).toRgb();
      const t1R = Math.round(lr.r * 0.55 + 154 * 0.45);
      const t1G = Math.round(lr.g * 0.55 + 128 * 0.45);
      const t1B = Math.round(lr.b * 0.55 + 128 * 0.45);
      const t2R = Math.round(lr.r * 0.45 + 94 * 0.55);
      const t2G = Math.round(lr.g * 0.45 + 84 * 0.55);
      const t2B = Math.round(lr.b * 0.45 + 84 * 0.55);
      root.style.setProperty('--text-1', `rgb(${t1R},${t1G},${t1B})`);
      root.style.setProperty('--text-2', `rgb(${t2R},${t2G},${t2B})`);
      const dR = Math.round(lr.r * 0.45 + 216 * 0.55);
      const dG = Math.round(lr.g * 0.40 + 152 * 0.60);
      const dB = Math.round(lr.b * 0.40 + 152 * 0.60);
      root.style.setProperty('--text-detail', `rgb(${dR},${dG},${dB})`);
      root.style.setProperty('--shadow-accent', `0 8px 32px rgba(${r},${g},${b},0.20)`);
      root.style.setProperty('--shadow-gold', `0 8px 32px rgba(${r},${g},${b},0.20)`);
      root.style.setProperty('--exercise-index-border', `rgba(${r},${g},${b},0.42)`);
      const warmR = Math.round(r * 0.3 + 65 * 0.7);
      const warmG = Math.round(g * 0.25 + 50 * 0.75);
      const warmB = Math.round(b * 0.25 + 50 * 0.75);
      root.style.setProperty('--chrome-border', `rgba(${warmR},${warmG},${warmB},0.38)`);
      root.style.setProperty('--chrome-border-subtle', `rgba(${Math.round(warmR*0.65)},${Math.round(warmG*0.72)},${Math.round(warmB*0.72)},0.72)`);
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
