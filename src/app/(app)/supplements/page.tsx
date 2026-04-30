'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores';
import { useProtocol, useSupplementLog, useToggleSupplement } from '@/controllers';
import { today } from '@/lib/utils';
import { Pill, Check, Info, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SupplementsPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';
  const todayStr = today();

  const { data: protocol } = useProtocol(userId);
  const { data: log } = useSupplementLog(userId, todayStr);
  const toggle = useToggleSupplement(userId);
  const [customModal, setCustomModal] = useState<{
    open: boolean;
    window: string | null;
    value: string;
  }>({
    open: false,
    window: null,
    value: '',
  });

  const totalSupps =
    protocol?.windows.reduce((n, w) => n + w.supplements.length + (w.optional?.length ?? 0), 0) ??
    0;
  const takenCount =
    protocol?.windows.reduce((n, w) => {
      const wl = log?.windows?.[w.timing] || {};
      return (
        n +
        w.supplements.filter((s) => wl[s]).length +
        (w.optional?.filter((s) => wl[s]).length ?? 0)
      );
    }, 0) ?? 0;

  const openCustomModal = (window: string) => {
    setCustomModal({ open: true, window, value: '' });
  };

  const closeCustomModal = () => {
    setCustomModal({ open: false, window: null, value: '' });
  };

  const saveCustomSupplement = () => {
    const window = customModal.window;
    const normalized = customModal.value.trim().replace(/\s+/g, ' ');
    if (!window || !normalized) return;
    toggle.mutate(
      { date: todayStr, window, supplement: normalized },
      {
        onSuccess: () => closeCustomModal(),
      },
    );
  };

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
            onAddCustom={() => openCustomModal(window.timing)}
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

      {customModal.open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close custom supplement modal"
            onClick={closeCustomModal}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md glass-panel-strong p-4 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
                Custom vitamin
              </p>
              <h3 className="text-base font-semibold text-[color:var(--text-0)]">
                Add custom vitamin for today
              </h3>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="custom-supplement-input"
                className="text-xs text-[color:var(--text-2)]"
              >
                Vitamin name
              </label>
              <input
                id="custom-supplement-input"
                type="text"
                autoFocus
                value={customModal.value}
                onChange={(e) =>
                  setCustomModal(
                    (prev: { open: boolean; window: string | null; value: string }) => ({
                      ...prev,
                      value: e.target.value,
                    }),
                  )
                }
                placeholder="e.g. Electrolytes"
                className="w-full rounded-lg border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] px-3 py-2.5 text-sm text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
              />
              {!customModal.value.trim() && (
                <p className="text-[11px] text-[color:var(--accent-light)]">
                  Enter a vitamin name to save.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeCustomModal} className="btn-ghost px-4 py-2">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCustomSupplement}
                disabled={!customModal.value.trim() || toggle.isPending}
                className={cn(
                  'btn-primary px-4 py-2',
                  (!customModal.value.trim() || toggle.isPending) &&
                    'opacity-50 cursor-not-allowed',
                )}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Window Card ──────────────────────────────────────────────── */

interface WindowCardProps {
  window: { timing: string; time?: string; supplements: string[]; optional?: string[] };
  windowLog: Record<string, boolean>;
  onToggle: (supplement: string) => void;
  onAddCustom: () => void;
}

function WindowCard({ window: w, windowLog, onToggle, onAddCustom }: WindowCardProps) {
  const allChecked = w.supplements.every((s) => windowLog[s]);
  const baseSet = new Set([...(w.supplements ?? []), ...(w.optional ?? [])]);
  const customDaySupplements = Object.keys(windowLog).filter(
    (name) => !baseSet.has(name) && windowLog[name],
  );

  return (
    <div className="glass-panel overflow-hidden">
      {/* Window header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(65,50,50,0.15)]">
        <Pill size={18} className="shrink-0 text-[color:var(--accent-light)] transition-colors" />
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
                isChecked ? '' : 'hover:bg-[rgba(22,16,16,0.55)]',
              )}
            >
              <span
                className={cn(
                  'text-sm transition-colors',
                  isChecked ? 'text-[color:var(--accent-light)]' : 'text-[color:var(--text-0)]',
                )}
              >
                {supplement}
              </span>
              <div
                className={cn(
                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                  isChecked
                    ? 'border-[color:var(--accent)] bg-[color:var(--accent)]'
                    : 'border-[color:var(--chrome-border)]',
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
                isChecked ? '' : 'hover:bg-[rgba(22,16,16,0.55)]',
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
                    : 'border-[color:var(--chrome-border-subtle)]',
                )}
              >
                {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}

        {customDaySupplements.map((supplement) => {
          const isChecked = windowLog[supplement] || false;
          return (
            <button
              key={supplement}
              type="button"
              onClick={() => onToggle(supplement)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 text-left transition-all',
                isChecked ? '' : 'hover:bg-[rgba(22,16,16,0.55)]',
              )}
            >
              <span className="text-sm text-[color:var(--text-0)]">
                {supplement}
                <span className="text-[10px] text-[color:var(--text-2)] ml-1.5">(custom)</span>
              </span>
              <div
                className={cn(
                  'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all',
                  isChecked
                    ? 'border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_70%,transparent)]'
                    : 'border-[color:var(--chrome-border-subtle)]',
                )}
              >
                {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onAddCustom}
          className="w-full flex items-center justify-between px-4 py-3 text-left transition-all hover:bg-[rgba(22,16,16,0.55)]"
        >
          <span className="inline-flex items-center gap-2 text-sm text-[color:var(--text-1)]">
            <Plus size={14} className="text-[color:var(--accent-light)]" />
            Add custom vitamin...
          </span>
        </button>
      </div>
    </div>
  );
}
