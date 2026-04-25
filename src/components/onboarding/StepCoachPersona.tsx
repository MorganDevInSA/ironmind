import { ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';
import { PromptBlock } from './PromptBlock';
import { COACH_PERSONA_PROMPT } from '@/lib/onboarding/prompt-content';

interface StepCoachPersonaProps {
  onNext: () => void;
  onBack: () => void;
}

const instructions = [
  { num: '01', text: 'Open ChatGPT, Claude, or Gemini in your browser' },
  { num: '02', text: 'Start a brand-new chat — do not re-use an existing thread' },
  { num: '03', text: 'Click Copy to Clipboard below, then paste the prompt as your first message' },
  {
    num: '04',
    text: 'The AI will confirm it is operating as your world-class bodybuilding coach — keep this chat open',
  },
];

export function StepCoachPersona({ onNext, onBack }: StepCoachPersonaProps) {
  return (
    <div className="flex flex-col gap-7 py-4">
      {/* Heading */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">
          Step 2 of 6
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-heading tracking-tight text-[color:var(--text-0)]">
          Activate Your AI Coach
        </h2>
        <p className="mt-2 text-sm text-[color:var(--text-1)]">
          Paste this prompt into your AI chatbot of choice. It transforms the AI into a world-class
          professional bodybuilding coach ready to build your personalised program.
        </p>
      </div>

      {/* Instruction steps */}
      <div
        className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex flex-col gap-4"
      >
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--text-2)]">
          <MessageSquare size={13} className="text-[color:var(--accent)]" />
          Instructions
        </div>
        {instructions.map((step) => (
          <div key={step.num} className="flex items-start gap-4">
            <span
              className="mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center
              text-[10px] font-bold bg-[rgba(16,16,16,0.78)] border border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)]
              text-[color:var(--accent-light)]"
            >
              {step.num}
            </span>
            <p className="text-sm text-[color:var(--text-0)] leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>

      {/* Prompt block */}
      <div
        className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
      >
        <PromptBlock
          text={COACH_PERSONA_PROMPT}
          filename="01-coach-persona.md"
          label="Coach Persona Prompt"
        />
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
          Coach is Ready
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
