'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useUIStore } from '@/stores';
import { useProfile, useUpdateProfile } from '@/controllers';
import { logout } from '@/lib/firebase';
import { Settings, Upload, User, LogOut, Target, Palette } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { AppTheme } from '@/stores/ui-store';

const themeOptions: Array<{ value: AppTheme; label: string; description: string; swatch: string }> =
  [
    {
      value: 'crimson',
      label: 'Crimson (Default)',
      description: 'Original IRONMIND red treatment.',
      /* Fixed colours — do not use var(--accent); custom theme overrides those on :root */
      swatch: 'linear-gradient(135deg, #DC2626, #991B1B)',
    },
    {
      value: 'hot-pink',
      label: 'Hot Pink',
      description: 'Swap red accents for high-energy hot pink.',
      swatch: 'linear-gradient(135deg, #FF3EA5, #C21877)',
    },
    {
      value: 'cobalt',
      label: 'Cobalt',
      description: 'Cold steel blue for precision-focused training blocks.',
      swatch: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
    },
    {
      value: 'forge',
      label: 'Forge',
      description: 'Molten orange tone with an aggressive high-contrast edge.',
      swatch: 'linear-gradient(135deg, #EA580C, #9A3412)',
    },
    {
      value: 'emerald',
      label: 'Emerald',
      description: 'Controlled green variant tuned for consistency and recovery focus.',
      swatch: 'linear-gradient(135deg, #16A34A, #166534)',
    },
    {
      value: 'violet',
      label: 'Violet',
      description: 'Deep violet command mode with premium contrast and glow.',
      swatch: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
    },
  ];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { theme, setTheme, customAccent, setCustomAccent, resetUIPreferences } = useUIStore();
  const userId = user?.uid ?? '';

  const { data: profile } = useProfile(userId);
  const { mutate: updateProfile, isPending } = useUpdateProfile(userId);

  const [targetWeight, setTargetWeight] = useState('');
  const [currentWeight, setCurrentWeight] = useState('');
  const athleteName =
    profile?.clientName?.trim() ||
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    'Athlete';

  const handleSaveWeights = () => {
    const updates: Record<string, number> = {};
    if (targetWeight) updates.targetWeight = parseFloat(targetWeight);
    if (currentWeight) updates.currentWeight = parseFloat(currentWeight);
    if (Object.keys(updates).length === 0) return;

    updateProfile(updates, {
      onSuccess: () => {
        toast.success('Profile updated.');
        setTargetWeight('');
        setCurrentWeight('');
      },
      onError: (e: unknown) => toast.error(`Failed: ${e instanceof Error ? e.message : String(e)}`),
    });
  };

  const handleLogout = async () => {
    queryClient.clear();
    resetUIPreferences();
    await logout();
    router.push('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--accent)]">Settings</h1>
        <p className="text-[color:var(--text-2)]">Manage your profile and plan</p>
      </div>

      {/* Theme */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Palette size={20} className="text-[color:var(--accent)]" />
          <h2 className="font-semibold text-[color:var(--text-0)]">Theme</h2>
        </div>
        <p className="text-sm text-[color:var(--text-2)]">
          Choose your accent palette. This updates buttons, highlights, and key UI accents.
        </p>
        <div className="space-y-2">
          {themeOptions.map((option) => {
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  active
                    ? 'border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color:var(--surface-track)]'
                    : 'border-[color:var(--chrome-border)] bg-[color:var(--surface-track)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                    style={{ background: option.swatch }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text-0)]">
                      {option.label}
                    </p>
                    <p className="text-xs text-[color:var(--text-1)]">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setTheme('custom')}
            className={`w-full p-3 rounded-lg border text-left transition-colors ${
              theme === 'custom'
                ? 'border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[color:var(--surface-track)]'
                : 'border-[color:var(--chrome-border)] bg-[color:var(--surface-track)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]'
            }`}
            aria-pressed={theme === 'custom'}
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative inline-flex h-5 w-5 shrink-0">
                <span
                  className="h-5 w-5 rounded-full border border-white/20 shadow-[0_0_0_1px_rgba(0,0,0,0.4)_inset]"
                  style={{ background: customAccent }}
                  aria-hidden
                />
                <input
                  type="color"
                  value={customAccent}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTheme('custom');
                  }}
                  onFocus={() => setTheme('custom')}
                  onChange={(e) => {
                    setTheme('custom');
                    setCustomAccent(e.target.value);
                  }}
                  className="absolute inset-0 h-5 w-5 cursor-pointer rounded-full opacity-0"
                  aria-label="Choose custom accent colour"
                />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[color:var(--text-0)]">Custom</p>
                <p className="text-xs text-[color:var(--text-1)]">
                  Choose an accent colour — it applies across the app as you adjust.
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Profile */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-3">
          <User size={20} className="text-[color:var(--text-2)]" />
          <h2 className="font-semibold text-[color:var(--text-0)]">Profile</h2>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-[color:var(--text-2)]">Name</p>
          <p className="text-[color:var(--text-0)]">{athleteName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-[color:var(--text-2)]">Current Weight</p>
            <p className="font-mono tabular-nums text-[color:var(--text-0)]">
              {profile?.currentWeight ?? '—'} kg
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[color:var(--text-2)]">Target Weight</p>
            <p className="font-mono tabular-nums text-[color:var(--text-0)]">
              {profile?.targetWeight ?? '—'} kg
            </p>
          </div>
        </div>
      </div>

      {/* Update weights */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Target size={20} className="text-[color:var(--accent)]" />
          <h2 className="font-semibold text-[color:var(--text-0)]">Update Weights</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-[color:var(--text-2)]">Current (kg)</label>
            <input
              type="number"
              step="0.1"
              value={currentWeight}
              onChange={(e) => setCurrentWeight(e.target.value)}
              placeholder={profile?.currentWeight?.toString() ?? ''}
              className="w-full bg-[color:var(--surface-track)] border border-[color:var(--chrome-border-subtle)] rounded-lg p-3 text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[color:var(--text-2)]">Target (kg)</label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder={profile?.targetWeight?.toString() ?? ''}
              className="w-full bg-[color:var(--surface-track)] border border-[color:var(--chrome-border-subtle)] rounded-lg p-3 text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)]"
            />
          </div>
        </div>

        <button
          onClick={handleSaveWeights}
          disabled={isPending || (!targetWeight && !currentWeight)}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Re-import plan */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Upload size={20} className="text-[color:var(--accent)]" />
          <h2 className="font-semibold text-[color:var(--text-0)]">Re-import Plan</h2>
        </div>
        <p className="text-sm text-[color:var(--text-2)]">
          Upload new JSON files generated by your coach AI to update your training plan, nutrition
          targets, or volume landmarks. If you already have data in IronMind, open the review step
          and check{' '}
          <span className="text-[color:var(--text-1)]">Replace existing IronMind data</span> before
          confirming import.
        </p>
        <button
          onClick={() => router.push('/onboarding')}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Upload size={16} /> Import Coach Files
        </button>
      </div>

      {/* Sign out */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-3 mb-4">
          <Settings size={20} className="text-[color:var(--text-2)]" />
          <h2 className="font-semibold text-[color:var(--text-0)]">Account</h2>
        </div>
        <button
          onClick={handleLogout}
          className="w-full py-2.5 bg-[rgba(16,16,16,0.78)] border border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)] text-[color:var(--accent-light)] font-medium rounded-lg hover:border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
}
