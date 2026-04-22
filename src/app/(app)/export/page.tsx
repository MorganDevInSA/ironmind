'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores';
import { useCreateJournalEntry, useJournalEntries } from '@/controllers';
import { generateSummary } from '@/lib/export';
import type { ExportOptions } from '@/lib/types';
import { formatDisplayDate, today } from '@/lib/utils';
import { Download, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_COACH_OPTIONS: ExportOptions = {
  historyDays: 42,
  includeProfile: true,
  includeProgram: true,
  includeWorkouts: true,
  includeNutrition: true,
  includeRecovery: true,
  includePhysique: true,
  includeSupplements: true,
  includeAlerts: true,
  includeCoachingNotes: true,
};

export default function ExportPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';

  const [options, setOptions] = useState<ExportOptions>({
    historyDays: 14,
    includeProfile: true,
    includeProgram: true,
    includeWorkouts: true,
    includeNutrition: true,
    includeRecovery: true,
    includePhysique: true,
    includeSupplements: true,
    includeAlerts: true,
    includeCoachingNotes: true,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const { data: recentNotes } = useJournalEntries(userId, 5);
  const { mutate: createEntry, isPending: isSavingNote } = useCreateJournalEntry(userId);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const summary = await generateSummary(userId, options);
      setGenerated(summary);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generated) return;
    const blob = new Blob([generated], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ironmind-export-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleOption = (key: keyof ExportOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNote = () => {
    const trimmedTitle = noteTitle.trim();
    const trimmedContent = noteContent.trim();

    if (!trimmedTitle || !trimmedContent) {
      toast.error('Add a title and note content before saving.');
      return;
    }

    createEntry(
      {
        date: today(),
        title: trimmedTitle,
        content: trimmedContent,
        tags: [],
      },
      {
        onSuccess: () => {
          setNoteTitle('');
          setNoteContent('');
          toast.success('Export note saved.');
        },
        onError: (error) => {
          toast.error(`Failed to save note: ${error.message}`);
        },
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-[color:var(--accent)]">Export Data</h1>
        <p className="text-text-secondary">
          Generate an <strong>Athlete Status Report</strong> (markdown) for coach-style analysis. Pair the export with{' '}
          <code className="rounded bg-surface-elevated px-1 py-0.5 text-xs">prompts/04-coach-analysis-from-export-or-screenshots.md</code>{' '}
          and your coach persona—full history, set-level training detail, volume landmarks, supplements protocol, alerts, and journal notes when enabled below.
        </p>
      </div>

      {/* Notes for export */}
      <div className="glass-panel p-4 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground">Notes for Export</h2>
          <p className="text-sm text-text-secondary">
            Add coaching notes here before generating your report. Saved notes are included when
            <span className="font-medium text-foreground"> coaching notes</span> are enabled below.
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Note title"
            className="w-full rounded-lg border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] p-3 text-sm text-foreground placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_55%,transparent)]"
          />
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write context for this export: training issues, fatigue, schedule constraints, or recent changes."
            rows={4}
            className="w-full rounded-lg border border-[color:var(--chrome-border)] bg-[color:var(--surface-well)] p-3 text-sm text-foreground placeholder:text-[color:var(--text-2)] focus:outline-none focus:border-[color:color-mix(in_srgb,var(--accent)_55%,transparent)] resize-none"
          />
          <button
            type="button"
            onClick={handleSaveNote}
            disabled={isSavingNote}
            className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
          >
            {isSavingNote ? 'Saving note...' : 'Save Note'}
          </button>
        </div>

        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-2)]">
            Recent saved notes
          </p>
          {recentNotes && recentNotes.length > 0 ? (
            <div className="space-y-2">
              {recentNotes.map((note) => (
                <div key={note.id} className="rounded-lg border border-[color:var(--chrome-border)] bg-[rgba(0,0,0,0.2)] p-3">
                  <p className="text-sm font-medium text-foreground">{note.title}</p>
                  <p className="text-xs text-text-secondary line-clamp-2 mt-1">{note.content}</p>
                  <p className="text-[11px] text-[color:var(--text-2)] mt-1">{formatDisplayDate(note.date)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No notes saved yet.</p>
          )}
        </div>
      </div>

      {/* Options */}
      <div className="bg-surface border border-border rounded-xl p-4">
        <h2 className="font-medium text-foreground mb-4">Include in Export</h2>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {Object.entries(options)
            .filter(([key]) => key !== 'historyDays')
            .map(([key, value]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={() => toggleOption(key as keyof ExportOptions)}
                  className="w-4 h-4 rounded border-border bg-surface-elevated focus:ring-[color:var(--accent)]"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="text-sm text-foreground capitalize">
                  {key.replace('include', '').replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm text-text-secondary">History period:</label>
          <select
            value={options.historyDays}
            onChange={(e) =>
              setOptions(prev => ({ ...prev, historyDays: Number(e.target.value) }))
            }
            className="bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={21}>21 days</option>
            <option value={28}>28 days</option>
            <option value={30}>30 days</option>
            <option value={42}>42 days (coach preset)</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
          </select>
          <button
            type="button"
            onClick={() => setOptions(DEFAULT_COACH_OPTIONS)}
            className="text-sm font-medium text-[color:var(--accent)] underline-offset-4 hover:underline"
          >
            Coach analysis preset (42d · all sections)
          </button>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="btn-primary w-full py-3 disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Export'}
      </button>

      {/* Preview */}
      {generated && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-foreground">Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-border transition-colors"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary flex items-center gap-2 px-4 py-2"
              >
                <Download size={16} />
                Download .md
              </button>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 font-mono text-xs sm:text-sm text-foreground overflow-auto max-h-[min(70vh,36rem)] whitespace-pre-wrap break-words">
            {generated.length > 12000 ? (
              <>
                {generated.slice(0, 12000)}
                {'\n\n… (preview truncated — use Download .md for the full report)'}
              </>
            ) : (
              generated
            )}
          </div>
        </div>
      )}
    </div>
  );
}
