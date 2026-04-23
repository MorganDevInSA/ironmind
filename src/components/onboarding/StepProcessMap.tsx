'use client';

import { useState } from 'react';
import { Brain, ClipboardList, FileJson, Upload, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { DemoProfileModal } from '@/components/onboarding/DemoProfileModal';

interface StepProcessMapProps {
  onNext: () => void;
}

const nodes = [
  {
    icon: Brain,
    number: '01',
    label: 'Activate Coach',
    description: 'Paste the coach persona prompt into ChatGPT, Claude, or Gemini',
  },
  {
    icon: ClipboardList,
    number: '02',
    label: 'Questionnaire',
    description: 'Complete your athlete intake — every detail sharpens the AI output',
  },
  {
    icon: FileJson,
    number: '03',
    label: 'Generate JSON Pack',
    description: 'Paste the data-gen prompt + your questionnaire — AI outputs 6 files',
  },
  {
    icon: Upload,
    number: '04',
    label: 'Import to IRONMIND',
    description: 'Upload the 6 JSON files to fully personalise your app',
  },
  {
    icon: TrendingUp,
    number: '05',
    label: 'Ongoing Analysis',
    description: 'Export your data anytime and paste into AI for elite coaching advice',
  },
];

export function StepProcessMap({ onNext }: StepProcessMapProps) {
  const [demoOpen, setDemoOpen] = useState(false);

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
          <div className="flex flex-row items-stretch gap-0 min-w-max sm:min-w-0 sm:grid sm:grid-cols-5">
            {nodes.map((node, i) => {
              const Icon = node.icon;
              return (
                <div key={node.number} className="flex flex-row items-center">
                  {/* Node card */}
                  <div
                    className="flex flex-col items-center gap-3 p-4 rounded-[14px] w-[148px] sm:w-auto
                    bg-[rgba(18,14,14,0.78)] backdrop-blur-xl border border-[rgba(65,50,50,0.40)]
                    shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                  >
                    {/* Number badge */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      bg-[rgba(220,38,38,0.15)] border border-[color:color-mix(in_srgb,var(--accent)_38%,transparent)] text-[color:var(--accent-light)]
                      [text-shadow:0_0_8px_rgba(220,38,38,0.4)]"
                    >
                      {node.number}
                    </div>
                    <Icon size={20} className="text-[color:var(--accent)]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-0)] text-center leading-tight">
                      {node.label}
                    </span>
                    <p className="text-[9px] text-[color:var(--text-2)] text-center leading-snug">
                      {node.description}
                    </p>
                  </div>

                  {/* Connector arrow — between nodes */}
                  {i < nodes.length - 1 && (
                    <div className="flex items-center justify-center shrink-0 px-1">
                      <ArrowRight
                        size={16}
                        className="text-[rgba(220,38,38,0.50)]"
                        strokeDasharray="4 3"
                      />
                    </div>
                  )}
                </div>
              );
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
        <button
          onClick={onNext}
          className="btn-primary inline-flex items-center justify-center gap-2 min-w-[172px] px-6 py-2.5 text-sm"
        >
          Let&apos;s Start
          <ArrowRight size={18} />
        </button>

        <button
          onClick={() => setDemoOpen(true)}
          className="btn-primary inline-flex items-center justify-center gap-2 min-w-[172px] px-6 py-2.5 text-sm"
        >
          <Zap size={15} />
          Load Demo
        </button>
      </div>

      <DemoProfileModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  );
}
