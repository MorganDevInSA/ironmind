'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useSaveCheckIn, useCheckIns, useProfile } from '@/controllers';
import { today, formatDisplayDate } from '@/lib/utils';
import {
  Scale,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Minus,
  BarChart3,
  Plus,
  Camera,
} from 'lucide-react';

const PHOTO_UPLOAD_ENABLED = process.env.NEXT_PUBLIC_ENABLE_PHOTO_UPLOAD === 'true';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import type { CheckIn, Measurements } from '@/lib/types';

const chartGridStroke = 'color-mix(in srgb, var(--chrome-border) 35%, transparent)';
const measurementSeries: Array<{
  key: keyof Measurements;
  label: string;
  dash?: string;
}> = [
  { key: 'waist', label: 'Waist' },
  { key: 'chest', label: 'Chest', dash: '8 3' },
  { key: 'hips', label: 'Hips', dash: '1 4' },
  { key: 'leftArm', label: 'L arm', dash: '12 3 2 3' },
  { key: 'rightArm', label: 'R arm', dash: '3 3 1 3' },
  { key: 'leftThigh', label: 'L thigh', dash: '2 2 10 2' },
  { key: 'rightThigh', label: 'R thigh', dash: '10 2' },
];

function LegendLineSwatch({ dash }: { dash?: string }) {
  return (
    <svg width={28} height={10} viewBox="0 0 28 10" aria-hidden className="shrink-0">
      <line
        x1="2"
        y1="5"
        x2="26"
        y2="5"
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray={dash ?? '0'}
      />
    </svg>
  );
}

/* ── Tooltip ──────────────────────────────────────────────────── */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[rgba(14,11,11,0.95)] border border-[rgba(65,50,50,0.3)] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-[color:var(--text-2)] mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="font-mono tabular-nums text-[color:var(--text-0)] font-bold">
            {p.value} kg
          </span>
        </div>
      ))}
    </div>
  );
}

function MeasurementTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string; unit?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[rgba(14,11,11,0.95)] border border-[rgba(65,50,50,0.3)] rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-[color:var(--text-2)] mb-1">{label}</p>
      {payload.map((p) => {
        const series = measurementSeries.find((s) => s.label === p.name);
        return (
          <div key={p.name} className="flex items-center gap-2 text-sm">
            <LegendLineSwatch dash={series?.dash} />
            <span className="capitalize text-[color:var(--text-1)]">{p.name}:</span>
            <span className="font-mono tabular-nums text-[color:var(--text-0)] font-bold">
              {p.value} cm
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  unit = '',
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[color:var(--text-1)]">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-[rgba(18,14,14,0.6)] border border-[rgba(65,50,50,0.25)] rounded-lg p-3 text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color-mix(in srgb,var(--accent) 40%,transparent0.4)] pr-12"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[color:var(--text-2)]">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export default function PhysiquePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const {
    mutate: saveCheckIn,
    isPending,
    isSuccess,
    isError,
    error,
    reset,
  } = useSaveCheckIn(userId);
  const { data: checkIns } = useCheckIns(userId);
  const { data: profile } = useProfile(userId);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bodyweight: '',
    waist: '',
    chest: '',
    hips: '',
    leftArm: '',
    rightArm: '',
    leftThigh: '',
    rightThigh: '',
    coachNotes: '',
  });

  const handleSubmit = () => {
    const bodyweight = parseFloat(form.bodyweight);
    if (!Number.isFinite(bodyweight) || bodyweight <= 0) return;
    if (!userId) return;
    const todayStr = today();
    saveCheckIn({
      date: todayStr,
      checkIn: {
        date: todayStr,
        bodyweight,
        measurements: {
          waist: form.waist ? parseFloat(form.waist) : undefined,
          chest: form.chest ? parseFloat(form.chest) : undefined,
          hips: form.hips ? parseFloat(form.hips) : undefined,
          leftArm: form.leftArm ? parseFloat(form.leftArm) : undefined,
          rightArm: form.rightArm ? parseFloat(form.rightArm) : undefined,
          leftThigh: form.leftThigh ? parseFloat(form.leftThigh) : undefined,
          rightThigh: form.rightThigh ? parseFloat(form.rightThigh) : undefined,
        },
        photoUrls: [],
        conditioningScore: 0,
        symmetryNotes: '',
        coachNotes: form.coachNotes,
      },
    });
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-panel p-10 max-w-sm w-full text-center space-y-4">
          <CheckCircle2 size={40} className="text-[color:var(--accent)] mx-auto" />
          <h2 className="text-xl font-bold text-[color:var(--text-0)]">Check-in saved.</h2>
          <button onClick={() => router.push('/dashboard')} className="btn-primary w-full">
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  /* ── Chart data ─────────────────────────────────────────────── */
  const weightData = (checkIns ?? [])
    .slice()
    .reverse()
    .map((c: CheckIn) => ({
      date: formatDisplayDate(c.date).slice(0, 5),
      weight: c.bodyweight,
    }));

  const measurementData = (checkIns ?? [])
    .slice()
    .reverse()
    .map((c: CheckIn) => ({
      date: formatDisplayDate(c.date).slice(0, 5),
      waist: c.measurements?.waist,
      chest: c.measurements?.chest,
      hips: c.measurements?.hips,
      leftArm: c.measurements?.leftArm,
      rightArm: c.measurements?.rightArm,
      leftThigh: c.measurements?.leftThigh,
      rightThigh: c.measurements?.rightThigh,
    }));

  const activeMeasurementSeries = measurementSeries.filter(({ key }) =>
    measurementData.some((d) => d[key as keyof typeof d] !== undefined),
  );
  const hasAnyMeasurements = activeMeasurementSeries.length > 0;

  const lastCheckIn = checkIns?.[0];
  const prevCheckIn = checkIns?.[1];
  const weightDelta =
    lastCheckIn && prevCheckIn ? lastCheckIn.bodyweight - prevCheckIn.bodyweight : null;
  const targetWeight = profile?.targetWeight;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text-2)] mb-1">
            Weekly Check-in
          </p>
          <h1 className="text-2xl font-bold text-[color:var(--accent)]">Physique</h1>
        </div>
        <button
          onClick={() => setShowForm((o) => !o)}
          className="flex items-center gap-2 btn-primary px-4 py-2 text-sm"
        >
          <Plus size={16} /> New Check-in
        </button>
      </div>

      {/* Current stats hero */}
      {lastCheckIn && (
        <div className="glass-panel p-5">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <p className="text-xs text-[color:var(--text-2)] mb-1">Current</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold font-mono tabular-nums text-[color:var(--text-0)]">
                  {lastCheckIn.bodyweight}
                </span>
                <span className="text-sm text-[color:var(--text-2)]">kg</span>
              </div>
            </div>

            {weightDelta !== null && (
              <div
                className={cn(
                  'flex items-center gap-1 text-base font-semibold',
                  weightDelta !== 0 ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-2)]',
                )}
              >
                {weightDelta < 0 ? (
                  <TrendingDown size={18} />
                ) : weightDelta > 0 ? (
                  <TrendingUp size={18} />
                ) : (
                  <Minus size={18} />
                )}
                <span className="font-mono tabular-nums">
                  {weightDelta > 0 ? '+' : ''}
                  {weightDelta.toFixed(1)} kg
                </span>
              </div>
            )}

            {targetWeight && (
              <div className="ml-auto text-right">
                <p className="text-xs text-[color:var(--text-2)] mb-1">Target</p>
                <p className="font-mono tabular-nums font-bold text-[color:var(--text-0)]">
                  {targetWeight} kg
                </p>
                <p className="text-xs font-semibold text-[color:var(--accent)]">
                  {Math.abs(lastCheckIn.bodyweight - targetWeight).toFixed(1)} kg{' '}
                  {lastCheckIn.bodyweight > targetWeight ? 'to lose' : 'to gain'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Check-in form (collapsible) */}
      {showForm && (
        <div className="glass-panel p-5 space-y-5">
          <h3 className="font-semibold text-[color:var(--text-0)] flex items-center gap-2">
            <Scale size={18} className="text-[color:var(--accent)]" /> New Check-in
          </h3>

          {!userId && (
            <p className="text-sm text-[color:var(--accent)] border border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)] rounded-lg px-3 py-2 bg-[color:color-mix(in_srgb,var(--accent)_6%,transparent)]">
              Sign in to save a check-in.
            </p>
          )}

          {isError && (
            <div className="rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.08)] px-3 py-2 text-sm text-[#FECACA] flex flex-col gap-2">
              <p>
                {error instanceof Error ? error.message : 'Could not save check-in. Try again.'}
              </p>
              <button
                type="button"
                onClick={() => reset()}
                className="self-start text-xs font-semibold text-[color:var(--accent)] hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}

          <Field
            label="Bodyweight *"
            value={form.bodyweight}
            onChange={(v) => setForm((f) => ({ ...f, bodyweight: v }))}
            unit="kg"
            placeholder="89.5"
          />

          <div>
            <p className="text-sm font-medium text-[color:var(--text-1)] mb-3">
              Measurements (optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Waist"
                value={form.waist}
                onChange={(v) => setForm((f) => ({ ...f, waist: v }))}
                unit="cm"
              />
              <Field
                label="Chest"
                value={form.chest}
                onChange={(v) => setForm((f) => ({ ...f, chest: v }))}
                unit="cm"
              />
              <Field
                label="Hips"
                value={form.hips}
                onChange={(v) => setForm((f) => ({ ...f, hips: v }))}
                unit="cm"
              />
              <Field
                label="L Arm"
                value={form.leftArm}
                onChange={(v) => setForm((f) => ({ ...f, leftArm: v }))}
                unit="cm"
              />
              <Field
                label="R Arm"
                value={form.rightArm}
                onChange={(v) => setForm((f) => ({ ...f, rightArm: v }))}
                unit="cm"
              />
              <Field
                label="L Thigh"
                value={form.leftThigh}
                onChange={(v) => setForm((f) => ({ ...f, leftThigh: v }))}
                unit="cm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[color:var(--text-1)]">
              Notes (optional)
            </label>
            <textarea
              value={form.coachNotes}
              onChange={(e) => setForm((f) => ({ ...f, coachNotes: e.target.value }))}
              placeholder="How do you look? Any visible changes or comments for your coach AI?"
              rows={3}
              className="w-full bg-[rgba(18,14,14,0.6)] border border-[rgba(65,50,50,0.25)] rounded-lg p-3 text-sm text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color-mix(in srgb,var(--accent) 40%,transparent0.4)] resize-none"
            />
          </div>

          {PHOTO_UPLOAD_ENABLED ? (
            <div className="space-y-1">
              <label className="text-sm font-medium text-[color:var(--text-1)]">
                Progress photos (optional)
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(65,50,50,0.25)] bg-[rgba(18,14,14,0.6)] cursor-pointer hover:border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)] transition-colors">
                <Camera size={16} className="text-[color:var(--accent)] shrink-0" />
                <span className="text-sm text-[color:var(--text-1)]">Tap to add a photo</span>
                <input type="file" accept="image/*" capture="environment" className="sr-only" />
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[rgba(65,50,50,0.15)] bg-[rgba(18,14,14,0.4)]">
              <Camera size={14} className="text-[color:var(--text-2)] shrink-0" />
              <span className="text-xs text-[color:var(--text-2)]">
                Progress photos — coming soon
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending || !form.bodyweight.trim() || !userId}
              className={cn(
                'btn-primary flex-1 flex items-center justify-center gap-2',
                (!form.bodyweight.trim() || isPending || !userId) &&
                  'opacity-50 cursor-not-allowed',
              )}
            >
              {isPending ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
              ) : (
                <Scale size={16} />
              )}
              {isPending ? 'Saving…' : 'Save Check-in'}
            </button>
          </div>
        </div>
      )}

      {/* Weight trend chart */}
      {weightData.length >= 2 && (
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scale size={18} className="text-[color:var(--accent)]" />
            <h3 className="font-semibold text-[color:var(--text-0)]">Weight Trend</h3>
            <span className="ml-auto text-xs text-[color:var(--text-2)]">
              {weightData.length} check-ins
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weightData} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[
                  (dataMin: number) => Math.floor(dataMin - 1),
                  (dataMax: number) => Math.ceil(dataMax + 1),
                ]}
                tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              {targetWeight && (
                <ReferenceLine
                  y={targetWeight}
                  stroke="color-mix(in srgb, var(--accent) 65%, transparent)"
                  strokeDasharray="6 4"
                  label={{
                    value: `Target ${targetWeight}kg`,
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: 'var(--accent)',
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="weight"
                stroke="var(--accent)"
                fill="url(#weightGrad)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--accent)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Measurements chart */}
      {hasAnyMeasurements && (
        <div className="glass-panel p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} className="text-[color:var(--accent)]" />
            <h3 className="font-semibold text-[color:var(--text-0)]">Measurements History</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={measurementData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-2)' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<MeasurementTooltip />} />
              {activeMeasurementSeries.map(({ key, label, dash }) => (
                <Line
                  key={key}
                  type="monotone"
                  name={label}
                  dataKey={key}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  strokeDasharray={dash}
                  dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
                  connectNulls
                  activeDot={{ r: 5, fill: 'var(--accent)' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {activeMeasurementSeries.map(({ key, label, dash }) => (
              <div
                key={key}
                className="flex items-center gap-1.5 text-xs text-[color:var(--text-2)]"
              >
                <LegendLineSwatch dash={dash} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Check-in history table */}
      {checkIns && checkIns.length > 0 && (
        <div className="glass-panel overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgba(65,50,50,0.15)]">
            <h3 className="font-semibold text-[color:var(--text-0)]">History</h3>
          </div>
          <div className="divide-y divide-[rgba(65,50,50,0.1)]">
            {checkIns.slice(0, 10).map((c: CheckIn, i) => {
              const prev = checkIns[i + 1];
              const delta = prev ? c.bodyweight - prev.bodyweight : null;
              return (
                <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-[color:var(--text-0)]">
                      {formatDisplayDate(c.date)}
                    </p>
                    {c.coachNotes && (
                      <p className="text-xs text-[color:var(--text-2)] truncate max-w-[200px] mt-0.5">
                        {c.coachNotes}
                      </p>
                    )}
                    {/* Measurements mini-row */}
                    {c.measurements != null &&
                      Object.values(c.measurements).some(
                        (v) => typeof v === 'number' && Number.isFinite(v),
                      ) && (
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {c.measurements.waist && (
                            <span className="text-[10px] font-mono text-[color:var(--text-2)]">
                              W:{c.measurements.waist}
                            </span>
                          )}
                          {c.measurements.chest && (
                            <span className="text-[10px] font-mono text-[color:var(--text-2)]">
                              Ch:{c.measurements.chest}
                            </span>
                          )}
                          {c.measurements.leftArm && (
                            <span className="text-[10px] font-mono text-[color:var(--text-2)]">
                              A:{c.measurements.leftArm}
                            </span>
                          )}
                        </div>
                      )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono tabular-nums font-bold text-[color:var(--text-0)]">
                      {c.bodyweight} kg
                    </span>
                    {delta !== null && (
                      <p
                        className={cn(
                          'text-xs font-mono tabular-nums',
                          delta !== 0 ? 'text-[color:var(--accent)]' : 'text-[color:var(--text-2)]',
                        )}
                      >
                        {delta > 0 ? '+' : ''}
                        {delta.toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
