'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useIsUserSeeded } from '@/controllers';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/query-keys';
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
  ArrowLeft,
  RotateCcw,
  Dumbbell,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoProfileModal } from './DemoProfileModal';

interface StepImportFilesProps {
  onBack: () => void;
}

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

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-[#7F91AD] shrink-0">{label}</span>
      <span className={cn('text-[#F5F5F5] text-right', mono && 'font-mono tabular-nums')}>{value}</span>
    </div>
  );
}

export function StepImportFiles({ onBack }: StepImportFilesProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [fileStates, setFileStates] = useState<Record<string, FileState>>(
    Object.fromEntries(EXPECTED_FILES.map(f => [f.name, { status: 'idle', content: null, error: null }]))
  );
  const [isDragging, setIsDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [subStep, setSubStep] = useState<'upload' | 'confirm' | 'done'>('upload');
  const [parsedData, setParsedData] = useState<ParsedCoachData | null>(null);
  const [overwriteExistingData, setOverwriteExistingData] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const { data: accountAlreadySeeded = false, isPending: seededCheckPending } = useIsUserSeeded(userId, {
    enabled: subStep === 'confirm' && !!userId,
  });

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
    setSubStep('confirm');
  };

  const handleImport = async () => {
    if (!parsedData) return;
    if (accountAlreadySeeded && !overwriteExistingData) return;
    setImporting(true);
    try {
      const force = accountAlreadySeeded && overwriteExistingData;
      const result = await importCoachData(userId, parsedData, force);
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: queryKeys(userId).profile.all });
        setImportResult({ success: true, message: `${result.filesImported.length} files imported successfully.` });
        setSubStep('done');
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
      setSubStep('done');
    } catch (e) {
      setImportResult({ success: false, message: String(e) });
    } finally {
      setImporting(false);
    }
  };

  /* ── Done ─────────────────────────────────────────────────── */
  if (subStep === 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-4">
        <div className="rounded-[14px] p-10 max-w-md w-full text-center space-y-6
          bg-[rgba(18,14,14,0.94)] border border-[rgba(65,50,50,0.40)]
          shadow-[0_16px_40px_rgba(0,0,0,0.60)]">
          <div className="w-16 h-16 rounded-full bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.35)] flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-[#10B981]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-2">You&apos;re set up.</h2>
            <p className="text-[#9A9A9A]">{importResult?.message}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white
              bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
              shadow-[0_12px_22px_color-mix(in srgb, var(--accent) 25%, transparent)]
              hover:brightness-110 active:scale-95 transition-all duration-200"
          >
            Go to Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  /* ── Confirm ──────────────────────────────────────────────── */
  if (subStep === 'confirm' && parsedData) {
    const p = parsedData.athleteProfile;
    return (
      <div className="flex flex-col gap-7 py-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">Step 5 of 5</span>
          <h2 className="mt-2 text-2xl font-bold font-heading tracking-tight text-[#F0F0F0]">Review Your Plan</h2>
        </div>

        <div className="rounded-[14px] p-6 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
          shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex flex-col gap-3">
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

        {accountAlreadySeeded && (
          <label className="flex items-start gap-3 p-4 rounded-xl border border-[rgba(245,158,11,0.35)]
            bg-[rgba(245,158,11,0.08)] cursor-pointer">
            <input
              type="checkbox"
              checked={overwriteExistingData}
              onChange={(e) => setOverwriteExistingData(e.target.checked)}
              className="mt-1 rounded border-[rgba(80,96,128,0.5)]"
            />
            <span className="text-sm text-[#F5F5F5]">
              <span className="font-semibold text-[#F59E0B]">Replace existing IronMind data</span>
              {' — '}
              Your account already has a saved plan. Check this to import this coach pack and set it as your
              active program (profile, supplements, phase, landmarks, and today&apos;s nutrition targets update accordingly).
            </span>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => { setOverwriteExistingData(false); setSubStep('upload'); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[#9A9A9A]
              bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
              hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[#F0F0F0]
              active:scale-95 transition-all duration-200"
          >
            <RotateCcw size={16} /> Back
          </button>
          <button
            onClick={handleImport}
            disabled={importing || seededCheckPending || (accountAlreadySeeded && !overwriteExistingData)}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-white
              bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
              shadow-[0_8px_20px_rgba(220,38,38,0.22)]
              hover:brightness-110 active:scale-95 transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importing
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Importing…</>
              : <><CheckCircle2 size={18} /> Confirm &amp; Import</>}
          </button>
        </div>

        {importResult && !importResult.success && (
          <p className="text-sm text-[color:var(--accent-light)]">{importResult.message}</p>
        )}
      </div>
    );
  }

  /* ── Upload ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col gap-7 py-4">
      {/* Heading */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">
          Step 5 of 5
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-heading tracking-tight text-[#F0F0F0]">
          Import Your Data Pack
        </h2>
        <p className="mt-2 text-sm text-[#9A9A9A]">
          Upload the 6 JSON files your AI generated. Works from phone, tablet, or desktop.
        </p>
      </div>

      {/* Icon header */}
      <div className="flex justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[rgba(220,38,38,0.30)]
          flex items-center justify-center">
          <Dumbbell size={28} className="text-[color:var(--accent)]" />
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          'rounded-2xl border-2 border-dashed p-6 text-center transition-all',
          isDragging
            ? 'border-[color:var(--accent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)]'
            : 'border-[rgba(65,50,50,0.40)] bg-[rgba(16,14,14,0.4)]'
        )}
      >
        <label htmlFor="bulk-upload" className="cursor-pointer block space-y-2">
          <Upload size={24} className="mx-auto text-[#5E5E5E]" />
          <p className="text-sm text-[#9A9A9A]">
            <span className="font-semibold text-[#F0F0F0]">Tap to select all 6 files at once</span>
            {' '}or drag them here
          </p>
          <p className="text-xs text-[#5E5E5E]">{loadedCount} / {EXPECTED_FILES.length} loaded</p>
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
      <div className="flex flex-col gap-2">
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
                  : 'border-[rgba(65,50,50,0.30)] bg-[rgba(18,14,14,0.5)] hover:border-[rgba(220,38,38,0.30)] active:scale-[0.99]'
              )}
            >
              <input id={`slot-${file.name}`} type="file" accept=".json,application/json" className="sr-only" onChange={handleFileInput} />
              <div className="shrink-0">
                {state.status === 'loaded'
                  ? <CheckCircle2 size={22} className="text-[#10B981]" />
                  : state.status === 'error'
                  ? <XCircle size={22} className="text-[color:var(--accent-light)]" />
                  : <FileJson size={22} className="text-[#5E5E5E]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#F0F0F0]">{file.label}</p>
                <p className="text-xs text-[#5E5E5E] truncate">
                  {state.error ?? (state.status === 'loaded' ? file.name : file.description)}
                </p>
              </div>
              <span className={cn(
                'shrink-0 text-xs font-bold uppercase tracking-wider',
                state.status === 'loaded' ? 'text-[#10B981]' : state.status === 'error' ? 'text-[color:var(--accent-light)]' : 'text-[#5E5E5E]'
              )}>
                {state.status === 'loaded' ? '✓' : state.status === 'error' ? 'Fix' : 'Pick'}
              </span>
            </label>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-3 pb-4">
        <button
          onClick={handleReview}
          disabled={!allLoaded}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white',
            'bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]',
            'shadow-[0_12px_22px_color-mix(in srgb, var(--accent) 25%, transparent)]',
            'hover:brightness-110 active:scale-95 transition-all duration-200',
            !allLoaded && 'opacity-40 cursor-not-allowed'
          )}
        >
          Review &amp; Import <ArrowRight size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[rgba(65,50,50,0.40)]" />
          <span className="text-xs text-[#5E5E5E]">or</span>
          <div className="flex-1 h-px bg-[rgba(65,50,50,0.40)]" />
        </div>

        <button
          onClick={() => setDemoModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-[#9A9A9A]
            bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
            hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[#F0F0F0]
            active:scale-95 transition-all duration-200"
        >
          <Users size={15} />
          Choose a demo profile instead
        </button>
        <p className="text-xs text-center text-[#5E5E5E]">
          Explore with a pre-built plan. Replace with your own data any time from Settings.
        </p>
      </div>

      <DemoProfileModal open={demoModalOpen} onClose={() => setDemoModalOpen(false)} />

      {/* Back nav */}
      <div className="flex">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[#9A9A9A]
            bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
            hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[#F0F0F0]
            active:scale-95 transition-all duration-200"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>
    </div>
  );
}
