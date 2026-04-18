'use client';

import { useState } from 'react';
import { useProfile, useRecoveryEntry, useActivePhase, useActiveAlerts } from '@/controllers';
import { useAuthStore } from '@/stores';
import { formatDisplayDate, today } from '@/lib/utils';
import { calculateReadinessScore } from '@/lib/utils/calculations';
import { Bell, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      ? 'text-[#6B6B6B]'
      : readinessScore >= 80
      ? 'text-emerald-400'
      : readinessScore >= 60
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 flex items-center justify-between px-4 lg:px-6',
        'bg-[#2e2e2e] backdrop-blur-xl',
        'border-b border-[rgba(220,38,38,0.45)]'
      )}
    >
      {/* Left — Date & Phase (crimson micro-header) */}
      <div className="flex items-center gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#DC2626]">
            {formatDisplayDate(new Date())}
          </p>
          {phase && (
            <p className="text-xs font-semibold text-[#DC2626] mt-0.5 tracking-wide">
              {phase.name}
            </p>
          )}
        </div>
      </div>

      {/* Center — Readiness */}
      {readinessScore !== null && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6B6B6B]">
            Readiness
          </span>
          <span className={cn('text-xl font-bold font-mono tabular-nums', readinessColor)}>
            {Math.round(readinessScore)}
          </span>
          <span className="text-[11px] text-[#6B6B6B]">/100</span>
        </div>
      )}

      {/* Right — Alerts & Profile */}
      <div className="flex items-center gap-3">
        {/* Bell + dropdown */}
        <div className="relative">
          <button
            onClick={() => setAlertsOpen(o => !o)}
            className="relative p-2 text-[#7A7A7A] hover:text-[#F0F0F0] transition-colors duration-200 rounded-lg hover:bg-[rgba(0,0,0,0.35)]"
          >
            <Bell size={18} />
            {alertCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#DC2626] rounded-full animate-pulse" />
            )}
          </button>

          {alertsOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-panel z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(80,96,128,0.15)]">
                <span className="text-sm font-semibold text-[#F5F5F5]">Alerts</span>
                <button onClick={() => setAlertsOpen(false)} className="text-[#6B6B6B] hover:text-[#F5F5F5]">
                  <X size={16} />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[rgba(80,96,128,0.1)]">
                {alertCount === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-sm text-[#6B6B6B]">No active alerts.</p>
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
                      <p className="text-xs text-[#6B6B6B] mt-0.5">{alert.message}</p>
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
            <p className="text-sm font-semibold text-[#F5F5F5] leading-none">
              {user?.displayName || 'Athlete'}
            </p>
            <p className="text-[11px] text-[#6B6B6B] mt-0.5">
              Target: {profile?.targetWeight ?? '—'}kg
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
