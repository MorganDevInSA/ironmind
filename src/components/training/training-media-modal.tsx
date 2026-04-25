'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Headphones, X, Dumbbell, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  formatIronVibesTitle,
  openYouTubeInNewTab,
  sanitizeYouTubeUrl,
  trainingPresetUrlMatches,
  TRAINING_YOUTUBE_PRESETS,
} from '@/lib/youtube-url';

export type TrainingMediaResult = { youtubeUrl: string | null };

type Props = {
  open: boolean;
  sessionTitle?: string;
  /**
   * Persisted `UserData.lastWorkoutYouTubeUrl`: `undefined` = do not pre-fill from server;
   * `null` = user previously chose skip; `string` = last canonical YouTube URL.
   */
  initialLastYouTubeUrl?: string | null;
  onClose: () => void;
  /** Called after optional tab open; parent should navigate to workout. */
  onContinue: (result: TrainingMediaResult) => void;
};

function openYouTubeWithToasts(url: string): void {
  const r = openYouTubeInNewTab(url);
  if (r === 'blocked') {
    toast.error('Popup blocked — allow pop-ups for this site to open YouTube.');
  }
  if (r === 'invalid') {
    toast.error('That link is not a valid YouTube URL.');
  }
}

export function TrainingMediaModal({
  open,
  sessionTitle,
  initialLastYouTubeUrl,
  onClose,
  onContinue,
}: Props) {
  const headingId = useId();
  const descId = useId();
  const previewHeadingId = useId();
  const previewDescId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previewPanelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<Element | null>(null);
  const didSeedFromPersistence = useRef(false);

  const [choice, setChoice] = useState<string | 'custom' | null>(null);
  const [customDraft, setCustomDraft] = useState('');
  const [customError, setCustomError] = useState('');
  const [previewPresetId, setPreviewPresetId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setChoice(null);
    setCustomDraft('');
    setCustomError('');
    setPreviewPresetId(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  const closePreviewOnly = useCallback(() => {
    setPreviewPresetId(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    prevFocus.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => {
      if (previewPresetId) previewPanelRef.current?.focus();
      else panelRef.current?.focus();
    });
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, previewPresetId]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  useEffect(() => {
    if (!open) {
      didSeedFromPersistence.current = false;
      return;
    }
    if (didSeedFromPersistence.current) return;
    if (initialLastYouTubeUrl === undefined || initialLastYouTubeUrl === null) return;
    const safe = sanitizeYouTubeUrl(initialLastYouTubeUrl);
    if (!safe) return;
    didSeedFromPersistence.current = true;
    const preset = TRAINING_YOUTUBE_PRESETS.find((p) => trainingPresetUrlMatches(safe, p.url));
    if (preset) {
      setChoice(preset.id);
    } else {
      setChoice('custom');
      setCustomDraft(safe);
    }
  }, [open, initialLastYouTubeUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (previewPresetId) {
        e.stopPropagation();
        closePreviewOnly();
      } else {
        handleClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, previewPresetId, closePreviewOnly, handleClose]);

  useEffect(() => {
    if (!open && prevFocus.current instanceof HTMLElement) {
      prevFocus.current.focus();
    }
  }, [open]);

  const finish = useCallback(
    (youtubeUrl: string | null, openInBrowser: boolean) => {
      if (youtubeUrl && openInBrowser) {
        openYouTubeWithToasts(youtubeUrl);
      }
      onContinue({ youtubeUrl });
      reset();
    },
    [onContinue, reset],
  );

  const handlePrimary = () => {
    setCustomError('');
    if (choice && choice !== 'custom') {
      const preset = TRAINING_YOUTUBE_PRESETS.find((p) => p.id === choice);
      if (preset) {
        // Tab was already opened from preview “Proceed”.
        finish(preset.url, false);
      }
      return;
    }
    if (choice === 'custom') {
      const safe = sanitizeYouTubeUrl(customDraft);
      if (!safe) {
        setCustomError('Enter a valid https YouTube watch or playlist URL.');
        return;
      }
      finish(safe, true);
      return;
    }
    setCustomError('Pick a mix (confirm in preview), custom URL, or skip.');
  };

  const previewPreset = previewPresetId
    ? TRAINING_YOUTUBE_PRESETS.find((p) => p.id === previewPresetId)
    : undefined;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-sm cursor-default border-0 p-0"
        aria-label="Close dialog"
        onClick={handleClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative w-full sm:max-w-2xl mx-0 sm:mx-4 glass-panel rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-hidden flex flex-col border border-[color:var(--chrome-border)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-1)]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[color:var(--chrome-border-subtle)] shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-[color:var(--accent)] shrink-0 mt-0.5">
              <Headphones size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--accent)]">
                Session audio / video
              </p>
              <h2
                id={headingId}
                className="text-lg font-bold text-[color:var(--text-0)] leading-snug truncate"
              >
                {sessionTitle ?? 'Training media'}
              </h2>
              <p id={descId} className="text-xs text-[color:var(--text-detail)] mt-1">
                Optional for any session type (lift, cardio, recovery). Tap a mix for a short
                summary, then confirm to open YouTube in a new tab. Custom URLs must stay on
                YouTube. Skip if you want silence.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-[color:var(--text-1)] hover:text-[color:var(--text-0)] hover:bg-[color:var(--surface-track)] shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--text-2)]">
            IronVibes mixes
          </p>
          <ul className="space-y-2">
            {TRAINING_YOUTUBE_PRESETS.map((p) => {
              const selected = choice === p.id;
              const displayTitle = formatIronVibesTitle(p.playlistName);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomError('');
                      setPreviewPresetId(p.id);
                    }}
                    className={cn(
                      'w-full text-left rounded-xl border px-4 py-3 transition-colors',
                      selected
                        ? 'border-[color:color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]'
                        : 'border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] hover:border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)]',
                    )}
                  >
                    <span className="font-semibold text-[color:var(--text-0)]">{displayTitle}</span>
                    <span className="block text-xs text-[color:var(--text-detail)] mt-0.5">
                      YouTube · tap for summary
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setChoice('custom');
                setCustomError('');
                setPreviewPresetId(null);
              }}
              className={cn(
                'w-full text-left rounded-xl border px-4 py-3 transition-colors flex items-start gap-2',
                choice === 'custom'
                  ? 'border-[color:color-mix(in_srgb,var(--accent)_55%,transparent)] bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)]'
                  : 'border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] hover:border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)]',
              )}
            >
              <Link2 size={18} className="text-[color:var(--accent)] shrink-0 mt-0.5" aria-hidden />
              <span>
                <span className="font-semibold text-[color:var(--text-0)]">Custom YouTube URL</span>
                <span className="block text-xs text-[color:var(--text-detail)] mt-0.5">
                  Paste a watch or playlist link (https only). Opens when you start the workout.
                </span>
              </span>
            </button>
            {choice === 'custom' && (
              <div className="rounded-xl border border-[color:var(--chrome-border-subtle)] bg-[color:var(--surface-well)] p-3 space-y-2">
                <label
                  className="text-xs font-medium text-[color:var(--text-1)]"
                  htmlFor="training-yt-custom"
                >
                  URL
                </label>
                <input
                  id="training-yt-custom"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={customDraft}
                  onChange={(e) => {
                    setCustomDraft(e.target.value);
                    setCustomError('');
                  }}
                  placeholder="https://www.youtube.com/watch?…"
                  className="w-full rounded-lg border border-[color:var(--chrome-border)] bg-[color:var(--bg-1)] px-3 py-2 text-sm text-[color:var(--text-0)] placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_45%,transparent)]"
                />
                {customError && (
                  <p className="text-xs text-[color:var(--bad)]" role="alert">
                    {customError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-4 border-t border-[color:var(--chrome-border-subtle)] shrink-0 bg-[color:var(--surface-well)]">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[color:var(--text-detail)] border border-[color:var(--chrome-border)] hover:bg-[color:var(--surface-track)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => finish(null, false)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-[color:var(--chrome-border)] text-[color:var(--text-1)] hover:bg-[color:var(--surface-track)]"
          >
            Skip audio
          </button>
          <button
            type="button"
            onClick={handlePrimary}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[color:var(--accent)] text-white hover:brightness-110 flex items-center gap-2 ml-auto sm:ml-0"
          >
            <Dumbbell size={16} aria-hidden />
            Start workout
          </button>
        </div>
      </div>

      {previewPreset && (
        <div
          className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={previewHeadingId}
          aria-describedby={previewDescId}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-default border-0 p-0"
            aria-label="Close preview"
            onClick={closePreviewOnly}
          />
          <div
            ref={previewPanelRef}
            tabIndex={-1}
            className={cn(
              'relative w-full sm:max-w-lg mx-0 sm:mx-4 glass-panel rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col border border-[color:var(--chrome-border)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_45%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-1)]',
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 p-4 border-b border-[color:var(--chrome-border-subtle)] shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--accent)]">
                  Mix preview
                </p>
                <h3
                  id={previewHeadingId}
                  className="text-lg font-bold text-[color:var(--text-0)] leading-snug"
                >
                  {formatIronVibesTitle(previewPreset.playlistName)}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePreviewOnly}
                className="p-2 rounded-lg text-[color:var(--text-1)] hover:text-[color:var(--text-0)] hover:bg-[color:var(--surface-track)] shrink-0"
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              <p id={previewDescId} className="text-sm leading-relaxed text-[color:var(--text-1)]">
                {previewPreset.summary}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 p-4 border-t border-[color:var(--chrome-border-subtle)] shrink-0 bg-[color:var(--surface-well)]">
              <button
                type="button"
                onClick={closePreviewOnly}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[color:var(--text-detail)] border border-[color:var(--chrome-border)] hover:bg-[color:var(--surface-track)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  openYouTubeWithToasts(previewPreset.url);
                  setChoice(previewPreset.id);
                  closePreviewOnly();
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[color:var(--accent)] text-white hover:brightness-110 ml-auto"
              >
                Proceed — open YouTube
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
