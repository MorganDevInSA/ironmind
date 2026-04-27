'use client';

import { useEffect, useState } from 'react';
import { useUpdateProgram } from '@/controllers';
import type { Program } from '@/lib/types';
import { formatDisplayDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type ProgramCycleStartControlProps = {
  userId: string;
  program: Program | null | undefined;
  todayStr: string;
  /** First day of the dashboard trend range — offers one-click copy into the draft. */
  rangeFirstDay?: string;
  className?: string;
};

/**
 * Persists `Program.startDate`: calendar day that maps to cycle day 1 (start of week 1 in the rotating block).
 */
export function ProgramCycleStartControl({
  userId,
  program,
  todayStr,
  rangeFirstDay,
  className,
}: ProgramCycleStartControlProps) {
  const { mutate, isPending } = useUpdateProgram(userId);
  const [draft, setDraft] = useState(todayStr);
  const [localError, setLocalError] = useState('');

  const saved = program?.startDate ?? todayStr;

  useEffect(() => {
    setDraft(saved);
  }, [saved, program?.id]);

  if (!program) {
    return (
      <div
        className={cn(
          'rounded-lg border border-[color:var(--chrome-border-subtle)] px-3 py-2 text-xs text-[color:var(--text-2)]',
          className,
        )}
      >
        No active program — import a plan to set cycle week 1.
      </div>
    );
  }

  const dirty = draft !== saved;

  const inputClass =
    'rounded-lg px-2.5 py-1.5 text-xs font-mono tabular-nums min-w-0 ' +
    'bg-[color:var(--bg-2)] border border-[color:var(--panel-border)] text-[color:var(--text-0)] ' +
    'focus:border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] ' +
    'focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_10%,transparent)] focus:outline-none ' +
    'transition-all duration-200 [color-scheme:dark]';

  return (
    <div
      className={cn(
        'rounded-lg border border-[color:var(--chrome-border-subtle)] bg-[color:color-mix(in_srgb,var(--bg-2)_40%,transparent)] px-3 py-2.5 space-y-2',
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
            Week 1 start
          </p>
          <p className="text-[10px] text-[color:var(--text-2)] leading-snug mt-0.5 max-w-prose">
            The calendar date that is{' '}
            <span className="text-[color:var(--text-1)]">cycle day 1</span> in your program (
            {program.cycleLengthDays}-day rotation). Planned sessions on the strip use this anchor.
          </p>
        </div>
        <p className="text-[10px] font-mono tabular-nums text-[color:var(--text-detail)] shrink-0">
          Saved: {formatDisplayDate(saved)}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <label
            htmlFor="cycle-start-date"
            className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--text-2)]"
          >
            Start date
          </label>
          <input
            id="cycle-start-date"
            type="date"
            value={draft}
            onChange={(e) => {
              setLocalError('');
              setDraft(e.target.value);
            }}
            className={inputClass}
            disabled={isPending}
          />
        </div>
        <button
          type="button"
          disabled={isPending || !dirty}
          onClick={() => {
            setLocalError('');
            if (!draft) {
              setLocalError('Pick a date.');
              return;
            }
            mutate({ programId: program.id, updates: { startDate: draft } });
          }}
          className="btn-secondary text-xs px-3 py-2 shrink-0 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Save'}
        </button>
        {rangeFirstDay ? (
          <button
            type="button"
            disabled={isPending || rangeFirstDay === draft}
            onClick={() => {
              setLocalError('');
              setDraft(rangeFirstDay);
            }}
            className="btn-secondary text-xs px-3 py-2 shrink-0 border-dashed disabled:opacity-50"
          >
            Use trend range start
          </button>
        ) : null}
      </div>

      {localError ? (
        <p className="text-xs text-[color:var(--warn)]" role="alert">
          {localError}
        </p>
      ) : null}
    </div>
  );
}
