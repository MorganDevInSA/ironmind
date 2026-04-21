import { ArrowLeft, ArrowRight, FileJson } from 'lucide-react';
import { PromptBlock } from './PromptBlock';
import { JSON_GENERATION_PROMPT } from '@/lib/onboarding/prompt-content';

interface StepGenerateJsonProps {
  onNext: () => void;
  onBack: () => void;
}

const EXPECTED_FILES = [
  { name: 'athlete_profile.json',     description: 'Age, weight, goals, injury constraints' },
  { name: 'training_program.json',    description: '14-day rotating cycle with all exercises' },
  { name: 'nutrition_plan.json',      description: 'Macro targets by day type + meal schedule' },
  { name: 'supplement_protocol.json', description: 'Supplement windows and timing' },
  { name: 'phase.json',               description: 'Training phase with targets and strategy' },
  { name: 'volume_landmarks.json',    description: 'MEV / MAV / MRV per muscle group' },
];

const instructions = [
  { num: '01', text: 'Go back to the same AI chat where you activated the coach persona (Step 2)' },
  { num: '02', text: 'Click Copy to Clipboard below and paste the data-generation prompt' },
  { num: '03', text: 'Then paste or type your questionnaire JSON from Step 2 at the bottom where instructed' },
  { num: '04', text: 'The AI will output 6 JSON files — save each with the exact filename shown in the reference panel below' },
];

export function StepGenerateJson({ onNext, onBack }: StepGenerateJsonProps) {
  return (
    <div className="flex flex-col gap-7 py-4">
      {/* Heading */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">
          Step 4 of 6
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-heading tracking-tight text-[#F0F0F0]">
          Generate Your Data Pack
        </h2>
        <p className="mt-2 text-sm text-[#9A9A9A]">
          Paste this prompt into the same AI chat as Step 1, then add your questionnaire JSON.
          The AI will output 6 files that fully populate your IRONMIND app.
        </p>
      </div>

      {/* Instruction steps */}
      <div className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex flex-col gap-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#5E5E5E]">
          Instructions
        </div>
        {instructions.map(step => (
          <div key={step.num} className="flex items-start gap-4">
            <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center
              text-[10px] font-bold bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] border border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)]
              text-[color:var(--accent-light)]">
              {step.num}
            </span>
            <p className="text-sm text-[#F0F0F0] leading-relaxed">{step.text}</p>
          </div>
        ))}
      </div>

      {/* Prompt block */}
      <div className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
        <PromptBlock
          text={JSON_GENERATION_PROMPT}
          filename="03-json-pack-generation-prompt.md"
          label="Data Generation Prompt"
        />
      </div>

      {/* Expected file reference panel */}
      <div className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#5E5E5E] mb-4">
          6 Files the AI Will Output — Save With These Exact Filenames
        </p>
        <div className="flex flex-col gap-2">
          {EXPECTED_FILES.map(file => (
            <div key={file.name} className="flex items-start gap-3 p-3 rounded-lg
              bg-[rgba(8,8,8,0.7)] border border-[rgba(65,50,50,0.30)]">
              <FileJson size={16} className="text-[color:var(--accent)] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-mono font-semibold text-[#F0F0F0]">{file.name}</p>
                <p className="text-xs text-[#5E5E5E]">{file.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between">
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

        <button
          onClick={onNext}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-white
            bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
            shadow-[0_8px_20px_rgba(220,38,38,0.22)]
            hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          I Have My 6 JSON Files
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
