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
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B6B6B] mb-1">Training</p>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Train</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Session */}
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
              <Dumbbell className="text-[color:var(--accent)]" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-[#F5F5F5]">Today&apos;s Session</h2>
              {program && cycleDay && (
                <p className="text-sm text-[#6B6B6B]">Day {cycleDay} of {program.cycleLengthDays}</p>
              )}
            </div>
          </div>

          {todaySession ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-semibold text-[#F5F5F5]">{todaySession.name}</p>
                <p className="text-sm text-[#6B6B6B]">
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
              <p className="text-[#6B6B6B]">No active program. Import your plan first.</p>
              <Link href="/onboarding" className="btn-secondary flex items-center justify-center gap-2">
                Import Plan
              </Link>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="glass-panel p-5">
          <h2 className="font-semibold text-[#F5F5F5] mb-4">Quick Actions</h2>
          <div className="space-y-1">
            <Link
              href="/training/programs"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(16,22,34,0.6)] transition-colors"
            >
              <Calendar size={18} className="text-[color:var(--accent)]" />
              <span className="text-[#9A9A9A]">Programs</span>
            </Link>
            <Link
              href="/training/exercises"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(16,22,34,0.6)] transition-colors"
            >
              <Dumbbell size={18} className="text-[color:var(--accent)]" />
              <span className="text-[#9A9A9A]">Exercise Database</span>
            </Link>
            <Link
              href="/training/history"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(16,22,34,0.6)] transition-colors"
            >
              <History size={18} className="text-[color:var(--accent)]" />
              <span className="text-[#9A9A9A]">Workout History</span>
            </Link>
            <Link
              href="/training/programs"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(16,22,34,0.6)] transition-colors"
            >
              <TrendingUp size={18} className="text-[color:var(--accent)]" />
              <span className="text-[#9A9A9A]">Progress</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
