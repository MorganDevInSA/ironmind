'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, subDays } from 'date-fns';
import { useAuthStore } from '@/stores';
import {
  useActiveProgram,
  useWorkoutMediaPreference,
  useSaveWorkoutMediaPreference,
} from '@/controllers';
import {
  cn,
  getCycleDay,
  findProgramSessionForCycleDay,
  today,
  formatDisplayDate,
  formatShortDate,
  getDaysInRange,
} from '@/lib/utils';
import { Dumbbell, Calendar, TrendingUp, History, Activity } from 'lucide-react';
import Link from 'next/link';
import { appendMediaGateBypass, postSessionMediaHref } from '@/lib/program-session-routes';
import { TrainingMediaModal } from '@/components/training/training-media-modal';

export default function TrainingPage() {
  const router = useRouter();
  const [mediaOpen, setMediaOpen] = useState(false);
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const { data: program } = useActiveProgram(userId);
  const { data: savedWorkoutMediaUrl } = useWorkoutMediaPreference(userId);
  const { mutate: saveWorkoutMediaPreference } = useSaveWorkoutMediaPreference(userId);

  const todayStr = today();
  const scheduleFrom = useMemo(
    () => format(subDays(parseISO(todayStr), 13), 'yyyy-MM-dd'),
    [todayStr],
  );
  const scheduleDates = useMemo(
    () => getDaysInRange(scheduleFrom, todayStr),
    [scheduleFrom, todayStr],
  );

  const [selectedDate, setSelectedDate] = useState(todayStr);

  useEffect(() => {
    if (!scheduleDates.length) return;
    setSelectedDate((cur) => {
      if (scheduleDates.includes(cur)) return cur;
      return scheduleDates.includes(todayStr) ? todayStr : scheduleDates[scheduleDates.length - 1]!;
    });
  }, [scheduleDates, todayStr]);

  const cycleDayForSelected =
    program != null
      ? getCycleDay(program.startDate ?? todayStr, selectedDate, program.cycleLengthDays)
      : null;

  const selectedSession = findProgramSessionForCycleDay(program?.sessions, cycleDayForSelected);
  const isViewingToday = selectedDate === todayStr;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <TrainingMediaModal
        open={mediaOpen}
        sessionTitle={selectedSession?.name}
        initialLastYouTubeUrl={savedWorkoutMediaUrl}
        onClose={() => setMediaOpen(false)}
        onContinue={(result) => {
          saveWorkoutMediaPreference(result.youtubeUrl);
          setMediaOpen(false);
          if (selectedSession) {
            router.push(appendMediaGateBypass(postSessionMediaHref(selectedSession, selectedDate)));
          } else {
            router.push('/training/workout?media=1');
          }
        }}
      />
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-2)] mb-1">
          Training
        </p>
        <h1 className="text-2xl font-bold text-[color:var(--accent)]">Train</h1>
      </div>

      <div className="space-y-4">
        <div className="glass-panel p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[color-mix(in srgb,var(--accent) 10%,transparent0.1)] flex items-center justify-center">
                <Dumbbell className="text-[color:var(--accent)]" size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-[color:var(--text-0)]">
                  {isViewingToday
                    ? "Today's session"
                    : `Session · ${formatDisplayDate(selectedDate)}`}
                </h2>
                {program && cycleDayForSelected != null && (
                  <p className="text-sm text-[color:var(--text-2)]">
                    Day {cycleDayForSelected} of {program.cycleLengthDays}
                  </p>
                )}
              </div>
            </div>

            {scheduleDates.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-[color:var(--chrome-border-subtle)] pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--text-2)]">
                  Plan by day
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
                  {scheduleDates.map((dateStr) => {
                    const isSelected = dateStr === selectedDate;
                    const isCalendarToday = dateStr === todayStr;
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        className={cn(
                          'im-tooltip-trigger shrink-0 min-w-[2.75rem] px-2.5 py-2 rounded-lg text-xs font-mono tabular-nums transition-all border',
                          isSelected
                            ? 'is-selected text-[color:var(--text-0)]'
                            : 'border-[color:var(--chrome-border)] text-[color:var(--text-1)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[color:var(--text-0)]',
                        )}
                        aria-pressed={isSelected}
                        data-tooltip={
                          isCalendarToday
                            ? `Today · ${formatDisplayDate(dateStr)}`
                            : formatDisplayDate(dateStr)
                        }
                      >
                        {formatShortDate(dateStr)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {!program ? (
              <div className="space-y-3">
                <p className="text-[color:var(--text-2)]">
                  No active program. Import your plan first.
                </p>
                <Link
                  href="/onboarding"
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  Import Plan
                </Link>
              </div>
            ) : selectedSession ? (
              <div className="space-y-4">
                <div>
                  <p className="text-lg font-semibold text-[color:var(--text-0)]">
                    {selectedSession.name}
                  </p>
                  <p className="text-sm text-[color:var(--text-2)]">
                    {selectedSession.type === 'lift'
                      ? `${selectedSession.exercises?.length ?? 0} exercises`
                      : selectedSession.type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaOpen(true)}
                  className="btn-primary flex items-center justify-center gap-2 w-full"
                >
                  {selectedSession.type === 'lift' ? (
                    <>
                      <Dumbbell size={18} /> Start Workout
                    </>
                  ) : selectedSession.type === 'recovery' ? (
                    <>
                      <Activity size={18} /> Log Recovery
                    </>
                  ) : (
                    <>
                      <Dumbbell size={18} /> View Training
                    </>
                  )}
                </button>
              </div>
            ) : (
              <p className="text-[color:var(--text-2)]">
                No session is mapped for this day in your program. If this should be a training day,
                check program day numbers in Settings.
              </p>
            )}
          </div>
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
