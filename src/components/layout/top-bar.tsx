'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useProfile, useRecoveryEntry, useActivePhase, useActiveAlerts } from '@/controllers';
import { useAuthStore } from '@/stores';
import { formatDisplayDate, today } from '@/lib/utils';
import { calculateReadinessScore } from '@/lib/utils/calculations';
import { Bell, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IronmindLogo } from '@/components/brand/ironmind-logo';

export function TopBar() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';
  const todayStr = today();

  const { data: profile } = useProfile(userId);
  const { data: recovery } = useRecoveryEntry(userId, todayStr);
  const { data: phase } = useActivePhase(userId);
  const { data: alerts } = useActiveAlerts(userId);
  const [alertsOpen, setAlertsOpen] = useState(false);

  const alertCount = alerts?.length ?? 0;

  const readinessScore = recovery ? calculateReadinessScore(recovery) : null;

  const readinessColor =
    readinessScore === null
      ? 'text-[color:var(--text-1)]'
      : readinessScore >= 80
      ? 'text-emerald-400'
      : readinessScore >= 60
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6',
        'bg-[color:var(--chrome-bg-topbar)]',
        'shadow-[var(--chrome-header-shadow)]'
      )}
    >
      {/* Left — Logo on small screens (sidebar is lg+ only); date & phase */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="lg:hidden shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d0d0d]"
          aria-label="IRONMIND home"
        >
          <IronmindLogo variant="topbar" priority />
        </Link>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#DC2626]">
            {formatDisplayDate(new Date())}
          </p>
          {(() => {
            const name = profile?.clientName ?? user?.displayName?.split(' ')[0];
            const nameColor = profile?.sex === 'female' ? 'text-[#FF69B4]' : 'text-[#F0F0F0]';
            if (!name && !phase) return null;
            return (
              <p className="text-xs font-semibold text-[#DC2626] mt-0.5 tracking-wide">
                {name && <span className={nameColor}>{name}{phase ? ' — ' : ''}</span>}
                {phase?.name}
              </p>
            );
          })()}
        </div>
      </div>

      {/* Center — Readiness */}
      {readinessScore !== null && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--text-2)]">
            Readiness
          </span>
          <span className={cn('text-xl font-bold font-mono tabular-nums', readinessColor)}>
            {Math.round(readinessScore)}
          </span>
          <span className="text-[11px] text-[color:var(--text-1)]">/100</span>
        </div>
      )}

      {/* Right — Alerts & Profile */}
      <div className="flex items-center gap-3">
        {/* Bell + dropdown */}
        <div className="relative">
          <button
            onClick={() => setAlertsOpen(o => !o)}
            className="relative p-2 text-[color:var(--text-1)] hover:text-[color:var(--text-0)] transition-colors duration-200 rounded-lg hover:bg-[rgba(0,0,0,0.35)]"
          >
            <Bell size={18} />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-pulse" />
            )}
          </button>

          {alertsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-panel z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(65,50,50,0.28)]">
                <span className="text-sm font-semibold text-[#F5F5F5]">Alerts</span>
                <button onClick={() => setAlertsOpen(false)} className="text-[color:var(--text-1)] hover:text-[color:var(--text-0)]">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[rgba(65,50,50,0.18)]">
                {alertCount === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-[color:var(--text-1)]">No active alerts.</p>
                  </div>
                ) : alerts?.map(alert => (
                  <div key={alert.id} className="px-4 py-3 flex items-start gap-3">
                    {alert.severity === 'critical'
                      ? <AlertTriangle size={16} className="text-[#EF4444] shrink-0 mt-0.5" />
                      : alert.severity === 'warning'
                      ? <AlertTriangle size={16} className="text-[#F59E0B] shrink-0 mt-0.5" />
                      : <Info size={16} className="text-[#DC2626] shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-sm font-medium text-[#F5F5F5]">{alert.title}</p>
                      <p className="text-xs text-[color:var(--text-1)] mt-0.5">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm
            bg-[rgba(220,38,38,0.12)] text-[#EF4444] border border-[rgba(220,38,38,0.35)]">
            {profile?.currentWeight ? `${profile.currentWeight}` : '—'}
          </div>
          <div className="hidden sm:block">
            <p className={cn(
              'text-sm font-semibold leading-none',
              profile?.sex === 'female' ? 'text-[#FF69B4]' : 'text-[#F5F5F5]'
            )}>
              {profile?.clientName ?? user?.displayName ?? 'Athlete'}
            </p>
            <p className="text-[11px] text-[color:var(--text-1)] mt-0.5">
              Target: {profile?.targetWeight ?? '—'}kg
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
