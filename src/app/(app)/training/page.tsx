'use client';

import { useAuthStore } from '@/stores';
import { useActiveProgram } from '@/controllers';
import { getCycleDay, today } from '@/lib/utils';
import { Dumbbell, Calendar, TrendingUp, History } from 'lucide-react';
import Link from 'next/link';

export default function TrainingPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const { data: program } = useActiveProgram(userId);

  const todayStr = today();
  const cycleDay = program
    ? getCycleDay(program.startDate ?? todayStr, todayStr, program.cycleLengthDays)
    : null;

  const todaySession = program?.sessions.find(s => s.dayNumber === cycleDay);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-2)] mb-1">Training</p>
        <h1 className="text-2xl font-bold text-[color:var(--accent)]">Train</h1>
      </div>

      <div className="space-y-4">
        {/* Today's Session */}
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[color-mix(in srgb,var(--accent) 10%,transparent0.1)] flex items-center justify-center">
              <Dumbbell className="text-[color:var(--accent)]" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-[color:var(--text-0)]">Today&apos;s Session</h2>
              {program && cycleDay && (
                <p className="text-sm text-[color:var(--text-2)]">Day {cycleDay} of {program.cycleLengthDays}</p>
              )}
            </div>
          </div>

          {todaySession ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-[color:var(--text-0)]">{todaySession.name}</p>
                <p className="text-sm text-[color:var(--text-2)]">
                  {todaySession.type === 'lift'
                    ? `${todaySession.exercises?.length ?? 0} exercises`
                    : todaySession.type}
                </p>
              </div>
              <Link
                href="/training/workout"
                className="btn-primary flex items-center justify-center gap-2 w-full"
              >
                <Dumbbell size={18} /> Start Workout
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[color:var(--text-2)]">No active program. Import your plan first.</p>
              <Link href="/onboarding" className="btn-secondary flex items-center justify-center gap-2">
                Import Plan
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="glass-panel p-5">
          <h2 className="font-semibold text-[color:var(--text-0)] mb-4">Quick Actions</h2>
          <div className="space-y-1">
            <Link
              href="/training/programs"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(18,14,14,0.6)] transition-colors"
            >
              <Calendar size={18} className="text-[color:var(--accent)]" />
              <span className="text-[color:var(--text-1)]">Programs</span>
            </Link>
            <Link
              href="/training/exercises"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(18,14,14,0.6)] transition-colors"
            >
              <Dumbbell size={18} className="text-[color:var(--accent)]" />
              <span className="text-[color:var(--text-1)]">Exercise Database</span>
            </Link>
            <Link
              href="/training/history"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(18,14,14,0.6)] transition-colors"
            >
              <History size={18} className="text-[color:var(--accent)]" />
              <span className="text-[color:var(--text-1)]">Workout History</span>
            </Link>
            <Link
              href="/training/programs"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(18,14,14,0.6)] transition-colors"
            >
              <TrendingUp size={18} className="text-[color:var(--accent)]" />
              <span className="text-[color:var(--text-1)]">Progress</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
