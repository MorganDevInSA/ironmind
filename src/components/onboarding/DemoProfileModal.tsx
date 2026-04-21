'use client';

import { useState } from 'react';
import { X, Zap, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
import { seedMortonData, seedSheriData, seedAlexData, seedJordanData } from '@/lib/seed';

// ─── demo profiles ────────────────────────────────────────────────────────────

interface DemoProfile {
  id: string;
  name: string;
  age: number;
  sex: 'Male' | 'Female';
  level: string;
  goal: string;
  description: string;
  tag: string;
  tagColor: string;
}

const DEMO_PROFILES: DemoProfile[] = [
  {
    id: 'morton',
    name: 'Morton',
    age: 46,
    sex: 'Male',
    level: 'Advanced',
    goal: 'Off-season muscle gain',
    description: '14-day rotating split, pelvic-safe core, high-calorie rebuild phase targeting 80 → 85 kg.',
    tag: 'Masters athlete',
    tagColor: 'text-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)]',
  },
  {
    id: 'sheri',
    name: 'Sheri',
    age: 45,
    sex: 'Female',
    level: 'Beginner',
    goal: 'Fat loss — 95 kg → 83 kg',
    description: '7-day full-body rotation (3 lift / 3 cardio / 1 recovery), 1600–1900 kcal cut, simple repeatable meals.',
    tag: 'Foundation cut',
    tagColor: 'text-[#F59E0B] bg-[rgba(245,158,11,0.12)] border-[rgba(245,158,11,0.35)]',
  },
  {
    id: 'alex',
    name: 'Alex',
    age: 28,
    sex: 'Male',
    level: 'Intermediate',
    goal: 'Strength & size',
    description: '4-day upper/lower split, evidence-based hypertrophy programming, moderate caloric surplus.',
    tag: 'Hypertrophy',
    tagColor: 'text-[#22C55E] bg-[rgba(34,197,94,0.12)] border-[rgba(34,197,94,0.35)]',
  },
  {
    id: 'jordan',
    name: 'Jordan',
    age: 33,
    sex: 'Female',
    level: 'Beginner',
    goal: 'General fitness',
    description: '3-day full-body with progressive loading, balanced nutrition, and habit-building focus.',
    tag: 'Beginner friendly',
    tagColor: 'text-[#60A5FA] bg-[rgba(96,165,250,0.12)] border-[rgba(96,165,250,0.35)]',
  },
];

interface DemoProfileModalProps {
  open: boolean;
  onClose: () => void;
  /** If true, shows an overwrite warning (user already has data) */
  alreadySeeded?: boolean;
}

export function DemoProfileModal({ open, onClose, alreadySeeded = false }: DemoProfileModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  async function handleLoad() {
    if (!selected || !user?.uid) return;
    setLoading(true);
    setError('');
    try {
      if (selected === 'sheri') {
        await seedSheriData(user.uid);
      } else if (selected === 'alex') {
        await seedAlexData(user.uid);
      } else if (selected === 'jordan') {
        await seedJordanData(user.uid);
      } else {
        await seedMortonData(user.uid);
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.nutrition.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.coaching.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.training.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.supplements.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.volume.all });
      setDone(true);
      setTimeout(() => {
        onClose();
        router.push('/dashboard');
        router.refresh();
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load demo data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.75)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-[16px] flex flex-col
        bg-[rgba(14,10,10,0.98)] border border-[rgba(65,50,50,0.50)]
        shadow-[0_24px_60px_rgba(0,0,0,0.80)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgba(65,50,50,0.35)]">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-[#F59E0B]" />
            <div>
              <h2 className="text-base font-bold text-[#F0F0F0]">Choose a Demo Profile</h2>
              <p className="text-xs text-[#5E5E5E] mt-0.5">
                Loads a pre-built plan so you can explore every feature
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full
              text-[#5E5E5E] hover:text-[#F0F0F0] hover:bg-[rgba(65,50,50,0.40)]
              transition-all duration-200"
          >
            <X size={15} />
          </button>
        </div>

        {/* Profile grid */}
        <div className="p-5 flex flex-col gap-3 overflow-y-auto max-h-[60vh]">
          {alreadySeeded && (
            <div className="p-3 rounded-lg text-xs border border-[rgba(245,158,11,0.30)] bg-[rgba(245,158,11,0.06)] text-[#F59E0B]">
              <strong>Note:</strong> You already have data loaded. Selecting a demo profile will replace it.
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg text-xs border border-[rgba(239,68,68,0.30)] bg-[rgba(239,68,68,0.06)] text-[color:var(--accent-light)]">
              {error}
            </div>
          )}

          {DEMO_PROFILES.map(profile => (
            <button
              key={profile.id}
              onClick={() => setSelected(profile.id)}
              className={`w-full text-left p-4 rounded-[12px] border transition-all duration-200
                ${selected === profile.id
                  ? 'border-[rgba(220,38,38,0.50)] bg-[rgba(220,38,38,0.07)] shadow-[0_0_20px_rgba(220,38,38,0.12)]'
                  : 'border-[rgba(65,50,50,0.40)] bg-[rgba(18,14,14,0.60)] hover:border-[rgba(65,50,50,0.70)] hover:bg-[rgba(22,16,16,0.80)]'
                }`}
            >
              <div className="flex items-start gap-3">
                {/* Selection indicator */}
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200
                  ${selected === profile.id
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]'
                    : 'border-[rgba(65,50,50,0.60)] bg-transparent'}`}>
                  {selected === profile.id && <Check size={10} className="text-white" strokeWidth={3} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-bold text-[#F0F0F0] text-sm">{profile.name}</span>
                    <span className="text-xs text-[#5E5E5E]">
                      {profile.age} · {profile.sex} · {profile.level}
                    </span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${profile.tagColor}`}>
                      {profile.tag}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[color:var(--accent)] mb-1">{profile.goal}</p>
                  <p className="text-xs text-[#5E5E5E] leading-relaxed">{profile.description}</p>
                </div>
              </div>
            </button>
          ))}

          <p className="text-[10px] text-[#3A3A3A] text-center pt-1">
            Replace demo data at any time via Settings → Import Coach Data
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex items-center gap-3 border-t border-[rgba(65,50,50,0.25)]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-[#9A9A9A]
              bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
              hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[#F0F0F0]
              active:scale-95 transition-all duration-200"
          >
            Cancel
          </button>

          <button
            onClick={handleLoad}
            disabled={!selected || loading || done}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm text-white
              bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
              shadow-[0_8px_20px_rgba(220,38,38,0.22)]
              hover:brightness-110 active:scale-95 transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {done ? (
              <><Check size={15} /> Loaded!</>
            ) : loading ? (
              <><Loader2 size={15} className="animate-spin" /> Loading…</>
            ) : (
              <><Zap size={15} /> Load Demo Data</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
