'use client';

import { useRef, useState } from 'react';
import type { Program } from '@/lib/types';
import { PEEK_CAPTION_PANEL_SKIN } from '@/lib/constants/peek-caption';
import {
  cn,
  findProgramSessionForCycleDay,
  formatDisplayDate,
  formatShortDate,
  getCycleDay,
} from '@/lib/utils';

/** Alias of `PEEK_CAPTION_PANEL_SKIN` — same peek shell as collapsed sidebar rail. */
export const PLAN_DAY_PEEK_SKIN = PEEK_CAPTION_PANEL_SKIN;

export type PlanByDayStripProps = {
  dates: string[];
  selectedDate: string;
  todayStr: string;
  program: Program | null;
  onSelect: (date: string) => void;
  /** Label above the strip (e.g. "Days in range", "Plan by day"). */
  sectionLabel?: string;
};

/**
 * Equal-width day pills with cycle-day labels when a program exists. Hover/focus shows the shared
 * caption peek (`PEEK_CAPTION_PANEL_SKIN` + `.plan-day-strip-peek-panel`): date title + hint line.
 */
export function PlanByDayStrip({
  dates,
  selectedDate,
  todayStr,
  program,
  onSelect,
  sectionLabel = 'Days in range',
}: PlanByDayStripProps) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const peekDate = hoverDate;

  const cycleAnchor = program ? (program.startDate ?? todayStr) : null;
  const cycleLength = program?.cycleLengthDays ?? null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--text-2)]">
        {sectionLabel}
      </p>
      <div ref={stripRef} className="grid w-full min-w-0 grid-cols-7 gap-1">
        {dates.map((dateStr) => {
          const isSelected = dateStr === selectedDate;
          const isCalendarToday = dateStr === todayStr;
          const cycleDay =
            cycleAnchor != null && cycleLength != null
              ? getCycleDay(cycleAnchor, dateStr, cycleLength)
              : null;
          const buttonLabel = cycleDay != null ? String(cycleDay) : formatShortDate(dateStr);
          const sessForDate =
            program && cycleDay != null
              ? findProgramSessionForCycleDay(program.sessions, cycleDay)
              : undefined;
          const planKindLine =
            program == null || cycleDay == null
              ? null
              : sessForDate == null
                ? 'Item type · Rest day'
                : sessForDate.type === 'lift'
                  ? 'Item type · Strength'
                  : sessForDate.type === 'cardio'
                    ? 'Item type · Cardio / conditioning'
                    : 'Item type · Recovery';
          const peekHintParts: string[] = [];
          if (cycleDay != null && cycleLength != null) {
            peekHintParts.push(`Cycle day ${cycleDay} of ${cycleLength}`);
          }
          if (program != null && cycleDay != null) {
            if (sessForDate == null) peekHintParts.push('Rest day');
            else if (sessForDate.type === 'lift') peekHintParts.push('Strength');
            else if (sessForDate.type === 'cardio') peekHintParts.push('Cardio / conditioning');
            else peekHintParts.push('Recovery');
          }
          if (isCalendarToday) peekHintParts.push('Today');
          const peekHint =
            peekHintParts.length > 0
              ? peekHintParts.join(' · ')
              : isCalendarToday
                ? 'Today in your trend window.'
                : 'Trend window day.';
          const ariaLabel =
            cycleDay != null
              ? `Cycle day ${cycleDay}, ${formatDisplayDate(dateStr)}${isCalendarToday ? ', Today' : ''}${planKindLine ? `, ${planKindLine}` : ''}`
              : `${formatDisplayDate(dateStr)}${isCalendarToday ? ', Today' : ''}`;

          return (
            <div
              key={dateStr}
              className="relative min-w-0"
              onMouseEnter={() => setHoverDate(dateStr)}
              onMouseLeave={(e) => {
                const rel = e.relatedTarget as Node | null;
                if (!e.currentTarget.contains(rel)) setHoverDate(null);
              }}
            >
              <button
                type="button"
                data-day-strip-tab
                data-date={dateStr}
                onClick={() => onSelect(dateStr)}
                className={cn(
                  'relative z-10 w-full px-1 py-2 rounded-lg text-xs font-semibold tabular-nums text-center transition-all border truncate sm:px-2',
                  isSelected
                    ? 'is-selected text-[color:var(--text-0)]'
                    : 'border-[color:var(--chrome-border)] text-[color:var(--text-1)] hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[color:var(--text-0)]',
                )}
                aria-pressed={isSelected}
                aria-label={ariaLabel}
              >
                {buttonLabel}
              </button>
              {peekDate === dateStr ? (
                <div
                  aria-hidden
                  className={cn(
                    PLAN_DAY_PEEK_SKIN,
                    'plan-day-strip-peek-panel',
                    'pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-1/2 z-[80] -translate-x-1/2 text-center',
                  )}
                >
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
                    {formatDisplayDate(dateStr)}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-[color:var(--text-detail)] break-words">
                    {peekHint}
                  </span>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
