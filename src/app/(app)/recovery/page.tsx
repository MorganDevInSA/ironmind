'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useSaveRecoveryEntry, useRecentRecoveryEntries } from '@/controllers';
import { today, formatDisplayDate } from '@/lib/utils';
import { Activity, CheckCircle2, TrendingUp, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import type { RecoveryEntry } from '@/lib/types';

/* ── Chart custom tooltip ─────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[rgba(10,12,18,0.95)] border border-[rgba(80,96,128,0.3)] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-[#6B6B6B] mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#9A9A9A] capitalize">{p.name}:</span>
          <span className="font-mono tabular-nums text-[#F5F5F5] font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

const MOODS = ['😫', '😔', '😐', '😊', '🔥'] as const;

function SliderField({ label, value, onChange, min = 1, max = 10, unit = '' }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-[#9A9A9A]">{label}</label>
        <span className="font-mono tabular-nums text-[#F5F5F5] font-semibold text-sm">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full" style={{ accentColor: 'var(--accent)' }} />
      <div className="flex justify-between text-xs text-[#6B6B6B]">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */
export default function RecoveryPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const { mutate: saveRecovery, isPending, isSuccess } = useSaveRecoveryEntry(userId);
  const { data: history } = useRecentRecoveryEntries(userId, 14);

  const [form, setForm] = useState({ sleepHours: 7.5, sleepQuality: 7, hrv: 55, stress: 3, energy: 7, doms: 4, pelvicComfort: 8, mood: 3 });
  const [tab, setTab] = useState<'log' | 'trends'>('log');

  const handleSubmit = () => {
    const readinessScore = Math.min(100, Math.max(0, Math.round(
      (form.sleepQuality / 10 * 25) +
      ((10 - form.stress) / 10 * 20) +
      (form.energy / 10 * 20) +
      ((10 - form.doms) / 10 * 15) +
      (form.hrv / 100 * 15) +
      (form.mood / 5 * 5)
    )));

    const todayStr = today();
    saveRecovery({
      date: todayStr,
      entry: { date: todayStr, sleepHours: form.sleepHours, sleepQuality: form.sleepQuality, hrv: form.hrv, stress: form.stress, energy: form.energy, doms: form.doms, pelvicComfort: form.pelvicComfort, mood: form.mood, readinessScore },
    });
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-panel p-10 max-w-sm w-full text-center space-y-4">
          <CheckCircle2 size={40} className="text-[#10B981] mx-auto" />
          <h2 className="text-xl font-bold text-[#F5F5F5]">Recovery logged.</h2>
          <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">Dashboard</button>
        </div>
      </div>
    );
  }

  /* ── Chart data ─────────────────────────────────────────────── */
  const chartData = (history ?? [])
    .slice()
    .reverse()
    .map((r: RecoveryEntry) => ({
      date: formatDisplayDate(r.date).replace(/\d{4}$/, '').trim(),
      readiness: Math.round(r.readinessScore),
      sleep: r.sleepHours,
      hrv: r.hrv,
      energy: r.energy,
      stress: r.stress,
      doms: r.doms,
    }));

  const latestEntry = history?.[0];
  const radarData = latestEntry ? [
    { metric: 'Sleep', value: latestEntry.sleepQuality, max: 10 },
    { metric: 'Energy', value: latestEntry.energy, max: 10 },
    { metric: 'HRV', value: Math.round(latestEntry.hrv / 12), max: 10 },
    { metric: 'Low Stress', value: 10 - latestEntry.stress, max: 10 },
    { metric: 'Pelvic', value: latestEntry.pelvicComfort, max: 10 },
    { metric: 'Mood', value: latestEntry.mood * 2, max: 10 },
    { metric: 'Low DOMS', value: 10 - latestEntry.doms, max: 10 },
  ] : [];

  return (
    <div className="space-y-5 max-w-2xl">

      {/* Header + tab switcher */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-2)] mb-1">Morning Check-in</p>
          <h1 className="text-2xl font-bold text-[color:var(--text-0)]">Recovery</h1>
        </div>
        <div className="flex rounded-xl overflow-hidden border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)]">
          <button onClick={() => setTab('log')}
            className={cn('px-4 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 border border-transparent',
              tab === 'log' ? 'is-selected text-[color:var(--accent-light)]' : 'text-[color:var(--text-2)] hover:text-[color:var(--text-0)]')}>
            <Activity size={15} /> Log
          </button>
          <button onClick={() => setTab('trends')}
            className={cn('px-4 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 border border-transparent',
              tab === 'trends' ? 'is-selected text-[color:var(--accent-light)]' : 'text-[color:var(--text-2)] hover:text-[color:var(--text-0)]')}>
            <TrendingUp size={15} /> Trends
          </button>
        </div>
      </div>

      {/* ── LOG TAB ─────────────────────────────────────────────── */}
      {tab === 'log' && (
        <>
          {/* Previous log when today not yet logged */}
          {latestEntry && latestEntry.date !== today() && (
            <div className="glass-panel p-4 flex items-center gap-4 border border-[rgba(16,185,129,0.22)]">
              <div className={cn('w-14 h-14 rounded-full flex items-center justify-center font-mono tabular-nums text-xl font-bold border-2',
                latestEntry.readinessScore >= 80 ? 'text-[#10B981] border-[rgba(16,185,129,0.4)]' :
                latestEntry.readinessScore >= 60 ? 'text-[#F59E0B] border-[rgba(245,158,11,0.4)]' :
                'text-[#EF4444] border-[rgba(239,68,68,0.4)]')}>
                {Math.round(latestEntry.readinessScore)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6B6B6B] mb-0.5">Last logged</p>
                <p className="font-semibold text-[#F5F5F5] truncate">{formatDisplayDate(latestEntry.date)}</p>
                <p className="text-sm text-[#6B6B6B]">
                  Sleep {latestEntry.sleepHours}h · HRV {latestEntry.hrv} · Energy {latestEntry.energy}/10
                </p>
              </div>
            </div>
          )}

          {/* Today's readiness preview */}
          {latestEntry && latestEntry.date === today() && (
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className={cn('w-14 h-14 rounded-full flex items-center justify-center font-mono tabular-nums text-xl font-bold border-2',
                latestEntry.readinessScore >= 80 ? 'text-[#10B981] border-[rgba(16,185,129,0.4)]' :
                latestEntry.readinessScore >= 60 ? 'text-[#F59E0B] border-[rgba(245,158,11,0.4)]' :
                'text-[#EF4444] border-[rgba(239,68,68,0.4)]')}>
                {Math.round(latestEntry.readinessScore)}
              </div>
              <div>
                <p className="font-semibold text-[#F5F5F5]">Today already logged</p>
                <p className="text-sm text-[#6B6B6B]">Sleep {latestEntry.sleepHours}h · HRV {latestEntry.hrv} · Energy {latestEntry.energy}/10</p>
              </div>
            </div>
          )}

          <div className="glass-panel p-5 space-y-6">
            {/* Sleep */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-[#9A9A9A]">Sleep</label>
                <span className="font-mono tabular-nums text-[#F5F5F5] font-semibold text-sm">{form.sleepHours}h</span>
              </div>
              <input type="range" min={3} max={12} step={0.5} value={form.sleepHours}
                onChange={e => setForm(f => ({ ...f, sleepHours: Number(e.target.value) }))}
                className="w-full h-2 rounded-full" style={{ accentColor: 'var(--accent)' }} />
              <div className="flex justify-between text-xs text-[#6B6B6B]"><span>3h</span><span>12h</span></div>
            </div>

            <SliderField label="Sleep Quality" value={form.sleepQuality} onChange={v => setForm(f => ({ ...f, sleepQuality: v }))} />
            <SliderField label="HRV" value={form.hrv} onChange={v => setForm(f => ({ ...f, hrv: v }))} min={20} max={120} />
            <SliderField label="Energy" value={form.energy} onChange={v => setForm(f => ({ ...f, energy: v }))} />
            <SliderField label="DOMS / Soreness" value={form.doms} onChange={v => setForm(f => ({ ...f, doms: v }))} />
            <SliderField label="Stress Level" value={form.stress} onChange={v => setForm(f => ({ ...f, stress: v }))} />
            <SliderField label="Pelvic Comfort" value={form.pelvicComfort} onChange={v => setForm(f => ({ ...f, pelvicComfort: v }))} />

            {/* Mood */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#9A9A9A]">Mood</label>
              <div className="flex gap-2">
                {MOODS.map((emoji, i) => (
                  <button key={i} onClick={() => setForm(f => ({ ...f, mood: i + 1 }))}
                    className={cn('flex-1 py-2 rounded-lg text-xl border transition-all',
                      form.mood === i + 1 ? 'border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)]' : 'border-[rgba(80,96,128,0.25)]')}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit} disabled={isPending}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {isPending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : <Activity size={18} />}
              {isPending ? 'Saving…' : 'Log Recovery'}
            </button>
          </div>
        </>
      )}

      {/* ── TRENDS TAB ──────────────────────────────────────────── */}
      {tab === 'trends' && (
        <div className="space-y-4">
          {chartData.length === 0 ? (
            <div className="glass-panel p-8 text-center">
              <p className="text-[#6B6B6B]">No recovery history yet. Log your first entry to see trends.</p>
            </div>
          ) : (
            <>
              {/* Readiness Score Line Chart */}
              <div className="glass-panel p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={18} className="text-[#10B981]" />
                  <h3 className="font-semibold text-[#F5F5F5]">Readiness Score</h3>
                  <span className="ml-auto text-xs text-[#6B6B6B]">Last {chartData.length} days</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(80,96,128,0.12)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B6B6B' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#6B6B6B' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="readiness" stroke="#10B981" fill="url(#readinessGrad)" strokeWidth={2} dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Sleep + HRV dual chart */}
              <div className="glass-panel p-5">
                <h3 className="font-semibold text-[#F5F5F5] mb-4">Sleep · HRV Trend</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(80,96,128,0.12)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B6B6B' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="sleep" domain={[0, 12]} tick={{ fontSize: 10, fill: '#6B6B6B' }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="hrv" orientation="right" domain={[0, 120]} tick={{ fontSize: 10, fill: '#6B6B6B' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#6B6B6B' }} />
                    <Line yAxisId="sleep" type="monotone" dataKey="sleep" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }} name="sleep (h)" />
                    <Line yAxisId="hrv" type="monotone" dataKey="hrv" stroke="var(--accent-light)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent-light)', strokeWidth: 0 }} name="HRV" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Energy / Stress / DOMS */}
              <div className="glass-panel p-5">
                <h3 className="font-semibold text-[#F5F5F5] mb-4">Energy · Stress · DOMS</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(80,96,128,0.12)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6B6B6B' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#6B6B6B' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#6B6B6B' }} />
                    <Line type="monotone" dataKey="energy" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="stress" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="doms" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Radar — latest snapshot */}
              {radarData.length > 0 && (
                <div className="glass-panel p-5">
                  <h3 className="font-semibold text-[#F5F5F5] mb-1">Latest Recovery Profile</h3>
                  <p className="text-xs text-[#6B6B6B] mb-4">{latestEntry && formatDisplayDate(latestEntry.date)}</p>
                  <ResponsiveContainer width="100%" height={250}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                      <PolarGrid stroke="rgba(80,96,128,0.2)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#6B6B6B' }} />
                      <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.18} strokeWidth={2} dot={{ r: 4, fill: 'var(--accent)' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
