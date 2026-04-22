'use client';

import { useAuthStore } from '@/stores';
import { useProtocol, useSupplementLog, useToggleSupplement } from '@/controllers';
import { today } from '@/lib/utils';
import { Pill, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SupplementsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';
  const todayStr = today();

  const { data: protocol } = useProtocol(userId);
  const { data: log } = useSupplementLog(userId, todayStr);
  const toggle = useToggleSupplement(userId);

  const totalSupps = protocol?.windows.reduce(
    (n, w) => n + w.supplements.length + (w.optional?.length ?? 0),
    0
  ) ?? 0;
  const takenCount = protocol?.windows.reduce((n, w) => {
    const wl = log?.windows?.[w.timing] || {};
    return n + w.supplements.filter((s) => wl[s]).length + (w.optional?.filter((s) => wl[s]).length ?? 0);
  }, 0) ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--accent)]">Supplements</h1>
          <p className="text-sm text-[color:var(--text-2)]">Track your daily supplement protocol</p>
        </div>
        <span className="text-sm font-mono tabular-nums text-[color:var(--text-2)]">
          {takenCount}/{totalSupps} taken
        </span>
      </div>

      <div className="space-y-5">
        {protocol?.windows.map((window) => (
          <WindowCard
            key={window.timing}
            window={window}
            windowLog={log?.windows?.[window.timing] || {}}
            onToggle={(supplement) =>
              toggle.mutate({ date: todayStr, window: window.timing, supplement })
            }
          />
        ))}

        {protocol?.notes && protocol.notes.length > 0 && (
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-[color:var(--accent-light)] shrink-0" />
              <h3 className="text-sm font-semibold text-[color:var(--text-0)]">Protocol Notes</h3>
            </div>
            <ul className="space-y-1.5 pl-6">
              {protocol.notes.map((note, i) => (
                <li
                  key={i}
                  className="text-xs text-[color:var(--text-1)] leading-relaxed list-disc"
                >
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Window Card ──────────────────────────────────────────────── */

interface WindowCardProps {
  window: { timing: string; time?: string; supplements: string[]; optional?: string[] };
  windowLog: Record<string, boolean>;
  onToggle: (supplement: string) => void;
}

function WindowCard({ window: w, windowLog, onToggle }: WindowCardProps) {
  const allChecked = w.supplements.every((s) => windowLog[s]);

  return (
    <div className="glass-panel overflow-hidden">
      {/* Window header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(65,50,50,0.15)]">
        <Pill
          size={18}
          className="shrink-0 text-[color:var(--accent-light)] transition-colors"
        />
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[color:var(--text-0)] capitalize">{w.timing}</h2>
          {w.time && (
            <p className="text-xs font-mono tabular-nums text-[color:var(--text-2)]">{w.time}</p>
          )}
        </div>
        {allChecked && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--accent-light)]">
            Done
          </span>
        )}
      </div>

      {/* Supplement rows */}
      <div className="divide-y divide-[rgba(65,50,50,0.1)]">
        {w.supplements.map((supplement) => {
          const isChecked = windowLog[supplement] || false;
          return (
            <button
              key={supplement}
              type="button"
              onClick={() => onToggle(supplement)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 text-left transition-all',
                isChecked
                  ? ''
                  : 'hover:bg-[rgba(22,16,16,0.55)]'
              )}
            >
              <span
                className={cn(
                  'text-sm transition-colors',
                  isChecked ? 'text-[color:var(--accent-light)]' : 'text-[color:var(--text-0)]'
                )}
              >
                {supplement}
              </span>
              <div
                className={cn(
                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                  isChecked
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]'
                    : 'border-[color:var(--chrome-border)]'
                )}
              >
                {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}

        {w.optional?.map((supplement) => {
          const isChecked = windowLog[supplement] || false;
          return (
            <button
              key={supplement}
              type="button"
              onClick={() => onToggle(supplement)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 text-left transition-all',
                isChecked
                  ? ''
                  : 'hover:bg-[rgba(22,16,16,0.55)]'
              )}
            >
              <span className="text-sm text-[color:var(--text-1)]">
                {supplement}
                <span className="text-[10px] text-[color:var(--text-2)] ml-1.5">(optional)</span>
              </span>
              <div
                className={cn(
                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                  isChecked
                    ? 'border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_70%,transparent)]'
                    : 'border-[color:var(--chrome-border-subtle)]'
                )}
              >
                {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
