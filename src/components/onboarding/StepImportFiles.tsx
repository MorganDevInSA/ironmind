'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { useIsUserSeeded } from '@/controllers';
import {
  parseAndValidateFiles,
  type ImportFile,
  type ParsedCoachData,
} from '@/services/import.service';
import { useImportCoachData, useSeedDemoData } from '@/controllers/use-import';
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
  {
    name: 'athlete_profile.json',
    label: 'Athlete Profile',
    description: 'Age, weight, goals, injury constraints',
  },
  {
    name: 'training_program.json',
    label: 'Training Program',
    description: '14-day rotating cycle with all exercises',
  },
  {
    name: 'nutrition_plan.json',
    label: 'Nutrition Plan',
    description: 'Macro targets by day type + meal schedule',
  },
  {
    name: 'supplement_protocol.json',
    label: 'Supplement Protocol',
    description: 'Supplement windows and timing',
  },
  {
    name: 'volume_landmarks.json',
    label: 'Volume Landmarks',
    description: 'MEV / MAV / MRV per muscle group',
  },
  {
    name: 'phase.json',
    label: 'Current Phase',
    description: 'Training phase with targets and strategy',
  },
];

/** Alternate download names (lowercase) → canonical key in `fileStates` / import pipeline. */
const IMPORT_FILENAME_ALIASES: Record<string, string> = {
  'volume-landmarks.json': 'volume_landmarks.json',
  'volume landmarks.json': 'volume_landmarks.json',
};

/** Last path segment, trim, Unicode-normalize, lowercase; map fullwidth `_` (U+FF3F) to ASCII. */
function normalizeImportBasename(raw: string): string {
  const tail = raw.trim().normalize('NFKC').split(/[/\\]/).pop() ?? raw;
  return tail
    .toLowerCase()
    .replace(/\u0000/g, '')
    .replace(/\uff3f/g, '_');
}

function resolveCanonicalImportFilename(basename: string): string | null {
  if (EXPECTED_FILES.some((f) => f.name === basename)) return basename;
  const alias = IMPORT_FILENAME_ALIASES[basename];
  if (alias) return alias;
  // Windows “double .json” when extensions are hidden
  const deDuped = basename.replace(/\.json\.json$/i, '.json');
  if (deDuped !== basename && EXPECTED_FILES.some((f) => f.name === deDuped)) return deDuped;
  return null;
}

function stripUtf8Bom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** If the disk name is wrong/empty but the JSON is clearly landmarks, still slot this file. */
function looksLikeVolumeLandmarksData(data: unknown): boolean {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) return false;
  const o = data as Record<string, unknown>;
  const chest = o.chest;
  const back = o.back;
  if (chest === null || typeof chest !== 'object' || Array.isArray(chest)) return false;
  if (back === null || typeof back !== 'object' || Array.isArray(back)) return false;
  const c = chest as Record<string, unknown>;
  const b = back as Record<string, unknown>;
  return (
    typeof c.mv === 'number' &&
    typeof c.mev === 'number' &&
    typeof c.mav === 'number' &&
    typeof c.mrv === 'number' &&
    typeof b.mv === 'number' &&
    typeof b.mev === 'number'
  );
}

function countSelectedCoachDomains(data: ParsedCoachData): number {
  let n = 0;
  if (data.athleteProfile) n++;
  if (data.trainingProgram) n++;
  if (data.nutritionPlan) n++;
  if (data.supplementProtocol) n++;
  if (data.phase) n++;
  if (data.volumeLandmarks) n++;
  return n;
}

type FileStatus = 'idle' | 'loaded' | 'error';
interface FileState {
  status: FileStatus;
  content: string | null;
  error: string | null;
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-4 text-sm">
      <span className="text-[color:var(--text-1)] shrink-0">{label}</span>
      <span
        className={cn('text-[color:var(--text-0)] text-right', mono && 'font-mono tabular-nums')}
      >
        {value}
      </span>
    </div>
  );
}

export function StepImportFiles({ onBack }: StepImportFilesProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [fileStates, setFileStates] = useState<Record<string, FileState>>(
    Object.fromEntries(
      EXPECTED_FILES.map((f) => [f.name, { status: 'idle', content: null, error: null }]),
    ),
  );
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(
    null,
  );
  const [subStep, setSubStep] = useState<'upload' | 'confirm' | 'done'>('upload');
  const [parsedData, setParsedData] = useState<ParsedCoachData | null>(null);
  const [overwriteExistingData, setOverwriteExistingData] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const { data: accountAlreadySeeded = false, isPending: seededCheckPending } = useIsUserSeeded(
    userId,
    {
      enabled: subStep === 'confirm' && !!userId,
    },
  );

  const importMutation = useImportCoachData(userId);
  const seedMutation = useSeedDemoData(userId);

  const loadFile = useCallback((file: File) => {
    const basename = normalizeImportBasename(file.name);
    const canonical = resolveCanonicalImportFilename(basename);
    const reader = new FileReader();
    reader.onerror = () => {
      if (!canonical) return;
      setFileStates((prev) => ({
        ...prev,
        [canonical]: { status: 'error', content: null, error: 'Could not read file' },
      }));
    };
    reader.onload = (e) => {
      const raw = e.target?.result as string;
      const content = stripUtf8Bom(raw);
      try {
        const parsed = JSON.parse(content);
        let key = canonical;
        if (!key && looksLikeVolumeLandmarksData(parsed)) {
          key = 'volume_landmarks.json';
        }
        if (!key) return;
        setFileStates((prev) => ({
          ...prev,
          [key]: { status: 'loaded', content, error: null },
        }));
      } catch {
        const errKey =
          canonical ??
          (basename.includes('volume') && basename.includes('landmark')
            ? 'volume_landmarks.json'
            : null);
        if (!errKey) return;
        setFileStates((prev) => ({
          ...prev,
          [errKey]: { status: 'error', content: null, error: 'Invalid JSON' },
        }));
      }
    };
    reader.readAsText(file);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      Array.from(e.target.files ?? []).forEach(loadFile);
      e.target.value = '';
    },
    [loadFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      Array.from(e.dataTransfer.files).forEach(loadFile);
    },
    [loadFile],
  );

  const loadedCount = Object.values(fileStates).filter((s) => s.status === 'loaded').length;
  const hasSelection = loadedCount > 0;

  const handleReview = () => {
    const files: ImportFile[] = EXPECTED_FILES.filter(
      (f) => fileStates[f.name].status === 'loaded',
    ).map((f) => ({ filename: f.name, content: fileStates[f.name].content! }));

    const { data, errors } = parseAndValidateFiles(files);
    if (errors.length > 0) {
      errors.forEach(({ filename, error }) => {
        setFileStates((prev) => ({
          ...prev,
          [filename]: { ...prev[filename], status: 'error', error },
        }));
      });
      return;
    }
    setParsedData(data);
    setSubStep('confirm');
  };

  const handleImport = () => {
    if (!parsedData) return;
    if (accountAlreadySeeded && !overwriteExistingData) return;

    const force = accountAlreadySeeded && overwriteExistingData;
    importMutation.mutate(
      { data: parsedData, force },
      {
        onSuccess: (result) => {
          if (result.success && result.filesImported.length > 0) {
            const n = result.filesImported.length;
            const list = result.filesImported.join(', ');
            setImportResult({
              success: true,
              message:
                n >= EXPECTED_FILES.length
                  ? `${n} files imported successfully.`
                  : `Updated ${n} file${n === 1 ? '' : 's'}: ${list}. Everything else is unchanged.`,
            });
            setSubStep('done');
          } else {
            const msg = result.errors.map((e) => `${e.filename}: ${e.error}`).join(' · ');
            setImportResult({ success: false, message: msg });
          }
        },
        onError: (error) => {
          setImportResult({ success: false, message: String(error) });
        },
      },
    );
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUseDemoData = () => {
    seedMutation.mutate(undefined, {
      onSuccess: (data) => {
        if (data.seeded) {
          setImportResult({ success: true, message: 'Demo data loaded.' });
          setSubStep('done');
        } else {
          setImportResult({
            success: false,
            message: 'Your account already has data — demo seed was skipped.',
          });
        }
      },
      onError: (error) => {
        setImportResult({ success: false, message: String(error) });
      },
    });
  };

  /* ── Done ─────────────────────────────────────────────────── */
  if (subStep === 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-4">
        <div
          className="rounded-[14px] p-10 max-w-md w-full text-center space-y-6
          bg-[rgba(18,14,14,0.94)] border border-[rgba(65,50,50,0.40)]
          shadow-[0_16px_40px_rgba(0,0,0,0.60)]"
        >
          <div className="w-16 h-16 rounded-full bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color:color-mix(in_srgb,var(--accent)_38%,transparent)] flex items-center justify-center mx-auto">
            <CheckCircle2 size={32} className="text-[color:var(--accent-light)]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[color:var(--text-0)] mb-2">
              You&apos;re set up.
            </h2>
            <p className="text-[color:var(--text-1)]">{importResult?.message}</p>
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
    const domainCount = countSelectedCoachDomains(parsedData);
    const isPartialSelection = domainCount < EXPECTED_FILES.length;
    return (
      <div className="flex flex-col gap-7 py-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">
            Step 6 of 6
          </span>
          <h2 className="mt-2 text-2xl font-bold font-heading tracking-tight text-[color:var(--text-0)]">
            Review Your Plan
          </h2>
        </div>

        {isPartialSelection ? (
          <p className="text-sm text-[color:var(--text-1)] leading-relaxed rounded-lg border border-[color:color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)] px-4 py-3">
            <strong className="text-[color:var(--text-0)]">Partial import.</strong> Only the domains
            listed below will be written. Your other IronMind data (anything you did not upload
            here) stays as-is.
          </p>
        ) : null}

        <div
          className="rounded-[14px] p-6 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
          shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex flex-col gap-3"
        >
          {p && (
            <>
              <Row label="Phase" value={p.currentPhase} />
              <Row label="Current weight" value={`${p.currentWeight} kg → ${p.targetWeight} kg`} />
              <Row label="Goal" value={p.primaryGoal} />
            </>
          )}
          {parsedData.trainingProgram && (
            <Row
              label="Program"
              value={`${parsedData.trainingProgram.name} · ${parsedData.trainingProgram.cycleLengthDays}-day cycle`}
            />
          )}
          {parsedData.nutritionPlan && (
            <Row
              label="Protein target"
              value={`${parsedData.nutritionPlan.proteinTarget}g / day`}
              mono
            />
          )}
          {parsedData.supplementProtocol && (
            <Row
              label="Supplement protocol"
              value={`${parsedData.supplementProtocol.windows.length} timing windows`}
            />
          )}
          {parsedData.phase && (
            <Row label="Training phase (import)" value={parsedData.phase.name} />
          )}
          {parsedData.volumeLandmarks && (
            <Row label="Volume landmarks" value="Loaded for all 8 muscle groups" />
          )}
        </div>

        {accountAlreadySeeded && (
          <label
            className="flex items-start gap-3 p-4 rounded-xl border border-[color:color-mix(in_srgb,var(--warn)_35%,transparent)]
            bg-[color:color-mix(in_srgb,var(--warn)_8%,transparent)] cursor-pointer"
          >
            <input
              type="checkbox"
              checked={overwriteExistingData}
              onChange={(e) => setOverwriteExistingData(e.target.checked)}
              className="mt-1 rounded border-[rgba(65,50,50,0.5)]"
              style={{ accentColor: 'var(--accent)' }}
            />
            <span className="text-sm text-[color:var(--text-0)]">
              <span className="font-semibold text-[color:var(--warn)]">
                Allow import to update my saved data
              </span>
              {' — '}
              Required when you already have a plan in IronMind. Applies only to the files you
              selected above (e.g. a revised nutrition plan); everything you did not upload stays
              unchanged.
            </span>
          </label>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              setOverwriteExistingData(false);
              setSubStep('upload');
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[color:var(--text-1)]
              bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
              hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[color:var(--text-0)]
              active:scale-95 transition-all duration-200"
          >
            <RotateCcw size={16} /> Back
          </button>
          <button
            onClick={handleImport}
            disabled={
              importMutation.isPending ||
              seededCheckPending ||
              (accountAlreadySeeded && !overwriteExistingData)
            }
            className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-white
              bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
              shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_22%,transparent)]
              hover:brightness-110 active:scale-95 transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {importMutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />{' '}
                Importing…
              </>
            ) : (
              <>
                <CheckCircle2 size={18} /> Confirm &amp; Import
              </>
            )}
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
          Step 6 of 6
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-heading tracking-tight text-[color:var(--text-0)]">
          Import Your Data Pack
        </h2>
        <p className="mt-2 text-sm text-[color:var(--text-1)]">
          Upload one or more coach JSON files (full pack is six). Use a partial import to replace
          just nutrition, program, landmarks, etc. Works from phone, tablet, or desktop.
        </p>
      </div>

      {/* Icon header */}
      <div className="flex justify-center">
        <div
          className="w-14 h-14 rounded-2xl bg-[color:var(--surface-track)] border border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)]
          flex items-center justify-center"
        >
          <Dumbbell size={28} className="text-[color:var(--accent)]" />
        </div>
      </div>

      {/* Bulk drop zone — required for multi-select / drag-all-six; slots below handle one file each. */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          'rounded-2xl border-2 border-dashed p-6 text-center transition-all',
          isDragging
            ? 'border-[color:var(--accent)] bg-[color:var(--surface-track)]'
            : 'border-[color:var(--chrome-border)] bg-[color:var(--surface-well)]',
        )}
      >
        <label htmlFor="bulk-upload" className="cursor-pointer block space-y-2">
          <Upload size={24} className="mx-auto text-[color:var(--text-2)]" />
          <p className="text-sm text-[color:var(--text-1)]">
            <span className="font-semibold text-[color:var(--text-0)]">
              Tap to select files (or all six at once)
            </span>{' '}
            or drag them here
          </p>
          <p className="text-xs text-[color:var(--text-2)]">
            {loadedCount} / {EXPECTED_FILES.length} selected for import
          </p>
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

      {/* Individual file slots — use index-based input ids (no `.` in id) so label→input works everywhere. */}
      <div className="flex flex-col gap-2">
        {EXPECTED_FILES.map((file, slotIndex) => {
          const state = fileStates[file.name];
          const slotInputId = `import-coach-slot-${slotIndex}`;
          return (
            <label
              key={file.name}
              htmlFor={slotInputId}
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all select-none',
                state.status === 'loaded'
                  ? 'border-[color:color-mix(in_srgb,var(--accent)_40%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]'
                  : state.status === 'error'
                    ? 'border-[color:color-mix(in_srgb,var(--bad)_35%,transparent)] bg-[color:color-mix(in_srgb,var(--bad)_6%,transparent)]'
                    : 'border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] hover:border-[color:color-mix(in_srgb,var(--accent)_30%,transparent)] active:scale-[0.99]',
              )}
            >
              <input
                id={slotInputId}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={handleFileInput}
              />
              <div className="shrink-0">
                {state.status === 'loaded' ? (
                  <CheckCircle2 size={22} className="text-[color:var(--accent-light)]" />
                ) : state.status === 'error' ? (
                  <XCircle size={22} className="text-[color:var(--accent-light)]" />
                ) : (
                  <FileJson size={22} className="text-[color:var(--text-2)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[color:var(--text-0)]">{file.label}</p>
                <p className="text-xs text-[color:var(--text-2)] truncate">
                  {state.error ?? (state.status === 'loaded' ? file.name : file.description)}
                </p>
              </div>
              <span
                className={cn(
                  'shrink-0 text-xs font-bold uppercase tracking-wider',
                  state.status === 'loaded'
                    ? 'text-[color:var(--accent-light)]'
                    : state.status === 'error'
                      ? 'text-[color:var(--accent-light)]'
                      : 'text-[color:var(--text-2)]',
                )}
              >
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
          disabled={!hasSelection}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white',
            'bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]',
            'shadow-[0_12px_22px_color-mix(in srgb, var(--accent) 25%, transparent)]',
            'hover:brightness-110 active:scale-95 transition-all duration-200',
            !hasSelection && 'opacity-40 cursor-not-allowed',
          )}
        >
          Review selected <ArrowRight size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[rgba(65,50,50,0.40)]" />
          <span className="text-xs text-[color:var(--text-2)]">or</span>
          <div className="flex-1 h-px bg-[rgba(65,50,50,0.40)]" />
        </div>

        <button
          onClick={() => setDemoModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-[color:var(--text-1)]
            bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
            hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[color:var(--text-0)]
            active:scale-95 transition-all duration-200"
        >
          <Users size={15} />
          Choose a demo profile instead
        </button>
        <p className="text-xs text-center text-[color:var(--text-2)]">
          Explore with a pre-built plan. Replace with your own data any time from Settings.
        </p>
      </div>

      <DemoProfileModal open={demoModalOpen} onClose={() => setDemoModalOpen(false)} />

      {/* Back nav */}
      <div className="flex">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-[color:var(--text-1)]
            bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
            hover:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] hover:text-[color:var(--text-0)]
            active:scale-95 transition-all duration-200"
        >
          <ArrowLeft size={15} />
          Back
        </button>
      </div>
    </div>
  );
}
