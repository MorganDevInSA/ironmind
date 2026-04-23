'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  useProfile,
  useRecoveryEntry,
  useRecentRecoveryEntries,
  useRecentCheckIns,
  useActivePhase,
  useActiveAlerts,
} from '@/controllers';
import { useAuthStore } from '@/stores';
import { useOnlineStore } from '@/stores/online-store';
import { formatDisplayDate, today } from '@/lib/utils';
import { calculateReadinessScore } from '@/lib/utils/calculations';
import { Bell, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IronmindLogo } from '@/components/brand/ironmind-logo';

const LED_COUNT = 10;

function dismissedAlertsStorageKey(userId: string) {
  return `ironmind:dismissed-alerts:${userId}`;
}

function LedBar({
  ratio,
  variant,
  hasData = false,
}: {
  ratio: number;
  variant: 'primary' | 'secondary';
  hasData?: boolean;
}) {
  const litCount = hasData ? Math.max(1, Math.round(ratio * LED_COUNT)) : 0;

  return (
    <div className="flex items-center gap-[2px]" aria-hidden="true">
      {Array.from({ length: LED_COUNT }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'knight-led',
            i < litCount && (variant === 'primary' ? 'knight-led-lit' : 'knight-led-lit-alt'),
          )}
          style={{
            width: 3,
            height: 9,
            borderRadius: 1,
            animationDelay: i < litCount ? `${i * 60}ms` : '0ms',
          }}
        />
      ))}
    </div>
  );
}

function getReadinessLabel(score: number): string {
  if (score >= 90) return 'Peak';
  if (score >= 80) return 'Primed';
  if (score >= 70) return 'Solid';
  if (score >= 60) return 'Moderate';
  if (score >= 45) return 'Fatigued';
  return 'Depleted';
}

function clampRatio(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function TopBar() {
  const { user } = useAuthStore();
  const isOnline = useOnlineStore((s) => s.isOnline);
  const userId = user?.uid ?? '';
  const todayStr = today();

  const { data: profile } = useProfile(userId);
  const { data: recovery } = useRecoveryEntry(userId, todayStr);
  const { data: recoveryHistory } = useRecentRecoveryEntries(userId, 7);
  const { data: recentCheckIns } = useRecentCheckIns(userId, 1);
  const { data: phase } = useActivePhase(userId);
  const { data: alerts } = useActiveAlerts(userId);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [readinessHover, setReadinessHover] = useState(false);
  const [targetHover, setTargetHover] = useState(false);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  useEffect(() => {
    if (!userId || typeof window === 'undefined') {
      setDismissedAlertIds([]);
      return;
    }
    try {
      const raw = sessionStorage.getItem(dismissedAlertsStorageKey(userId));
      const parsed = JSON.parse(raw ?? '[]');
      setDismissedAlertIds(
        Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [],
      );
    } catch {
      setDismissedAlertIds([]);
    }
  }, [userId]);

  const serverAlerts = useMemo(() => alerts ?? [], [alerts]);
  const visibleAlerts = useMemo(
    () => serverAlerts.filter((a) => !dismissedAlertIds.includes(a.id)),
    [serverAlerts, dismissedAlertIds],
  );
  const alertCount = visibleAlerts.length;

  const dismissAlert = (id: string) => {
    setDismissedAlertIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      if (userId && typeof window !== 'undefined') {
        sessionStorage.setItem(dismissedAlertsStorageKey(userId), JSON.stringify(next));
      }
      return next;
    });
  };
  const fallbackRecovery = recoveryHistory?.[0];
  const readinessSource = recovery ?? fallbackRecovery ?? null;
  const readinessScore = readinessSource ? calculateReadinessScore(readinessSource) : null;

  const readinessLabel = useMemo(
    () => (readinessScore !== null ? getReadinessLabel(readinessScore) : null),
    [readinessScore],
  );

  const initialWeight = phase?.targets?.startWeight;
  const goalWeight = phase?.targets?.targetWeight ?? profile?.targetWeight;
  const currentWeight = recentCheckIns?.[0]?.bodyweight ?? profile?.currentWeight;
  const targetDelta = useMemo(() => {
    if (
      initialWeight == null ||
      goalWeight == null ||
      currentWeight == null ||
      !Number.isFinite(initialWeight) ||
      !Number.isFinite(goalWeight) ||
      !Number.isFinite(currentWeight)
    ) {
      return null;
    }

    const totalRange = Math.abs(initialWeight - goalWeight);
    if (totalRange === 0) return null;

    const progressed = Math.abs(initialWeight - currentWeight);
    return {
      totalRange,
      progressed,
      remaining: Math.abs(currentWeight - goalWeight),
      ratio: clampRatio(progressed / totalRange),
    };
  }, [currentWeight, goalWeight, initialWeight]);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6',
        'bg-[color:var(--chrome-bg-topbar)]',
        'shadow-[var(--chrome-header-shadow)]',
      )}
    >
      {/* Left — Logo + date + phase */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="lg:hidden shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]"
          aria-label="IRONMIND home"
        >
          <IronmindLogo variant="topbar" priority />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--accent)]">
            {formatDisplayDate(new Date())}
          </p>
          {(() => {
            const name = profile?.clientName ?? user?.displayName?.split(' ')[0];
            if (!name && !phase) return null;
            return (
              <p className="text-xs mt-0.5 tracking-wide">
                {name && (
                  <>
                    <span className="font-bold text-[color:var(--text-0)]">{name}</span>
                    {phase ? (
                      <span className="text-[color:var(--text-2)] font-semibold"> — </span>
                    ) : null}
                  </>
                )}
                {phase?.name && (
                  <span className="font-semibold text-[color:var(--text-1)]">{phase.name}</span>
                )}
              </p>
            );
          })()}
        </div>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(245,158,11,0.12)] border border-[rgba(245,158,11,0.35)]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#F59E0B]">
              Offline
            </span>
          </div>
        )}
      </div>

      {/* Right — readiness metric + conditional bell */}
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end gap-1.5">
          {/* Readiness indicator */}
          <div
            className="relative flex items-center gap-1.5 cursor-default select-none"
            onMouseEnter={() => setReadinessHover(true)}
            onMouseLeave={() => setReadinessHover(false)}
            onFocusCapture={() => setReadinessHover(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setReadinessHover(false);
              }
            }}
            role="status"
            tabIndex={0}
            aria-label={
              readinessScore !== null
                ? `Readiness ${Math.round(readinessScore)} out of 100 — ${readinessLabel}`
                : 'Readiness unavailable'
            }
          >
            <div className="flex items-center justify-end">
              <LedBar
                ratio={readinessScore !== null ? readinessScore / 100 : 0}
                variant="primary"
                hasData={readinessScore !== null}
              />
            </div>

            <div
              className={cn(
                'absolute top-full right-0 mt-2 min-w-[260px] px-4 py-3 rounded-lg glass-panel-strong z-50',
                'pointer-events-none',
                'transition-all duration-200',
                readinessHover ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
              )}
              role="dialog"
              aria-modal="false"
              aria-label="Readiness indicator details"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[color:var(--text-1)]">Readiness</span>
                {readinessScore !== null ? (
                  <span className="text-[color:var(--text-0)] font-semibold">
                    {Math.round(readinessScore)}/100 ({readinessLabel})
                  </span>
                ) : (
                  <span className="text-[color:var(--text-2)]">No recovery data today</span>
                )}
              </div>
            </div>
          </div>

          {/* Target progress indicator */}
          <div
            className="relative flex items-center gap-1.5 cursor-default select-none"
            onMouseEnter={() => setTargetHover(true)}
            onMouseLeave={() => setTargetHover(false)}
            onFocusCapture={() => setTargetHover(true)}
            onBlurCapture={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setTargetHover(false);
              }
            }}
            role="status"
            tabIndex={0}
            aria-label={
              targetDelta
                ? `Weight target progress ${Math.round(targetDelta.ratio * 100)} percent`
                : 'Weight target progress unavailable'
            }
          >
            <div className="flex items-center justify-end">
              <LedBar
                ratio={targetDelta?.ratio ?? 0}
                variant="secondary"
                hasData={targetDelta !== null}
              />
            </div>

            <div
              className={cn(
                'absolute top-full right-0 mt-2 min-w-[300px] px-4 py-3 rounded-lg glass-panel-strong z-50',
                'pointer-events-none',
                'transition-all duration-200',
                targetHover ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1',
              )}
              role="dialog"
              aria-modal="false"
              aria-label="Weight target indicator details"
            >
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[color:var(--text-1)]">Target progress</span>
                  <span
                    className={cn(
                      'font-semibold',
                      targetDelta ? 'text-[color:var(--text-0)]' : 'text-[color:var(--text-2)]',
                    )}
                  >
                    {targetDelta ? `${Math.round(targetDelta.ratio * 100)}%` : 'No weight targets'}
                  </span>
                </div>
                {targetDelta &&
                  initialWeight != null &&
                  currentWeight != null &&
                  goalWeight != null && (
                    <>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-[color:var(--text-2)]">Range</span>
                        <span className="font-semibold text-[color:var(--text-1)]">
                          {targetDelta.totalRange.toFixed(1)} kg ({initialWeight} to {goalWeight})
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-[color:var(--text-2)]">Progressed</span>
                        <span className="font-semibold text-[color:var(--text-1)]">
                          {targetDelta.progressed.toFixed(1)} kg
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-[color:var(--text-2)]">Remaining</span>
                        <span className="font-semibold text-[color:var(--text-1)]">
                          {targetDelta.remaining.toFixed(1)} kg
                        </span>
                      </div>
                    </>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Bell — always visible; dims when there are no active (non-dismissed) alerts */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setAlertsOpen((o) => !o)}
            aria-label={`Alerts, ${alertCount} active`}
            aria-expanded={alertsOpen}
            className={cn(
              'relative p-2 rounded-lg transition-colors duration-200 hover:bg-[rgba(0,0,0,0.35)]',
              alertCount > 0
                ? 'text-[color:var(--accent)] hover:text-[color:var(--accent-light)]'
                : 'text-[color:color-mix(in_srgb,var(--accent)_38%,var(--text-2)))] hover:text-[color:color-mix(in_srgb,var(--accent)_48%,var(--text-1)))]',
            )}
          >
            <Bell size={16} aria-hidden="true" className="relative z-0" />
            {alertCount > 0 && (
              <span
                className="absolute top-1 right-1 z-[1] h-1.5 w-1.5 rounded-full bg-[color:var(--accent)] animate-pulse"
                aria-hidden
              />
            )}
            <span
              className={cn(
                'pointer-events-none absolute bottom-0 right-0 z-[2] min-w-[0.875rem] translate-x-0.5 translate-y-0.5 text-center text-[9px] font-bold font-mono tabular-nums leading-none',
                alertCount > 0 ? 'text-[color:var(--accent-light)]' : 'text-[color:var(--text-2)]',
              )}
              aria-hidden
            >
              {alertCount}
            </span>
          </button>

          {alertsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-panel z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(65,50,50,0.28)]">
                <span className="text-sm font-semibold text-[color:var(--text-0)]">Alerts</span>
                <button
                  type="button"
                  onClick={() => setAlertsOpen(false)}
                  aria-label="Close alerts"
                  className="text-[color:var(--text-1)] hover:text-[color:var(--text-0)]"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[rgba(65,50,50,0.18)]">
                {visibleAlerts.length === 0 ? (
                  <div className="px-4 py-5 text-center text-xs text-[color:var(--text-2)] leading-relaxed">
                    {serverAlerts.length > 0
                      ? 'All alerts cleared for this session. Refresh the page to review them again.'
                      : 'No alerts right now.'}
                  </div>
                ) : (
                  visibleAlerts.map((alert) => (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => dismissAlert(alert.id)}
                      className="w-full px-4 py-3 flex items-start gap-3 text-left transition-colors hover:bg-[color:color-mix(in_srgb,var(--accent)_7%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/45 focus-visible:ring-inset"
                    >
                      {alert.severity === 'critical' ? (
                        <AlertTriangle
                          size={16}
                          className="text-[color:var(--accent-light)] shrink-0 mt-0.5"
                          aria-hidden
                        />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle
                          size={16}
                          className="text-[#F59E0B] shrink-0 mt-0.5"
                          aria-hidden
                        />
                      ) : (
                        <Info
                          size={16}
                          className="text-[color:var(--accent)] shrink-0 mt-0.5"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[color:var(--text-0)]">
                          {alert.title}
                        </p>
                        <p className="text-xs text-[color:var(--text-1)] mt-0.5">{alert.message}</p>
                        <p className="text-[10px] text-[color:var(--text-2)] mt-1.5">
                          Tap to dismiss
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
