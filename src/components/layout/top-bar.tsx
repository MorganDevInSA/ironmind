'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProfile, useRecoveryEntry, useActivePhase, useActiveAlerts } from '@/controllers';
import { useAuthStore } from '@/stores';
import { formatDisplayDate, today } from '@/lib/utils';
import { calculateReadinessScore } from '@/lib/utils/calculations';
import { Bell, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IronmindLogo } from '@/components/brand/ironmind-logo';

const LED_COUNT = 10;

function LedBar({ ratio, variant }: { ratio: number; variant: 'primary' | 'secondary' }) {
  const litCount = Math.max(1, Math.round(ratio * LED_COUNT));

  return (
    <div className="flex items-center gap-[2px]" aria-hidden="true">
      {Array.from({ length: LED_COUNT }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'knight-led',
            i < litCount && (variant === 'primary' ? 'knight-led-lit' : 'knight-led-lit-alt')
          )}
          style={{
            width: 3,
            height: 10,
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

function getWeightLabel(current: number, target: number): string {
  const diff = Math.abs(current - target);
  if (diff <= 0.5) return 'On Target';
  if (diff <= 2) return 'Close';
  if (current > target) return 'Cutting';
  return 'Building';
}

export function TopBar() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';
  const todayStr = today();

  const { data: profile } = useProfile(userId);
  const { data: recovery } = useRecoveryEntry(userId, todayStr);
  const { data: phase } = useActivePhase(userId);
  const { data: alerts } = useActiveAlerts(userId);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [metricsHover, setMetricsHover] = useState(false);

  const alertCount = alerts?.length ?? 0;
  const readinessScore = recovery ? calculateReadinessScore(recovery) : null;

  const readinessLabel = useMemo(
    () => (readinessScore !== null ? getReadinessLabel(readinessScore) : null),
    [readinessScore]
  );

  const currentWeight = profile?.currentWeight ?? null;
  const targetWeight = profile?.targetWeight ?? null;
  const weightRatio = currentWeight && targetWeight
    ? Math.min(1, Math.max(0, 1 - Math.abs(currentWeight - targetWeight) / targetWeight))
    : null;
  const weightLabel = currentWeight && targetWeight
    ? getWeightLabel(currentWeight, targetWeight)
    : null;

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6',
        'bg-[color:var(--chrome-bg-topbar)]',
        'shadow-[var(--chrome-header-shadow)]'
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
                    {phase ? <span className="text-[color:var(--text-2)] font-semibold"> — </span> : null}
                  </>
                )}
                {phase?.name && (
                  <span className="font-semibold text-[color:var(--text-1)]">{phase.name}</span>
                )}
              </p>
            );
          })()}
        </div>
      </div>

      {/* Right — LED metrics + conditional bell */}
      <div className="flex items-center gap-4">

        {/* LED metric cluster */}
        <div
          className="relative flex items-center gap-3 cursor-default select-none"
          onMouseEnter={() => setMetricsHover(true)}
          onMouseLeave={() => setMetricsHover(false)}
          role="status"
          aria-label={[
            readinessScore !== null ? `Readiness ${Math.round(readinessScore)} out of 100 — ${readinessLabel}` : null,
            currentWeight && targetWeight ? `Weight ${currentWeight}kg, target ${targetWeight}kg — ${weightLabel}` : null,
          ].filter(Boolean).join('. ')}
        >
          {/* Readiness bar */}
          {readinessScore !== null && (
            <div className="flex items-center gap-1.5">
              <LedBar ratio={readinessScore / 100} variant="primary" />
              <span className="text-[11px] font-bold font-mono tabular-nums text-[color:var(--accent)]">
                {Math.round(readinessScore)}
              </span>
            </div>
          )}

          {/* Weight bar */}
          {weightRatio !== null && currentWeight && (
            <div className="flex items-center gap-1.5">
              <LedBar ratio={weightRatio} variant="secondary" />
              <span className="text-[11px] font-bold font-mono tabular-nums text-[color:var(--accent-2)]">
                {currentWeight}
              </span>
            </div>
          )}

          {/* Hover tooltip */}
          <div
            className={cn(
              'absolute top-full right-0 mt-2 px-4 py-3 rounded-lg glass-panel-strong z-50',
              'whitespace-nowrap pointer-events-none',
              'transition-all duration-200',
              metricsHover ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
            )}
          >
            {readinessScore !== null && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-2)]">
                  Readiness
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[color:var(--accent-light)]">
                    {readinessLabel}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-[color:var(--text-1)]">
                    {Math.round(readinessScore)}/100
                  </span>
                </div>
              </div>
            )}
            {currentWeight && targetWeight && (
              <div className={cn(
                'flex items-center justify-between gap-6',
                readinessScore !== null && 'mt-1.5 pt-1.5 border-t border-[rgba(65,50,50,0.25)]'
              )}>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-2)]">
                  Weight
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[color:var(--accent-light)]">
                    {weightLabel}
                  </span>
                  <span className="text-[11px] font-mono tabular-nums text-[color:var(--text-1)]">
                    {currentWeight} / {targetWeight}kg
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bell — only if unread alerts exist */}
        {alertCount > 0 && (
          <div className="relative">
            <button
              onClick={() => setAlertsOpen(o => !o)}
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
                  <button onClick={() => setAlertsOpen(false)} aria-label="Close alerts" className="text-[color:var(--text-1)] hover:text-[color:var(--text-0)]">
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto divide-y divide-[rgba(65,50,50,0.18)]">
                  {alerts?.map(alert => (
                    <div key={alert.id} className="px-4 py-3 flex items-start gap-3">
                      {alert.severity === 'critical'
                        ? <AlertTriangle size={16} className="text-[color:var(--accent-light)] shrink-0 mt-0.5" />
                        : alert.severity === 'warning'
                        ? <AlertTriangle size={16} className="text-[#F59E0B] shrink-0 mt-0.5" />
                        : <Info size={16} className="text-[color:var(--accent)] shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-sm font-medium text-[color:var(--text-0)]">{alert.title}</p>
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
