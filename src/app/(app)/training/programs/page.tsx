'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useActiveProgram } from '@/controllers';
import { ArrowLeft, Dumbbell, TrendingUp } from 'lucide-react';

export default function ProgramsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: program, isLoading } = useActiveProgram(user?.uid ?? '');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 text-[color:var(--text-2)] hover:text-[color:var(--text-0)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-[color:var(--accent)]">Programs</h1>
      </div>

      {isLoading && (
        <div className="glass-panel p-8 text-center">
          <div className="spinner mx-auto" />
        </div>
      )}

      {!isLoading && program && (
        <div className="space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-2)] mb-1">
                  Active Program
                </p>
                <h2 className="text-lg font-bold text-[color:var(--text-0)]">{program.name}</h2>
              </div>
              <span className="px-2 py-1 rounded-md bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] border border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)] text-[color:var(--accent)] text-xs font-semibold uppercase">
                Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[color:var(--surface-well)] rounded-lg p-3">
                <p className="text-xs text-[color:var(--text-2)] mb-1">Cycle length</p>
                <p className="font-mono tabular-nums text-[color:var(--text-0)] font-semibold">
                  {program.cycleLengthDays} days
                </p>
              </div>
              <div className="bg-[color:var(--surface-well)] rounded-lg p-3">
                <p className="text-xs text-[color:var(--text-2)] mb-1">Lift sessions</p>
                <p className="font-mono tabular-nums text-[color:var(--text-0)] font-semibold">
                  {program.sessions.filter((s) => s.type === 'lift').length} / cycle
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 space-y-3">
            <h3 className="font-semibold text-[color:var(--text-0)]">Cycle Overview</h3>
            <div className="space-y-2">
              {program.sessions.map((s) => (
                <div
                  key={s.dayNumber}
                  className="flex items-center gap-3 py-2 border-b border-[color:color-mix(in_srgb,var(--chrome-border)_40%,transparent)] last:border-0"
                >
                  <span className="w-8 h-8 rounded-lg bg-[color:var(--surface-well)] flex items-center justify-center font-mono text-xs font-bold text-[color:var(--text-2)]">
                    {s.dayNumber}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[color:var(--text-0)]">{s.name}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      s.type === 'lift'
                        ? 'text-[color:var(--accent)]'
                        : s.type === 'recovery'
                          ? 'text-[color:var(--accent)]'
                          : 'text-[color:var(--text-2)]'
                    }`}
                  >
                    {s.type}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {program.kpis && program.kpis.length > 0 && (
            <div className="glass-panel p-5 space-y-3">
              <h3 className="font-semibold text-[color:var(--text-0)] flex items-center gap-2">
                <TrendingUp size={18} className="text-[color:var(--accent)]" /> KPI Lifts
              </h3>
              {program.kpis.map((kpi) => (
                <div key={kpi.exercise} className="flex justify-between text-sm">
                  <span className="text-[color:var(--text-1)]">{kpi.exercise}</span>
                  <span className="text-[color:var(--text-2)]">{kpi.metric}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && !program && (
        <div className="glass-panel p-8 text-center space-y-4">
          <Dumbbell size={32} className="mx-auto text-[color:var(--text-2)]" />
          <p className="text-[color:var(--text-2)]">
            No program loaded. Import your coach files to get started.
          </p>
          <button onClick={() => router.push('/onboarding')} className="btn-primary">
            Import Plan
          </button>
        </div>
      )}
    </div>
  );
}
