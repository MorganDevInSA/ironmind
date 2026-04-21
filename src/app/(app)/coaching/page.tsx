'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores';
import { useActivePhase, useJournalEntries, useWeeklyVolumeSummary, useCreateJournalEntry } from '@/controllers';
import { FileText, Target, TrendingUp, BookOpen, Plus, X } from 'lucide-react';
import { formatDisplayDate, today } from '@/lib/utils';
import { toast } from 'sonner';

function NewEntryModal({ onClose, onSave }: { onClose: () => void; onSave: (title: string, content: string) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="glass-panel w-full max-w-lg p-6 space-y-4 rounded-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#F5F5F5]">New Journal Entry</h3>
          <button onClick={onClose} className="text-[#6B6B6B] hover:text-[#F5F5F5]"><X size={18} /></button>
        </div>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Entry title…"
          className="w-full bg-[rgba(16,22,34,0.6)] border border-[rgba(80,96,128,0.25)] rounded-lg p-3 text-[#F5F5F5] placeholder:text-[#6B6B6B]/50 focus:outline-none focus:border-[rgba(212,175,55,0.4)]"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Training notes, observations, feelings…"
          rows={6}
          className="w-full bg-[rgba(16,22,34,0.6)] border border-[rgba(80,96,128,0.25)] rounded-lg p-3 text-[#F5F5F5] placeholder:text-[#6B6B6B]/50 focus:outline-none focus:border-[rgba(212,175,55,0.4)] resize-none"
        />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={() => { if (title && content) onSave(title, content); }}
            disabled={!title || !content}
            className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >Save Entry</button>
        </div>
      </div>
    </div>
  );
}

export default function CoachingPage() {
  const { user } = useAuthStore();
  const userId = user?.uid ?? '';
  const [showNewEntry, setShowNewEntry] = useState(false);

  const { data: phase } = useActivePhase(userId);
  const { data: journalEntries } = useJournalEntries(userId, 10);
  const { data: weeklyVolume } = useWeeklyVolumeSummary(userId);
  const { mutate: createEntry, isPending } = useCreateJournalEntry(userId);

  const handleSaveEntry = (title: string, content: string) => {
    createEntry(
      { date: today(), title, content, tags: [] },
      {
        onSuccess: () => { setShowNewEntry(false); toast.success('Journal entry saved.'); },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6B6B6B] mb-1">Self-Coaching</p>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Coaching</h1>
      </div>

      {/* Active Phase */}
      {phase && (
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[rgba(212,175,55,0.1)] flex items-center justify-center">
              <Target className="text-[color:var(--accent)]" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-[#F5F5F5]">{phase.name}</h2>
              <p className="text-sm text-[#6B6B6B]">Started {formatDisplayDate(phase.startDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[rgba(16,22,34,0.6)] rounded-lg p-3">
              <p className="text-xs text-[#6B6B6B]">Starting Weight</p>
              <p className="font-mono tabular-nums text-lg font-semibold text-[#F5F5F5]">{phase.targets.startWeight} kg</p>
            </div>
            <div className="bg-[rgba(16,22,34,0.6)] rounded-lg p-3">
              <p className="text-xs text-[#6B6B6B]">Target Weight</p>
              <p className="font-mono tabular-nums text-lg font-semibold text-[#F5F5F5]">{phase.targets.targetWeight} kg</p>
            </div>
          </div>

          {phase.targets.strategy && (
            <p className="text-sm text-[#6B6B6B] mt-3 italic">{phase.targets.strategy}</p>
          )}
        </div>
      )}

      {/* Volume */}
      {weeklyVolume && weeklyVolume.length > 0 && (
        <div className="glass-panel p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[rgba(59,130,246,0.1)] flex items-center justify-center">
              <TrendingUp className="text-[color:var(--accent)]" size={20} />
            </div>
            <h2 className="font-semibold text-[#F5F5F5]">Weekly Volume vs Landmarks</h2>
          </div>

          <div className="space-y-3">
            {weeklyVolume.slice(0, 6).map((muscle) => (
              <div key={muscle.muscleGroup}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#F5F5F5] capitalize">{muscle.muscleGroup}</span>
                  <span className="font-mono tabular-nums text-[#6B6B6B]">{muscle.currentSets} / {muscle.targetSets}</span>
                </div>
                <div className="h-2 bg-[rgba(16,22,34,0.72)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[color:var(--accent)] rounded-full"
                    style={{ width: `${Math.min(100, (muscle.currentSets / muscle.mrv) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journal */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.1)] flex items-center justify-center">
              <BookOpen className="text-[#F59E0B]" size={20} />
            </div>
            <h2 className="font-semibold text-[#F5F5F5]">Training Journal</h2>
          </div>
          <button
            onClick={() => setShowNewEntry(true)}
            className="btn-primary flex items-center gap-2 px-3 py-2 text-sm"
          >
            <Plus size={16} /> New Entry
          </button>
        </div>

        {journalEntries && journalEntries.length > 0 ? (
          <div className="space-y-3">
            {journalEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-[rgba(16,22,34,0.6)] rounded-lg hover:bg-[rgba(16,22,34,0.8)] transition-colors cursor-pointer border border-[rgba(80,96,128,0.15)]"
              >
                <h3 className="font-medium text-[#F5F5F5] mb-1">{entry.title}</h3>
                <p className="text-sm text-[#6B6B6B] line-clamp-2">{entry.content}</p>
                <p className="text-xs text-[#6B6B6B]/60 mt-2">{formatDisplayDate(entry.date)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText size={32} className="mx-auto text-[#6B6B6B] mb-3" />
            <p className="text-[#6B6B6B]">No journal entries yet.</p>
            <p className="text-xs text-[#6B6B6B]/60 mt-1">Tap &quot;New Entry&quot; to start tracking your progress.</p>
          </div>
        )}
      </div>

      {showNewEntry && (
        <NewEntryModal
          onClose={() => setShowNewEntry(false)}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}
