'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useActiveProgram } from '@/controllers';
import { ArrowLeft, Dumbbell, Calendar, TrendingUp } from 'lucide-react';

export default function ProgramsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: program, isLoading } = useActiveProgram(user?.uid ?? '');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 text-[#6B6B6B] hover:text-[#F5F5F5] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-[#F5F5F5]">Programs</h1>
      </div>

      {isLoading && <div className="glass-panel p-8 text-center"><div className="spinner mx-auto" /></div>}

      {!isLoading && program && (
        <div className="space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B6B6B] mb-1">Active Program</p>
                <h2 className="text-lg font-bold text-[#F5F5F5]">{program.name}</h2>
              </div>
              <span className="px-2 py-1 rounded-md bg-[rgba(16,185,129,0.12)] border border-[rgba(16,185,129,0.35)] text-[#10B981] text-xs font-semibold uppercase">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[rgba(16,22,34,0.6)] rounded-lg p-3">
                <p className="text-xs text-[#6B6B6B] mb-1">Cycle length</p>
                <p className="font-mono tabular-nums text-[#F5F5F5] font-semibold">{program.cycleLengthDays} days</p>
              </div>
              <div className="bg-[rgba(16,22,34,0.6)] rounded-lg p-3">
                <p className="text-xs text-[#6B6B6B] mb-1">Lift sessions</p>
                <p className="font-mono tabular-nums text-[#F5F5F5] font-semibold">
                  {program.sessions.filter(s => s.type === 'lift').length} / cycle
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-5 space-y-3">
            <h3 className="font-semibold text-[#F5F5F5]">Cycle Overview</h3>
            <div className="space-y-2">
              {program.sessions.map(s => (
                <div key={s.dayNumber} className="flex items-center gap-3 py-2 border-b border-[rgba(80,96,128,0.15)] last:border-0">
                  <span className="w-8 h-8 rounded-lg bg-[rgba(16,22,34,0.6)] flex items-center justify-center font-mono text-xs font-bold text-[#6B6B6B]">
                    {s.dayNumber}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#F5F5F5]">{s.name}</p>
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wide ${
                    s.type === 'lift' ? 'text-[color:var(--accent)]' : s.type === 'recovery' ? 'text-[#10B981]' : 'text-[#6B6B6B]'
                  }`}>{s.type}</span>
                </div>
              ))}
            </div>
          </div>

          {program.kpis && program.kpis.length > 0 && (
            <div className="glass-panel p-5 space-y-3">
              <h3 className="font-semibold text-[#F5F5F5] flex items-center gap-2"><TrendingUp size={18} className="text-[color:var(--accent)]" /> KPI Lifts</h3>
              {program.kpis.map(kpi => (
                <div key={kpi.exercise} className="flex justify-between text-sm">
                  <span className="text-[#9A9A9A]">{kpi.exercise}</span>
                  <span className="text-[#6B6B6B]">{kpi.metric}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isLoading && !program && (
        <div className="glass-panel p-8 text-center space-y-4">
          <Dumbbell size={32} className="mx-auto text-[#6B6B6B]" />
          <p className="text-[#6B6B6B]">No program loaded. Import your coach files to get started.</p>
          <button onClick={() => router.push('/onboarding')} className="btn-primary">Import Plan</button>
        </div>
      )}
    </div>
  );
}
