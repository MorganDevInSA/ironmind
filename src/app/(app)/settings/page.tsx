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

const themeOptions: Array<{ value: AppTheme; label: string; description: string; swatch: string }> = [
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
      onError: (e) => toast.error(`Failed: ${e.message}`),
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
                    ? 'border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[rgba(16,16,16,0.78)]'
                    : 'border-[rgba(65,50,50,0.38)] bg-[rgba(16,16,16,0.78)] hover:border-[rgba(120,120,120,0.45)]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full border border-white/20 shrink-0"
                    style={{ background: option.swatch }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--text-0)]">{option.label}</p>
                    <p className="text-xs text-[color:var(--text-1)]">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
          <div
            className={`w-full p-3 rounded-lg border transition-colors ${
              theme === 'custom'
                ? 'border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] bg-[rgba(16,16,16,0.78)]'
                : 'border-[rgba(65,50,50,0.38)] bg-[rgba(16,16,16,0.78)]'
            }`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[color:var(--text-0)]">Custom</p>
                <p className="text-xs text-[color:var(--text-1)]">
                  Choose an accent colour — it applies across the app as you adjust.
                </p>
              </div>
              <div className="flex items-end gap-3 shrink-0">
                <label className="flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-2)]">
                  Colour
                  <input
                    type="color"
                    value={customAccent}
                    onClick={() => setTheme('custom')}
                    onFocus={() => setTheme('custom')}
                    onChange={(e) => {
                      setTheme('custom');
                      setCustomAccent(e.target.value);
                    }}
                    className="h-10 w-[4.5rem] cursor-pointer rounded-md border border-white/25 bg-[#0a0a0a] p-0.5 shadow-inner"
                    title="Accent colour"
                    aria-label="Choose custom accent colour"
                  />
                </label>
                <span className="font-mono text-xs tabular-nums text-[color:var(--text-1)] pb-1">
                  {customAccent.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center gap-3">
          <User size={20} className="text-[color:var(--text-2)]" />
          <h2 className="font-semibold text-[color:var(--text-0)]">Profile</h2>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-[color:var(--text-2)]">Email</p>
          <p className="text-[color:var(--text-0)]">{user?.email}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-[color:var(--text-2)]">Current Weight</p>
            <p className="font-mono tabular-nums text-[color:var(--text-0)]">{profile?.currentWeight ?? '—'} kg</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-[color:var(--text-2)]">Target Weight</p>
            <p className="font-mono tabular-nums text-[color:var(--text-0)]">{profile?.targetWeight ?? '—'} kg</p>
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
              onChange={e => setCurrentWeight(e.target.value)}
              placeholder={profile?.currentWeight?.toString() ?? ''}
              className="w-full bg-[rgba(18,14,14,0.6)] border border-[rgba(65,50,50,0.25)] rounded-lg p-3 text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[color:var(--text-2)]">Target (kg)</label>
            <input
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={e => setTargetWeight(e.target.value)}
              placeholder={profile?.targetWeight?.toString() ?? ''}
              className="w-full bg-[rgba(18,14,14,0.6)] border border-[rgba(65,50,50,0.25)] rounded-lg p-3 text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)]"
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
          Upload new JSON files generated by your coach AI to update your training plan, nutrition targets, or volume landmarks.
          If you already have data in IronMind, open the review step and check{' '}
          <span className="text-[color:var(--text-1)]">Replace existing IronMind data</span> before confirming import.
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
