'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brain, ClipboardList, FileJson, Upload, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { DemoProfileModal } from '@/components/onboarding/DemoProfileModal';
import { useAuthStore } from '@/stores';

interface StepProcessMapProps {
  onNext: () => void;
  /** Jump to the matching onboarding wizard step (indices align with `/onboarding` STEPS). */
  onGoToStep?: (stepIndex: number) => void;
}

const nodes = [
  {
    icon: Brain,
    number: '01',
    label: 'Activate Coach',
    description: 'Paste the coach persona prompt into ChatGPT, Claude, or Gemini',
    onboardingStep: 2,
  },
  {
    icon: ClipboardList,
    number: '02',
    label: 'Questionnaire',
    description: 'Complete your athlete intake — every detail sharpens the AI output',
    onboardingStep: 3,
  },
  {
    icon: FileJson,
    number: '03',
    label: 'Generate JSON Pack',
    description: 'Paste the data-gen prompt + your questionnaire — AI outputs 6 files',
    onboardingStep: 4,
  },
  {
    icon: Upload,
    number: '04',
    label: 'Import to IRONMIND',
    description: 'Upload the 6 JSON files to fully personalise your app',
    onboardingStep: 6,
  },
  {
    icon: TrendingUp,
    number: '05',
    label: 'Ongoing Analysis',
    description: 'Export your data anytime and paste into AI for elite coaching advice',
    onboardingStep: 5,
  },
] as const;

/** Title block — enough for two wrapped lines at 10px uppercase. */
const TIMELINE_TITLE_MIN = 'min-h-[2.25rem]';

/** Body copy — minimal shared floor for step 03 at narrow card width (~4 lines @ 9px). */
const TIMELINE_BODY_MIN = 'min-h-[3.375rem]';

const ctaPrimaryCls =
  'btn-primary inline-flex items-center justify-center gap-2 min-w-[172px] px-6 py-2.5 text-sm';

export function StepProcessMap({ onNext, onGoToStep }: StepProcessMapProps) {
  const [demoOpen, setDemoOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)] mb-3">
          Setup Process
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-[color:var(--text-0)] mb-3">
          Welcome to{' '}
          <span className="bg-gradient-to-r from-[color:var(--accent-light)] via-[color:var(--accent)] to-[color:var(--accent-2)] bg-clip-text text-transparent [filter:drop-shadow(0_2px_12px_color-mix(in_srgb,var(--accent)_40%,transparent))]">
            IRONMIND
          </span>
        </h1>
        <p className="text-[color:var(--text-1)] text-base max-w-xl mx-auto">
          Follow this 6-step process to personalize your theme, initialize your AI bodybuilding
          coach, and fully populate your coaching app with data tailored to you.
        </p>
      </div>

      {/* Flowchart — horizontal scroll on small screens, full-width grid on large */}
      <div className="-mx-4 sm:mx-0">
        {/* Scroll hint label (mobile only) */}
        <p className="sm:hidden text-[10px] text-[color:var(--text-2)] text-center mb-2 tracking-widest uppercase">
          ← scroll →
        </p>

        <div className="overflow-x-auto pb-3 px-4 sm:px-0">
          <div className="flex flex-row items-stretch gap-0 min-w-max sm:min-w-0 sm:w-full">
            {nodes.flatMap((node, i) => {
              const Icon = node.icon;
              const card = (
                <div
                  key={node.number}
                  className="flex min-h-0 shrink-0 flex-col self-stretch sm:flex-1 sm:min-w-0 w-[156px] sm:w-auto"
                >
                  <button
                    type="button"
                    onClick={() => onGoToStep?.(node.onboardingStep)}
                    aria-label={`Open ${node.label} — step ${node.number}`}
                    className="group flex h-full min-h-0 w-full cursor-pointer flex-col items-center gap-2.5 rounded-[14px] border border-[rgba(65,50,50,0.40)]
                    bg-[rgba(18,14,14,0.78)] p-4 text-center shadow-[0_10px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-[border-color,box-shadow,background-color] duration-200
                    hover:border-[color:color-mix(in_srgb,var(--accent)_38%,transparent)] hover:bg-[rgba(22,16,16,0.88)]
                    hover:shadow-[0_12px_28px_rgba(0,0,0,0.5)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:color-mix(in_srgb,var(--accent)_50%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg-0)]"
                  >
                    <div
                      className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold
                      bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)] border border-[color:color-mix(in_srgb,var(--accent)_38%,transparent)] text-[color:var(--accent-light)]
                      [text-shadow:0_0_8px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
                    >
                      {node.number}
                    </div>
                    <Icon
                      size={20}
                      className="shrink-0 text-[color:var(--accent)] transition-transform duration-200 group-hover:scale-105"
                    />
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-0)] text-center leading-tight w-full ${TIMELINE_TITLE_MIN} flex items-center justify-center`}
                    >
                      {node.label}
                    </span>
                    <div
                      className={`flex w-full min-h-0 flex-1 flex-col items-start justify-start ${TIMELINE_BODY_MIN}`}
                    >
                      <p className="text-[9px] text-[color:var(--text-2)] text-center leading-snug max-w-full">
                        {node.description}
                      </p>
                    </div>
                  </button>
                </div>
              );

              if (i >= nodes.length - 1) return [card];

              const arrow = (
                <div
                  key={`${node.number}-arrow`}
                  className="flex items-center justify-center shrink-0 self-center px-0.5 sm:px-1"
                >
                  <ArrowRight
                    size={16}
                    className="text-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]"
                    strokeDasharray="4 3"
                  />
                </div>
              );

              return [card, arrow];
            })}
          </div>
        </div>
      </div>

      {/* Summary text */}
      <div
        className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)] text-[color:var(--text-1)] text-sm leading-relaxed text-center"
      >
        This process turns a general AI into your personal elite bodybuilding coach, then seeds your
        IRONMIND app with a fully individualised program, nutrition plan, and supplement protocol.
        Each session you log sharpens the coach&apos;s ability to analyse and adapt.
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3">
        <button type="button" onClick={onNext} className={ctaPrimaryCls}>
          Let&apos;s Start
          <ArrowRight size={18} />
        </button>

        <button type="button" onClick={() => setDemoOpen(true)} className={ctaPrimaryCls}>
          <Zap size={15} />
          Load Demo
        </button>

        {user ? (
          <Link href="/dashboard" className={ctaPrimaryCls}>
            Dashboard
          </Link>
        ) : null}
      </div>

      <DemoProfileModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
