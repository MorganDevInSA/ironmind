'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DemoProfileModal } from '@/components/onboarding/DemoProfileModal';
import {
  Brain,
  ClipboardList,
  FileJson,
  Upload,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Download,
  Settings,
} from 'lucide-react';

// ─── copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold
        bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.30)] text-[#EF4444]
        hover:bg-[rgba(220,38,38,0.20)] active:scale-95 transition-all duration-200"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── section accordion ────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  number,
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  icon: React.ElementType;
  number: string;
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-[14px] overflow-hidden border border-[rgba(65,50,50,0.40)]
      bg-[rgba(18,14,14,0.78)] shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-[rgba(220,38,38,0.04)] transition-colors"
      >
        <div className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold
          bg-[rgba(220,38,38,0.15)] border border-[rgba(220,38,38,0.38)] text-[#EF4444]
          [text-shadow:0_0_8px_rgba(220,38,38,0.4)]">
          {number}
        </div>
        <Icon size={18} className="text-[#DC2626] shrink-0" />
        <div className="flex-1 flex items-center gap-3">
          <span className="font-bold text-[#F0F0F0] text-sm tracking-wide">{title}</span>
          {badge && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full
              bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.35)] text-[#F59E0B]">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronUp size={15} className="text-[#5E5E5E] shrink-0" /> : <ChevronDown size={15} className="text-[#5E5E5E] shrink-0" />}
      </button>

      {open && (
        <div className="px-5 pb-6 pt-1 border-t border-[rgba(65,50,50,0.30)] flex flex-col gap-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── step row ─────────────────────────────────────────────────────────────────

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center
        text-[9px] font-bold bg-[rgba(220,38,38,0.12)] border border-[rgba(220,38,38,0.35)] text-[#EF4444]">
        {num}
      </span>
      <p className="text-sm text-[#9A9A9A] leading-relaxed">{children}</p>
    </div>
  );
}

// ─── callout ──────────────────────────────────────────────────────────────────

function Callout({ icon: Icon, color, children }: {
  icon: React.ElementType;
  color: 'amber' | 'crimson' | 'green';
  children: React.ReactNode;
}) {
  const palette = {
    amber:  'border-[rgba(245,158,11,0.30)] bg-[rgba(245,158,11,0.06)] text-[#F59E0B]',
    crimson: 'border-[rgba(220,38,38,0.30)] bg-[rgba(220,38,38,0.06)] text-[#EF4444]',
    green:  'border-[rgba(34,197,94,0.30)] bg-[rgba(34,197,94,0.06)] text-[#22C55E]',
  };
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${palette[color]}`}>
      <Icon size={15} className="shrink-0 mt-0.5" />
      <div className="text-sm text-[#9A9A9A] leading-relaxed">{children}</div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function GuidePage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

      {/* Header */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#DC2626]">
          User Guide
        </span>
        <h1 className="mt-2 text-3xl font-bold font-heading tracking-tight text-[#F0F0F0]">
          Getting Started with IRONMIND
        </h1>
        <p className="mt-2 text-sm text-[#9A9A9A]">
          Everything you need to set up your AI coach, generate your personalised plan, and
          get the most from IRONMIND — whether you&apos;re starting from scratch or already
          running on demo data.
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Run Setup Wizard', href: '/onboarding', icon: Brain },
          { label: 'Export Data', href: '/export', icon: Download },
          { label: 'Import / Replace Data', href: '/settings', icon: Settings },
          { label: 'Dashboard', href: '/dashboard', icon: TrendingUp },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-2 p-3 rounded-[12px] text-center
                bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
                hover:border-[rgba(220,38,38,0.30)] hover:shadow-[0_4px_16px_rgba(220,38,38,0.12)]
                transition-all duration-200"
            >
              <Icon size={18} className="text-[#DC2626]" />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9A9A9A] leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Demo data callout */}
      <div className="rounded-[14px] border border-[rgba(245,158,11,0.30)] bg-[rgba(245,158,11,0.06)]
        p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-[#F59E0B] shrink-0" />
          <span className="text-sm font-bold text-[#F59E0B]">Running on demo data?</span>
        </div>
        <p className="text-sm text-[#9A9A9A] leading-relaxed">
          When you first log in, IRONMIND can load a pre-built athlete plan so you can explore
          every feature immediately. This is <strong className="text-[#F0F0F0]">demo data — not your data.</strong>{' '}
          Follow the 5-step process below to generate your own personalised plan and import it.
          Your demo data is replaced the moment you import your own files.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setDemoModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm
              text-[#1a1000] bg-gradient-to-r from-[#F59E0B] to-[#D97706]
              border border-[rgba(245,158,11,0.5)] shadow-[0_6px_16px_rgba(245,158,11,0.18)]
              hover:brightness-110 active:scale-95 transition-all duration-200"
          >
            <Zap size={14} />
            Load a demo profile
          </button>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm text-[#9A9A9A]
              bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
              hover:border-[rgba(220,38,38,0.45)] hover:text-[#F0F0F0]
              active:scale-95 transition-all duration-200"
          >
            Import your own data →
          </Link>
        </div>
      </div>

      <DemoProfileModal open={demoModalOpen} onClose={() => setDemoModalOpen(false)} alreadySeeded />

      {/* ── Step 1 ── */}
      <Section icon={Brain} number="01" title="Activate Your AI Coach" defaultOpen>
        <p className="text-sm text-[#9A9A9A] leading-relaxed">
          Start by giving your AI chatbot the coach persona. This transforms ChatGPT, Claude,
          or Gemini into a world-class professional bodybuilding coach that understands
          periodisation, injury constraints, masters athletes, and evidence-based nutrition.
        </p>

        <div className="flex flex-col gap-2">
          <Step num={1}>Open <strong className="text-[#F0F0F0]">ChatGPT</strong>, <strong className="text-[#F0F0F0]">Claude</strong>, or <strong className="text-[#F0F0F0]">Gemini</strong> in your browser.</Step>
          <Step num={2}>Start a <strong className="text-[#F0F0F0]">brand-new chat</strong> — do not reuse an existing thread.</Step>
          <Step num={3}>Go to the <Link href="/onboarding" className="text-[#DC2626] hover:text-[#EF4444] underline underline-offset-2">Setup Wizard → Step 1</Link>, copy the Coach Persona Prompt, and paste it as your first message.</Step>
          <Step num={4}>The AI confirms it is operating as your coach. <strong className="text-[#F0F0F0]">Keep this chat open</strong> — you will return to it in Step 3.</Step>
        </div>

        <Callout icon={Brain} color="crimson">
          <strong className="text-[#F0F0F0]">Tip:</strong> ChatGPT with GPT-4o produces the most consistent JSON output in Step 3.
          Claude Sonnet is also excellent. Gemini works but may need light reformatting.
        </Callout>
      </Section>

      {/* ── Step 2 ── */}
      <Section icon={ClipboardList} number="02" title="Complete Your Athlete Questionnaire">
        <p className="text-sm text-[#9A9A9A] leading-relaxed">
          The questionnaire is the AI&apos;s brief. Every answer directly shapes your program,
          nutrition targets, and supplement windows. The more detail you provide, the more
          individualised your output.
        </p>

        <div className="flex flex-col gap-2">
          <Step num={1}>Go to the <Link href="/onboarding" className="text-[#DC2626] hover:text-[#EF4444] underline underline-offset-2">Setup Wizard → Step 2</Link> and fill in the form.</Step>
          <Step num={2}>Leave fields blank where you genuinely don&apos;t know — they become <code className="text-[#EF4444] text-xs bg-[rgba(220,38,38,0.10)] px-1.5 py-0.5 rounded">null</code> and the AI works around them.</Step>
          <Step num={3}>Pay special attention to <strong className="text-[#F0F0F0]">Injuries &amp; Health Constraints</strong> — be specific. The AI uses this to exclude dangerous movements before building anything.</Step>
          <Step num={4}>Click <strong className="text-[#F0F0F0]">Save &amp; Download JSON</strong>. Your questionnaire is saved as <code className="text-[#9A9A9A] text-xs">questionnaire-answers.json</code> and copied to clipboard automatically.</Step>
        </div>

        <Callout icon={Zap} color="amber">
          <strong className="text-[#F0F0F0]">Not ready yet?</strong> Click <strong className="text-[#F0F0F0]">Skip to demo data</strong> in the questionnaire step to load a pre-built plan instantly.
          You can come back and generate your own data at any time from Settings.
        </Callout>
      </Section>

      {/* ── Step 3 ── */}
      <Section icon={FileJson} number="03" title="Generate Your 6 JSON Files">
        <p className="text-sm text-[#9A9A9A] leading-relaxed">
          The data-generation prompt instructs the AI to produce 6 JSON files that
          power every part of IRONMIND: your program, nutrition plan, supplement protocol,
          phase targets, volume landmarks, and athlete profile.
        </p>

        <div className="flex flex-col gap-2">
          <Step num={1}>Return to the <strong className="text-[#F0F0F0]">same chat</strong> where you pasted the coach persona (Step 1).</Step>
          <Step num={2}>Go to <Link href="/onboarding" className="text-[#DC2626] hover:text-[#EF4444] underline underline-offset-2">Setup Wizard → Step 3</Link>, copy the Data Generation Prompt, and paste it into the chat.</Step>
          <Step num={3}>Paste your <code className="text-[#9A9A9A] text-xs">questionnaire-answers.json</code> content below the prompt (replace the <code className="text-[#9A9A9A] text-xs">[PASTE QUESTIONNAIRE JSON HERE]</code> placeholder).</Step>
          <Step num={4}>The AI will output <strong className="text-[#F0F0F0]">6 JSON blocks</strong>, each preceded by its filename. Save each one with the <strong className="text-[#F0F0F0]">exact filename</strong> listed below:</Step>
        </div>

        {/* File list */}
        <div className="flex flex-col gap-1.5">
          {[
            ['athlete_profile.json',     'Age, weight, goals, injury constraints'],
            ['training_program.json',    '14-day rotating cycle with all exercises'],
            ['nutrition_plan.json',      'Macro targets by day type + meal schedule'],
            ['supplement_protocol.json', 'Supplement windows and timing'],
            ['phase.json',               'Training phase with targets and strategy'],
            ['volume_landmarks.json',    'MEV / MAV / MRV per muscle group'],
          ].map(([name, desc]) => (
            <div key={name} className="flex items-start gap-3 p-3 rounded-lg
              bg-[rgba(8,8,8,0.7)] border border-[rgba(65,50,50,0.25)]">
              <FileJson size={14} className="text-[#DC2626] mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-semibold text-[#F0F0F0]">{name}</span>
                  <CopyButton text={name} label="Copy name" />
                </div>
                <p className="text-[10px] text-[#5E5E5E] mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <Callout icon={Brain} color="crimson">
          <strong className="text-[#F0F0F0]">Filename matters.</strong> The import system matches files by exact name.
          If the AI outputs code blocks without filenames, check the header comment above each block (e.g. <code className="text-xs">// FILE: athlete_profile.json</code>) and save accordingly.
        </Callout>
      </Section>

      {/* ── Step 4 ── */}
      <Section icon={Upload} number="04" title="Import Your Files to IRONMIND">
        <p className="text-sm text-[#9A9A9A] leading-relaxed">
          Once you have all 6 files, import them to fully personalise your app.
          You can do this during initial setup or at any time from Settings.
        </p>

        <div className="flex flex-col gap-2">
          <Step num={1}>Go to <Link href="/onboarding" className="text-[#DC2626] hover:text-[#EF4444] underline underline-offset-2">Setup Wizard → Step 5</Link> — or <Link href="/settings" className="text-[#DC2626] hover:text-[#EF4444] underline underline-offset-2">Settings → Import Coach Data</Link> if already in the app.</Step>
          <Step num={2}>Use the drag-and-drop zone or tap individual file slots to upload all 6 JSON files.</Step>
          <Step num={3}>Click <strong className="text-[#F0F0F0]">Review &amp; Import</strong> — the app validates the files and shows a summary.</Step>
          <Step num={4}>Confirm the import. Your program, nutrition plan, supplements, phase, and volume landmarks are immediately active.</Step>
          <Step num={5}>If you already have data loaded (e.g. demo data), tick <strong className="text-[#F0F0F0]">Replace existing data</strong> to overwrite it.</Step>
        </div>

        <Callout icon={Zap} color="green">
          <strong className="text-[#F0F0F0]">Prefer demo data first?</strong> Click <strong className="text-[#F0F0F0]">Load demo data instead</strong> on the import step to skip straight to the dashboard.
          Import your real files whenever you&apos;re ready — nothing is permanent.
        </Callout>
      </Section>

      {/* ── Step 5 ── */}
      <Section icon={TrendingUp} number="05" title="Ongoing AI Coach Analysis" badge="Use anytime">
        <p className="text-sm text-[#9A9A9A] leading-relaxed">
          As you log workouts, nutrition, and recovery, IRONMIND builds a full training history.
          Export this data and paste it into AI to get elite coaching advice — trend analysis,
          volume adjustments, nutrition tweaks, and session-specific guidance.
        </p>

        <div className="flex flex-col gap-2">
          <Step num={1}>In IRONMIND, go to <Link href="/export" className="text-[#DC2626] hover:text-[#EF4444] underline underline-offset-2">Export</Link> and click <strong className="text-[#F0F0F0]">Generate Report</strong> to create your Athlete Status Report.</Step>
          <Step num={2}>Open your AI chat. If starting fresh, paste the Coach Persona Prompt first (Setup Wizard Step 1). If returning to an existing thread, paste the Context Retention Prompt (Setup Wizard Step 4) with your export below it.</Step>
          <Step num={3}>Copy and paste the <strong className="text-[#F0F0F0]">Analysis Prompt</strong> from Setup Wizard Step 4, followed by your full export text.</Step>
          <Step num={4}>The AI will produce a structured coaching response: Assessment → Plan → Metrics to Track → Why This Works → Next Step.</Step>
        </div>

        <div className="rounded-lg border border-[rgba(65,50,50,0.30)] bg-[rgba(8,8,8,0.7)] p-4 flex flex-col gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#5E5E5E]">Context Retention Prompt — use when returning to an existing chat</p>
          <p className="text-xs font-mono text-[#5E5E5E] leading-relaxed line-clamp-3">
            Before I continue, here is my current athlete data and all previous coaching context so you maintain full continuity…
          </p>
          <Link
            href="/onboarding"
            className="self-start inline-flex items-center gap-1.5 text-xs text-[#DC2626] hover:text-[#EF4444] font-semibold"
          >
            <ExternalLink size={12} />
            Get full prompt in Setup Wizard → Step 4
          </Link>
        </div>

        <Callout icon={TrendingUp} color="green">
          <strong className="text-[#F0F0F0]">Best practice:</strong> Run an export analysis after every training week. Consistent data over time
          gives the AI far more signal than a single snapshot — it can spot trends, catch
          fatigue patterns, and adjust volume before you hit a wall.
        </Callout>
      </Section>

      {/* ── FAQ ── */}
      <div className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex flex-col gap-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#5E5E5E]">
          Common Questions
        </p>

        {[
          {
            q: 'Can I re-run the setup wizard to update my plan?',
            a: 'Yes. Go to the Setup Wizard at any time, complete the questionnaire with updated information, generate new JSON files, and re-import them via Settings → Import Coach Data. Tick "Replace existing data" to overwrite your current plan.',
          },
          {
            q: 'Do I have to complete all 5 steps at once?',
            a: 'No. Steps 1–4 happen outside the app (in AI chat). You can do them at your own pace. Import (Step 5) is the only step that changes data inside IRONMIND.',
          },
          {
            q: 'Which AI gives the best results?',
            a: 'GPT-4o (ChatGPT) produces the most consistent JSON structure. Claude Sonnet is also reliable and often writes more detailed coaching notes. Free tiers can work but may hit context limits on the data-generation step — a paid plan is recommended for Step 3.',
          },
          {
            q: 'What if the AI doesn\'t output all 6 files?',
            a: 'Reply with: "Please continue and output the remaining JSON files." Large context windows occasionally truncate output. You can also ask for one file at a time: "Output only training_program.json now."',
          },
          {
            q: 'Where is my data stored?',
            a: 'All data is stored in Firebase Firestore under your user ID. Nothing is shared with other users. The AI chat is separate from IRONMIND — your questionnaire and export data is only sent to the AI when you deliberately paste it.',
          },
        ].map(({ q, a }) => (
          <div key={q} className="border-t border-[rgba(65,50,50,0.25)] pt-4 first:border-t-0 first:pt-0">
            <p className="text-sm font-semibold text-[#F0F0F0] mb-1">{q}</p>
            <p className="text-sm text-[#9A9A9A] leading-relaxed">{a}</p>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pb-4">
        <Link
          href="/onboarding"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-white text-sm
            bg-gradient-to-r from-[#DC2626] to-[#B91C1C] border border-[rgba(220,38,38,0.5)]
            shadow-[0_12px_22px_rgba(220,38,38,0.25)]
            hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          <Brain size={16} />
          Open Setup Wizard
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm text-[#9A9A9A]
            bg-[rgba(22,16,16,0.9)] border border-[rgba(65,50,50,0.45)]
            hover:border-[rgba(220,38,38,0.45)] hover:text-[#F0F0F0]
            active:scale-95 transition-all duration-200"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
