'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, Check } from 'lucide-react';
import { PromptBlock } from './PromptBlock';
import { ANALYSIS_PROMPT, CONTEXT_RETENTION_PROMPT } from '@/lib/onboarding/prompt-content';

interface StepAnalysisSetupProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepAnalysisSetup({ onNext, onBack }: StepAnalysisSetupProps) {
  const [copiedContext, setCopiedContext] = useState(false);

  function handleCopyContext() {
    void navigator.clipboard.writeText(CONTEXT_RETENTION_PROMPT).then(() => {
      setCopiedContext(true);
      setTimeout(() => setCopiedContext(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-7 py-4">
      {/* Heading */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">
          Step 5 of 6
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-heading tracking-tight text-[color:var(--text-0)]">
          Ongoing Coach Analysis
        </h2>
        <p className="mt-2 text-sm text-[color:var(--text-1)]">
          Once your app is running you can export your data at any time and paste it into AI for
          analysis. This prompt tells the AI how to read your IRONMIND export and produce
          actionable, evidence-based coaching advice.
        </p>
      </div>

      {/* Analysis prompt block */}
      <div
        className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
      >
        <PromptBlock
          text={ANALYSIS_PROMPT}
          filename="04-coach-analysis-from-export-or-screenshots.md"
          label="Coach Analysis Prompt"
        />
      </div>

      {/* How to use */}
      <div
        className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex flex-col gap-3"
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--text-2)]">
          How to use it
        </p>
        <ol className="flex flex-col gap-3">
          {[
            'In IRONMIND, go to Export and generate your Athlete Status Report',
            'Open your AI chat (same chat or a fresh one with the coach persona loaded)',
            'Paste the Analysis Prompt above, then paste your export below it',
            'The AI will analyse your training history, nutrition, physique trends, and recovery — then give you specific coaching actions',
          ].map((text, i) => (
            <li key={i} className="flex items-start gap-4">
              <span
                className="mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center
                text-[10px] font-bold bg-[rgba(16,16,16,0.78)] border border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)]
                text-[color:var(--accent-light)]"
              >
                0{i + 1}
              </span>
              <p className="text-sm text-[color:var(--text-0)] leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Context retention panel */}
      <div
        className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex flex-col gap-4"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--text-2)] mb-1">
            Keeping Chat Context
          </p>
          <p className="text-sm text-[color:var(--text-1)]">
            When returning to an existing AI chat thread, use this prompt to restore continuity.
            Paste your IRONMIND export where indicated so the coach picks up exactly where it left
            off.
          </p>
        </div>

        <textarea
          readOnly
          value={CONTEXT_RETENTION_PROMPT}
          rows={6}
          className="w-full rounded-lg px-4 py-3 font-mono text-xs leading-relaxed
            bg-[rgba(8,8,8,0.9)] border border-[rgba(65,50,50,0.40)]
            text-[color:var(--text-1)] resize-none focus:outline-none"
        />

        <button
          onClick={handleCopyContext}
          className="self-start flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm text-white
            bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
            shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_22%,transparent)]
            hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          {copiedContext ? <Check size={15} /> : <Copy size={15} />}
          {copiedContext ? 'Copied!' : 'Copy Context Prompt'}
        </button>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
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

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-white
            bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
            shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_22%,transparent)]
            hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          Ready to Import My Files
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
