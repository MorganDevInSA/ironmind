'use client';

import { useMemo } from 'react';
import { ArrowLeft, ArrowRight, Palette } from 'lucide-react';
import { useUIStore } from '@/stores';
import type { AppTheme } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

interface StepThemeProps {
  onNext: () => void;
  onBack: () => void;
}

const presetOptions: Array<{
  value: Exclude<AppTheme, 'custom'>;
  label: string;
  description: string;
  swatch: string;
}> = [
  {
    value: 'crimson',
    label: 'Crimson',
    description: 'Original IRONMIND red performance theme.',
    swatch: 'linear-gradient(135deg, #DC2626, #991B1B)',
  },
  {
    value: 'hot-pink',
    label: 'Hot Pink',
    description: 'High-energy variant with pink accent highlights.',
    swatch: 'linear-gradient(135deg, #FF3EA5, #C21877)',
  },
];

export function StepTheme({ onNext, onBack }: StepThemeProps) {
  const theme = useUIStore((s) => s.theme);
  const customAccent = useUIStore((s) => s.customAccent);
  const setTheme = useUIStore((s) => s.setTheme);
  const setCustomAccent = useUIStore((s) => s.setCustomAccent);

  const customHex = useMemo(() => customAccent.toUpperCase(), [customAccent]);

  return (
    <div className="flex flex-col gap-7 py-4">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">
          Step 1 of 6
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-heading tracking-tight text-[#F0F0F0]">
          Choose Your Theme
        </h2>
        <p className="mt-2 text-sm text-[#9A9A9A]">
          Pick your visual mode before onboarding. Your choice updates highlights, glows, and key
          accents across the app in real time.
        </p>
      </div>

      <div className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)] shadow-[0_10px_24px_rgba(0,0,0,0.45)] space-y-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#5E5E5E]">
          <Palette size={13} className="text-[color:var(--accent)]" />
          Theme Presets
        </div>
        {presetOptions.map((option) => {
          const active = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                'w-full rounded-lg border p-3 text-left transition-all',
                active
                  ? 'is-selected'
                  : 'border-[rgba(65,50,50,0.38)] bg-[rgba(16,16,16,0.78)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]'
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-white/20"
                  style={{ background: option.swatch }}
                />
                <div>
                  <p className="text-sm font-semibold text-[#F5F5F5]">{option.label}</p>
                  <p className="text-xs text-[#9A9A9A]">{option.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)] shadow-[0_10px_24px_rgba(0,0,0,0.45)] space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#F5F5F5]">Custom Accent</p>
            <p className="text-xs text-[#9A9A9A]">
              Set any accent color and IRONMIND will generate the matching glow and border tones.
            </p>
          </div>
          <span className="font-mono text-xs tabular-nums text-[#9A9A9A]">{customHex}</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={customAccent}
            onChange={(e) => {
              setTheme('custom');
              setCustomAccent(e.target.value);
            }}
            onFocus={() => setTheme('custom')}
            className="h-10 w-20 cursor-pointer rounded-md border border-white/25 bg-[#0a0a0a] p-0.5"
            title="Accent colour"
            aria-label="Choose custom accent colour"
          />
          <button
            type="button"
            onClick={() => setTheme('custom')}
            className={cn(
              'rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors',
              theme === 'custom'
                ? 'is-selected text-[color:var(--accent-light)]'
                : 'border-[rgba(65,50,50,0.38)] text-[#9A9A9A] hover:text-[#F0F0F0]'
            )}
          >
            Use Custom
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[#9A9A9A]
            bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
            hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[#F0F0F0]
            active:scale-95 transition-all duration-200"
        >
          <ArrowLeft size={15} />
          Back
        </button>

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-white
            bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
            shadow-[0_8px_20px_rgba(220,38,38,0.22)]
            hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          Continue
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
