'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import {
  parseAndValidateFiles,
  importCoachData,
  type ImportFile,
  type ParsedCoachData,
} from '@/services/import.service';
import { seedUserData } from '@/lib/seed';
import {
  Upload,
  CheckCircle2,
  XCircle,
  FileJson,
  ArrowRight,
  RotateCcw,
  Dumbbell,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EXPECTED_FILES = [
  { name: 'athlete_profile.json',     label: 'Athlete Profile',      description: 'Age, weight, goals, injury constraints' },
  { name: 'training_program.json',    label: 'Training Program',     description: '14-day rotating cycle with all exercises' },
  { name: 'nutrition_plan.json',      label: 'Nutrition Plan',       description: 'Macro targets by day type + meal schedule' },
  { name: 'supplement_protocol.json', label: 'Supplement Protocol',  description: 'Supplement windows and timing' },
  { name: 'phase.json',               label: 'Current Phase',        description: 'Training phase with targets and strategy' },
  { name: 'volume_landmarks.json',    label: 'Volume Landmarks',     description: 'MEV / MAV / MRV per muscle group' },
];

type FileStatus = 'idle' | 'loaded' | 'error';
interface FileState { status: FileStatus; content: string | null; error: string | null; }

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const [fileStates, setFileStates] = useState<Record<string, FileState>>(
    Object.fromEntries(EXPECTED_FILES.map(f => [f.name, { status: 'idle', content: null, error: null }]))
  );
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [step, setStep] = useState<'upload' | 'confirm' | 'done'>('upload');
  const [parsedData, setParsedData] = useState<ParsedCoachData | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const loadFile = useCallback((file: File) => {
    const name = file.name.toLowerCase();
    if (!EXPECTED_FILES.find(f => f.name === name)) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      try {
        JSON.parse(content);
        setFileStates(prev => ({ ...prev, [name]: { status: 'loaded', content, error: null } }));
      } catch {
        setFileStates(prev => ({ ...prev, [name]: { status: 'error', content: null, error: 'Invalid JSON' } }));
      }
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(loadFile);
    e.target.value = '';
  }, [loadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach(loadFile);
  }, [loadFile]);

  const loadedCount = Object.values(fileStates).filter(s => s.status === 'loaded').length;
  const allLoaded = loadedCount === EXPECTED_FILES.length;

  const handleReview = () => {
    const files: ImportFile[] = EXPECTED_FILES
      .filter(f => fileStates[f.name].status === 'loaded')
      .map(f => ({ filename: f.name, content: fileStates[f.name].content! }));

    const { data, errors } = parseAndValidateFiles(files);

    if (errors.length > 0) {
      errors.forEach(({ filename, error }) => {
        setFileStates(prev => ({ ...prev, [filename]: { ...prev[filename], status: 'error', error } }));
      });
      return;
    }
    setParsedData(data);
    setStep('confirm');
  };

  const handleImport = async () => {
    if (!parsedData) return;
    setImporting(true);
    try {
      const result = await importCoachData(userId, parsedData);
      if (result.success) {
        setImportResult({ success: true, message: `${result.filesImported.length} files imported successfully.` });
        setStep('done');
      } else {
        const msg = result.errors.map(e => `${e.filename}: ${e.error}`).join(' · ');
        setImportResult({ success: false, message: msg });
      }
    } catch (e) {
      setImportResult({ success: false, message: String(e) });
    } finally {
      setImporting(false);
    }
  };

  const handleUseDemoData = async () => {
    setImporting(true);
    try {
      await seedUserData(userId);
      setImportResult({ success: true, message: 'Demo data loaded.' });
      setStep('done');
    } catch (e) {
      setImportResult({ success: false, message: String(e) });
    } finally {
      setImporting(false);
    }
  };

  /* ── Done ─────────────────────────────────────────────────── */
  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel p-10 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.35)] flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-[#10B981]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F5F5F5] mb-2">You&apos;re set up.</h1>
            <p className="text-[#7F91AD]">{importResult?.message}</p>
          </div>
          <button onClick={() => router.push('/dashboard')} className="btn-primary w-full flex items-center justify-center gap-2">
            Go to Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Confirm ──────────────────────────────────────────────── */
  if (step === 'confirm' && parsedData) {
    const p = parsedData.athleteProfile;
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-panel p-8 max-w-lg w-full space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7F91AD] mb-1">Ready to import</p>
            <h1 className="text-2xl font-bold text-[#F5F5F5]">Review Your Plan</h1>
          </div>

          <div className="space-y-3">
            {p && (
              <>
                <Row label="Phase" value={p.currentPhase} />
                <Row label="Current weight" value={`${p.currentWeight} kg → ${p.targetWeight} kg`} />
                <Row label="Goal" value={p.primaryGoal} />
              </>
            )}
            {parsedData.trainingProgram && (
              <Row label="Program" value={`${parsedData.trainingProgram.name} · ${parsedData.trainingProgram.cycleLengthDays}-day cycle`} />
            )}
            {parsedData.nutritionPlan && (
              <Row label="Protein target" value={`${parsedData.nutritionPlan.proteinTarget}g / day`} mono />
            )}
            {parsedData.volumeLandmarks && (
              <Row label="Volume landmarks" value="Loaded for all 8 muscle groups" />
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep('upload')} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={16} /> Back
            </button>
            <button onClick={handleImport} disabled={importing} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {importing
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Importing…</>
                : <><CheckCircle2 size={18} /> Confirm & Import</>}
            </button>
          </div>
          {importResult && !importResult.success && (
            <p className="text-sm text-[#EF4444]">{importResult.message}</p>
          )}
        </div>
      </div>
    );
  }

  /* ── Upload ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto space-y-8">

      <div className="text-center space-y-3 pt-10">
        <div className="w-14 h-14 rounded-2xl bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.35)] flex items-center justify-center mx-auto">
          <Dumbbell size={28} className="text-[#D4AF37]" />
        </div>
        <h1 className="text-3xl font-bold text-[#F5F5F5]">Load Your Plan</h1>
        <p className="text-[#7F91AD] max-w-sm mx-auto text-sm">
          Upload the 6 JSON files your coaching AI generated. Works from phone, tablet, or desktop.
        </p>
      </div>

      {/* Bulk drop zone + multi-file input */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          'rounded-2xl border-2 border-dashed p-6 text-center transition-all',
          isDragging
            ? 'border-[#D4AF37] bg-[rgba(212,175,55,0.08)]'
            : 'border-[rgba(80,96,128,0.35)] bg-[rgba(16,22,34,0.4)]'
        )}
      >
        <label htmlFor="bulk-upload" className="cursor-pointer block space-y-2">
          <Upload size={24} className="mx-auto text-[#7F91AD]" />
          <p className="text-sm text-[#7F91AD]">
            <span className="font-semibold text-[#B8C6DE]">Tap to select all 6 files at once</span>
            {' '}or drag them here
          </p>
          <p className="text-xs text-[#7F91AD]/60">{loadedCount} / {EXPECTED_FILES.length} loaded</p>
          <input
            id="bulk-upload"
            type="file"
            accept=".json,application/json"
            multiple
            className="sr-only"
            onChange={handleFileInput}
          />
        </label>
      </div>

      {/* Individual file slots */}
      <div className="space-y-2">
        {EXPECTED_FILES.map((file) => {
          const state = fileStates[file.name];
          return (
            <label
              key={file.name}
              htmlFor={`slot-${file.name}`}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all select-none',
                state.status === 'loaded'
                  ? 'border-[rgba(16,185,129,0.35)] bg-[rgba(16,185,129,0.06)]'
                  : state.status === 'error'
                  ? 'border-[rgba(239,68,68,0.35)] bg-[rgba(239,68,68,0.06)]'
                  : 'border-[rgba(80,96,128,0.25)] bg-[rgba(16,22,34,0.4)] hover:border-[rgba(212,175,55,0.3)] active:scale-[0.99]'
              )}
            >
              <input id={`slot-${file.name}`} type="file" accept=".json,application/json" className="sr-only" onChange={handleFileInput} />
              <div className="shrink-0">
                {state.status === 'loaded'
                  ? <CheckCircle2 size={22} className="text-[#10B981]" />
                  : state.status === 'error'
                  ? <XCircle size={22} className="text-[#EF4444]" />
                  : <FileJson size={22} className="text-[#7F91AD]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#F5F5F5]">{file.label}</p>
                <p className="text-xs text-[#7F91AD] truncate">
                  {state.error ?? (state.status === 'loaded' ? file.name : file.description)}
                </p>
              </div>
              <span className={cn(
                'shrink-0 text-xs font-bold uppercase tracking-wider',
                state.status === 'loaded' ? 'text-[#10B981]' : state.status === 'error' ? 'text-[#EF4444]' : 'text-[#7F91AD]'
              )}>
                {state.status === 'loaded' ? '✓' : state.status === 'error' ? 'Fix' : 'Pick'}
              </span>
            </label>
          );
        })}
      </div>

      {/* CTA */}
      <div className="space-y-3 pb-10">
        <button
          onClick={handleReview}
          disabled={!allLoaded}
          className={cn('btn-primary w-full flex items-center justify-center gap-2', !allLoaded && 'opacity-40 cursor-not-allowed')}
        >
          Review & Import <ArrowRight size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[rgba(80,96,128,0.25)]" />
          <span className="text-xs text-[#7F91AD]">or</span>
          <div className="flex-1 h-px bg-[rgba(80,96,128,0.25)]" />
        </div>

        <button
          onClick={handleUseDemoData}
          disabled={importing}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          {importing
            ? <span className="w-4 h-4 border-2 border-[#7F91AD]/30 border-t-[#7F91AD] rounded-full animate-spin inline-block" />
            : 'Load demo data instead'}
        </button>
        <p className="text-xs text-center text-[#7F91AD]/60">
          Demo loads Morgan&apos;s plan. Re-import your own files any time from Settings.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-[#7F91AD] shrink-0">{label}</span>
      <span className={cn('text-[#F5F5F5] text-right', mono && 'font-mono tabular-nums')}>{value}</span>
    </div>
  );
}
