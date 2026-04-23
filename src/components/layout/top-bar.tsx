'use client';

import { useState, useMemo } from 'react';
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

  const alertCount = alerts?.length ?? 0;
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

        {/* Bell — only if unread alerts exist */}
        {alertCount > 0 && (
          <div className="relative">
            <button
              onClick={() => setAlertsOpen((o) => !o)}
              aria-label={`${alertCount} unread alert${alertCount > 1 ? 's' : ''}`}
              aria-expanded={alertsOpen}
              className="relative p-2 text-[color:var(--accent)] hover:text-[color:var(--accent-light)] transition-colors duration-200 rounded-lg hover:bg-[rgba(0,0,0,0.35)]"
            >
              <Bell size={16} aria-hidden="true" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[color:var(--accent)] rounded-full animate-pulse" />
            </button>

            {alertsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 glass-panel z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(65,50,50,0.28)]">
                  <span className="text-sm font-semibold text-[color:var(--text-0)]">Alerts</span>
                  <button
                    onClick={() => setAlertsOpen(false)}
                    aria-label="Close alerts"
                    className="text-[color:var(--text-1)] hover:text-[color:var(--text-0)]"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[rgba(65,50,50,0.18)]">
                  {alerts?.map((alert) => (
                    <div key={alert.id} className="px-4 py-3 flex items-start gap-3">
                      {alert.severity === 'critical' ? (
                        <AlertTriangle
                          size={16}
                          className="text-[color:var(--accent-light)] shrink-0 mt-0.5"
                        />
                      ) : alert.severity === 'warning' ? (
                        <AlertTriangle size={16} className="text-[#F59E0B] shrink-0 mt-0.5" />
                      ) : (
                        <Info size={16} className="text-[color:var(--accent)] shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-[color:var(--text-0)]">
                          {alert.title}
                        </p>
                        <p className="text-xs text-[color:var(--text-1)] mt-0.5">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
