'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Check, Zap, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { DemoProfileModal } from './DemoProfileModal';
import {
  QuestionnaireAnswers,
  defaultAnswers,
  buildQuestionnaireJson,
} from '@/lib/onboarding/questionnaire-types';

interface StepQuestionnaireProps {
  onNext: () => void;
  onBack: () => void;
  onSkipToDemo?: () => void;
}

// ─── helpers ────────────────────────────────────────────────────────────────

const inputCls = `w-full px-4 py-3 rounded-lg
  bg-[#131313] border border-[rgba(65,50,50,0.40)]
  text-[#F0F0F0] placeholder:text-[#5E5E5E]
  focus:border-[rgba(220,38,38,0.50)]
  focus:shadow-[0_0_0_3px_rgba(220,38,38,0.10)]
  focus:outline-none transition-all duration-200 text-sm`;

const labelCls = 'block text-xs font-semibold uppercase tracking-[0.2em] text-[#5E5E5E] mb-1.5';

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-2 mb-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.25em] text-[color:var(--accent)]">{children}</h3>
      <div className="flex-1 h-px bg-[rgba(220,38,38,0.20)]" />
    </div>
  );
}

// ─── component ──────────────────────────────────────────────────────────────

export function StepQuestionnaire({ onNext, onBack }: StepQuestionnaireProps) {
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(defaultAnswers);
  const [downloaded, setDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [demoExpanded, setDemoExpanded] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  function set<K extends keyof QuestionnaireAnswers>(key: K, value: QuestionnaireAnswers[K]) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function setInjury(
    idx: number,
    field: keyof QuestionnaireAnswers['injuries'][0],
    value: string
  ) {
    setAnswers(prev => {
      const injuries = [...prev.injuries] as QuestionnaireAnswers['injuries'];
      injuries[idx] = { ...injuries[idx], [field]: value };
      return { ...prev, injuries };
    });
  }

  function downloadJson() {
    const json = JSON.stringify(buildQuestionnaireJson(answers), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questionnaire-answers.json';
    a.click();
    URL.revokeObjectURL(url);
    void navigator.clipboard.writeText(json);
    setDownloaded(true);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-7 py-4">
      {/* Heading */}
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[color:var(--accent)]">
          Step 3 of 6
        </span>
        <h2 className="mt-2 text-2xl sm:text-3xl font-bold font-heading tracking-tight text-[#F0F0F0]">
          Athlete Questionnaire
        </h2>
            <p className="mt-2 text-sm text-[#9A9A9A]">
          Fill in as much as you can. Leave unknown fields blank — they become{' '}
          <code className="text-[color:var(--accent-light)] text-xs bg-[color:color-mix(in_srgb,var(--accent)_10%,transparent)] px-1.5 py-0.5 rounded">null</code>{' '}
          in the output. The more detail you provide, the better your personalised program.
        </p>
      </div>

      {/* Skip to demo banner — theme accent */}
      <div
        className="rounded-[14px] border border-[color:color-mix(in_srgb,var(--accent)_32%,transparent)]
        bg-[color:color-mix(in_srgb,var(--accent)_8%,transparent)] overflow-hidden"
      >
        <button
          onClick={() => setDemoExpanded(v => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <Zap size={16} className="text-[color:var(--accent)] shrink-0" />
            <span className="text-sm font-semibold text-[color:var(--accent-light)]">
              Not ready to fill this in? Skip to demo data
            </span>
          </div>
          {demoExpanded ? (
            <ChevronUp size={15} className="text-[color:var(--accent)] shrink-0" />
          ) : (
            <ChevronDown size={15} className="text-[color:var(--accent)] shrink-0" />
          )}
        </button>

        {demoExpanded && (
          <div className="px-5 pb-5 flex flex-col gap-4 border-t border-[color:color-mix(in_srgb,var(--accent)_22%,transparent)]">
            <div className="pt-4 flex flex-col gap-2 text-sm text-[#9A9A9A] leading-relaxed">
              <p>
                Demo data loads a pre-built athlete plan so you can explore every feature of
                IRONMIND right away. You can replace it with your own personalised data at
                any time from <strong className="text-[#F0F0F0]">Settings → Import Coach Data</strong>.
              </p>
              <p className="font-semibold text-[#F0F0F0] mt-1">When you&apos;re ready to go custom, here&apos;s the full process:</p>
              <ol className="flex flex-col gap-2 pl-1">
                {[
                  'Go back to Step 1 and paste the Coach Persona prompt into a new ChatGPT / Claude / Gemini chat.',
                  'Complete this questionnaire and click "Save & Download JSON".',
                  'Go to Step 3, paste the data-generation prompt into the same chat, then paste your questionnaire JSON below it.',
                  'The AI will output 6 JSON files. Save each one with the exact filename shown (e.g. athlete_profile.json).',
                  'Return to the app → Settings → Import Coach Data and upload all 6 files. Your personalised program replaces the demo.',
                ].map((text, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center
                      text-[9px] font-bold bg-[color:color-mix(in_srgb,var(--accent)_15%,transparent)]
                      border border-[color:color-mix(in_srgb,var(--accent)_35%,transparent)] text-[color:var(--accent-light)]">
                      {i + 1}
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
              <p className="text-xs text-[#5E5E5E] mt-1">
                Need a refresher anytime? The <strong className="text-[#F0F0F0]">User Guide</strong> in the app
                sidebar walks through the full process with all prompts available to copy.
              </p>
            </div>

            <button
              onClick={() => setDemoModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-semibold text-sm text-white
                bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)]
                border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
                shadow-[0_8px_20px_color-mix(in_srgb,var(--accent)_22%,transparent)]
                hover:brightness-110 active:scale-95 transition-all duration-200"
            >
              <Users size={15} />
              Choose a demo profile
            </button>

            <DemoProfileModal open={demoModalOpen} onClose={() => setDemoModalOpen(false)} />
          </div>
        )}
      </div>

      {/* Form */}
      <div className="rounded-[14px] p-6 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex flex-col gap-5">

        {/* Identity & Biometrics */}
        <SectionTitle>Identity &amp; Biometrics</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name">
            <input className={inputCls} value={answers.fullName} onChange={e => set('fullName', e.target.value)} placeholder="e.g. Alex Thompson" />
          </Field>
          <Field label="Age">
            <input className={inputCls} type="number" min={16} max={90} value={answers.age} onChange={e => set('age', e.target.value)} placeholder="e.g. 42" />
          </Field>
          <Field label="Gender">
            <select className={inputCls} value={answers.gender} onChange={e => set('gender', e.target.value)}>
              <option value="">— select —</option>
              <option>Male</option>
              <option>Female</option>
              <option>Non-binary</option>
              <option>Prefer not to say</option>
            </select>
          </Field>
          <Field label="Height">
            <input className={inputCls} value={answers.height} onChange={e => set('height', e.target.value)} placeholder="e.g. 178cm or 5'10&quot;" />
          </Field>
          <Field label="Current Weight">
            <input className={inputCls} type="number" value={answers.currentWeight} onChange={e => set('currentWeight', e.target.value)} placeholder="e.g. 90" />
          </Field>
          <Field label="Weight Unit">
            <select className={inputCls} value={answers.weightUnit} onChange={e => set('weightUnit', e.target.value)}>
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </Field>
          <Field label="Body Fat % Estimate">
            <input className={inputCls} type="number" min={3} max={60} value={answers.bodyFatEstimate} onChange={e => set('bodyFatEstimate', e.target.value)} placeholder="e.g. 18" />
          </Field>
        </div>

        {/* Training Background */}
        <SectionTitle>Training Background</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Years Training">
            <input className={inputCls} type="number" min={0} value={answers.yearsTraining} onChange={e => set('yearsTraining', e.target.value)} placeholder="e.g. 8" />
          </Field>
          <Field label="Training Level">
            <select className={inputCls} value={answers.trainingLevel} onChange={e => set('trainingLevel', e.target.value)}>
              <option value="">— select —</option>
              <option value="beginner">Beginner (&lt;1 yr)</option>
              <option value="intermediate">Intermediate (1–4 yr)</option>
              <option value="advanced">Advanced (4–10 yr)</option>
              <option value="elite">Elite (10+ yr)</option>
            </select>
          </Field>
        </div>
        <Field label="Training History (brief summary)">
          <textarea className={inputCls} rows={3} value={answers.trainingHistory} onChange={e => set('trainingHistory', e.target.value)} placeholder="What splits / programs have you run? Any phases of enhanced performance?" />
        </Field>
        <Field label="Competition History">
          <textarea className={inputCls} rows={2} value={answers.competitionHistory} onChange={e => set('competitionHistory', e.target.value)} placeholder="Shows entered, placing, division, natural or not" />
        </Field>

        {/* Primary Goal */}
        <SectionTitle>Primary Goal</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Goal Type">
            <select className={inputCls} value={answers.goalType} onChange={e => set('goalType', e.target.value)}>
              <option value="">— select —</option>
              <option>Contest prep</option>
              <option>Off-season growth</option>
              <option>Body recomposition</option>
              <option>Strength focus</option>
              <option>Athletic performance</option>
              <option>Health &amp; longevity</option>
            </select>
          </Field>
          <Field label="Timeline">
            <input className={inputCls} value={answers.timeline} onChange={e => set('timeline', e.target.value)} placeholder="e.g. 16 weeks, show on Oct 12" />
          </Field>
        </div>
        <Field label="Primary Goal (one sentence)">
          <textarea className={inputCls} rows={2} value={answers.primaryGoal} onChange={e => set('primaryGoal', e.target.value)} placeholder="e.g. Compete at 90kg classic physique on Oct 12 in conditioned shape" />
        </Field>
        <Field label="What does success look like?">
          <textarea className={inputCls} rows={2} value={answers.successLooksLike} onChange={e => set('successLooksLike', e.target.value)} placeholder="Describe the physique, performance, or lifestyle outcome you want" />
        </Field>

        {/* Secondary Goals */}
        <SectionTitle>Secondary Goals</SectionTitle>
        {(['secondaryGoal1', 'secondaryGoal2', 'secondaryGoal3', 'secondaryGoal4', 'secondaryGoal5'] as const).map((k, i) => (
          <Field key={k} label={`Secondary Goal ${i + 1}`}>
            <input className={inputCls} value={answers[k]} onChange={e => set(k, e.target.value)} placeholder="e.g. Improve shoulder width, hit 140kg bench, sleep 8hrs consistently" />
          </Field>
        ))}

        {/* Injuries */}
        <SectionTitle>Injuries &amp; Health Constraints</SectionTitle>
        <p className="text-xs text-[#9A9A9A] -mt-3 mb-1">
          Be specific — the AI uses this to exclude movements and find safe substitutions.
        </p>
        {([0, 1, 2] as const).map(idx => (
          <div key={idx} className="p-4 rounded-xl border border-[rgba(65,50,50,0.30)] bg-[rgba(8,8,8,0.5)] flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--accent)]">Injury {idx + 1}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Injury Name">
                <input className={inputCls} value={answers.injuries[idx].name} onChange={e => setInjury(idx, 'name', e.target.value)} placeholder="e.g. Left shoulder labrum" />
              </Field>
              <Field label="Current Status">
                <input className={inputCls} value={answers.injuries[idx].status} onChange={e => setInjury(idx, 'status', e.target.value)} placeholder="e.g. Managed, no overhead press" />
              </Field>
              <Field label="Movements to Avoid">
                <input className={inputCls} value={answers.injuries[idx].avoid} onChange={e => setInjury(idx, 'avoid', e.target.value)} placeholder="e.g. Overhead press, upright rows" />
              </Field>
              <Field label="Safe Substitutions">
                <input className={inputCls} value={answers.injuries[idx].substitute} onChange={e => setInjury(idx, 'substitute', e.target.value)} placeholder="e.g. Lateral raises, cable side delts" />
              </Field>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Medical Conditions">
            <input className={inputCls} value={answers.medicalConditions} onChange={e => set('medicalConditions', e.target.value)} placeholder="e.g. Hypertension — monitored" />
          </Field>
          <Field label="Medications">
            <input className={inputCls} value={answers.medications} onChange={e => set('medications', e.target.value)} placeholder="e.g. Lisinopril 10mg daily" />
          </Field>
        </div>

        {/* Physique Assessment */}
        <SectionTitle>Physique Assessment</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['strongPart1', 'strongPart2', 'strongPart3'] as const).map((k, i) => (
            <Field key={k} label={`Strong Body Part ${i + 1}`}>
              <input className={inputCls} value={answers[k]} onChange={e => set(k, e.target.value)} placeholder="e.g. Back, Arms, Hamstrings" />
            </Field>
          ))}
          {(['weakPart1', 'weakPart2', 'weakPart3'] as const).map((k, i) => (
            <Field key={k} label={`Weak Body Part ${i + 1}`}>
              <input className={inputCls} value={answers[k]} onChange={e => set(k, e.target.value)} placeholder="e.g. Chest, Calves, Front delts" />
            </Field>
          ))}
          <Field label="Symmetry Score (1–10)">
            <input className={inputCls} type="number" min={1} max={10} value={answers.symmetryScore} onChange={e => set('symmetryScore', e.target.value)} placeholder="e.g. 7" />
          </Field>
          <Field label="Priority: Lose Fat vs Add Muscle">
            <select className={inputCls} value={answers.bodyFatVsMusclePriority} onChange={e => set('bodyFatVsMusclePriority', e.target.value)}>
              <option value="">— select —</option>
              <option>Lose fat — top priority</option>
              <option>Add muscle — top priority</option>
              <option>Both equally</option>
              <option>Maintain — optimise performance</option>
            </select>
          </Field>
        </div>

        {/* Training Setup */}
        <SectionTitle>Training Setup</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Gym Access">
            <select className={inputCls} value={answers.gymAccess} onChange={e => set('gymAccess', e.target.value)}>
              <option value="">— select —</option>
              <option>Full commercial gym</option>
              <option>Home gym (full)</option>
              <option>Home gym (limited)</option>
              <option>Bodyweight only</option>
              <option>Hotel / travel</option>
            </select>
          </Field>
          <Field label="Training Days / Week">
            <input className={inputCls} type="number" min={1} max={7} value={answers.trainingDaysPerWeek} onChange={e => set('trainingDaysPerWeek', e.target.value)} placeholder="e.g. 5" />
          </Field>
          <Field label="Session Duration (minutes)">
            <input className={inputCls} type="number" min={20} max={180} value={answers.sessionDurationMinutes} onChange={e => set('sessionDurationMinutes', e.target.value)} placeholder="e.g. 75" />
          </Field>
        </div>
        <Field label="Equipment Available">
          <textarea className={inputCls} rows={2} value={answers.equipment} onChange={e => set('equipment', e.target.value)} placeholder="e.g. Barbells, dumbbells 5–50kg, cable machine, smith machine, leg press" />
        </Field>

        {/* Performance Baselines */}
        <SectionTitle>Performance Baselines (1RM or working max)</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            ['squat1RMkg', 'Squat (kg)'],
            ['deadlift1RMkg', 'Deadlift (kg)'],
            ['benchPress1RMkg', 'Bench Press (kg)'],
            ['overheadPress1RMkg', 'Overhead Press (kg)'],
            ['barbell1RMkg', 'Barbell Row (kg)'],
          ] as [keyof QuestionnaireAnswers, string][]).map(([k, label]) => (
            <Field key={k} label={label}>
              <input className={inputCls} type="number" value={answers[k] as string} onChange={e => set(k, e.target.value)} placeholder="e.g. 120" />
            </Field>
          ))}
          <Field label="Other Key Lift">
            <input className={inputCls} value={answers.otherLift} onChange={e => set('otherLift', e.target.value)} placeholder="e.g. Cable row 3×10 @ 70kg" />
          </Field>
        </div>

        {/* Cardio */}
        <SectionTitle>Cardio &amp; Conditioning</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Current Cardio Type">
            <input className={inputCls} value={answers.currentCardioType} onChange={e => set('currentCardioType', e.target.value)} placeholder="e.g. Incline treadmill, assault bike" />
          </Field>
          <Field label="Sessions / Week">
            <input className={inputCls} type="number" min={0} value={answers.currentCardioFrequency} onChange={e => set('currentCardioFrequency', e.target.value)} placeholder="e.g. 3" />
          </Field>
          <Field label="Duration (minutes)">
            <input className={inputCls} type="number" value={answers.currentCardioDuration} onChange={e => set('currentCardioDuration', e.target.value)} placeholder="e.g. 30" />
          </Field>
          <Field label="Cardio Capacity">
            <select className={inputCls} value={answers.cardioCapacity} onChange={e => set('cardioCapacity', e.target.value)}>
              <option value="">— select —</option>
              <option>Poor</option>
              <option>Below average</option>
              <option>Average</option>
              <option>Good</option>
              <option>Excellent</option>
            </select>
          </Field>
          <Field label="Cardio Goal">
            <input className={inputCls} value={answers.cardioGoal} onChange={e => set('cardioGoal', e.target.value)} placeholder="e.g. Improve conditioning, accelerate fat loss" />
          </Field>
        </div>

        {/* Nutrition */}
        <SectionTitle>Nutrition</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            ['currentCalories', 'Current Calories / Day'],
            ['currentProteinG', 'Current Protein (g)'],
            ['currentCarbsG', 'Current Carbs (g)'],
            ['currentFatG', 'Current Fat (g)'],
            ['mealsPerDay', 'Meals per Day'],
          ] as [keyof QuestionnaireAnswers, string][]).map(([k, label]) => (
            <Field key={k} label={label}>
              <input className={inputCls} type="number" value={answers[k] as string} onChange={e => set(k, e.target.value)} placeholder="e.g. 2800" />
            </Field>
          ))}
          <Field label="Nutrition Style">
            <select className={inputCls} value={answers.nutritionStyle} onChange={e => set('nutritionStyle', e.target.value)}>
              <option value="">— select —</option>
              <option>Flexible / IIFYM</option>
              <option>Whole foods focused</option>
              <option>Intermittent fasting</option>
              <option>Low carb</option>
              <option>High carb cycling</option>
              <option>Plant-based</option>
            </select>
          </Field>
          <Field label="Adherence Rating (1–10)">
            <input className={inputCls} type="number" min={1} max={10} value={answers.adherenceRating} onChange={e => set('adherenceRating', e.target.value)} placeholder="e.g. 8" />
          </Field>
        </div>
        <Field label="Meal Timing Preference">
          <input className={inputCls} value={answers.mealTimingPreference} onChange={e => set('mealTimingPreference', e.target.value)} placeholder="e.g. Largest meals post-workout, no eating past 9pm" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Food Dislikes">
            <input className={inputCls} value={answers.foodDislikes} onChange={e => set('foodDislikes', e.target.value)} placeholder="e.g. Liver, Brussels sprouts" />
          </Field>
          <Field label="Food Allergies / Intolerances">
            <input className={inputCls} value={answers.foodAllergies} onChange={e => set('foodAllergies', e.target.value)} placeholder="e.g. Lactose intolerant, shellfish allergy" />
          </Field>
          <Field label="Digestive Issues">
            <input className={inputCls} value={answers.digestiveIssues} onChange={e => set('digestiveIssues', e.target.value)} placeholder="e.g. IBS, bloating from high-fibre days" />
          </Field>
        </div>

        {/* Supplements */}
        <SectionTitle>Supplements</SectionTitle>
        {([
          ['morningSupplements', 'Morning (with breakfast)'],
          ['preworkoutSupplements', 'Pre-workout'],
          ['intraworkoutSupplements', 'Intra-workout'],
          ['postworkoutSupplements', 'Post-workout'],
          ['nighttimeSupplements', 'Nighttime / before bed'],
        ] as [keyof QuestionnaireAnswers, string][]).map(([k, label]) => (
          <Field key={k} label={label}>
            <textarea className={inputCls} rows={2} value={answers[k] as string} onChange={e => set(k, e.target.value)} placeholder="e.g. Creatine 5g, Vitamin D3 5000IU, Omega-3 3g" />
          </Field>
        ))}
        <Field label="Supplement Budget">
          <input className={inputCls} value={answers.supplementBudget} onChange={e => set('supplementBudget', e.target.value)} placeholder="e.g. $100–150 / month" />
        </Field>

        {/* Recovery & Lifestyle */}
        <SectionTitle>Recovery &amp; Lifestyle</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Average Sleep (hours)">
            <input className={inputCls} type="number" min={3} max={12} step={0.5} value={answers.avgSleepHours} onChange={e => set('avgSleepHours', e.target.value)} placeholder="e.g. 7" />
          </Field>
          <Field label="Sleep Quality (1–10)">
            <input className={inputCls} type="number" min={1} max={10} value={answers.sleepQuality} onChange={e => set('sleepQuality', e.target.value)} placeholder="e.g. 6" />
          </Field>
          <Field label="Stress Level (1–10)">
            <input className={inputCls} type="number" min={1} max={10} value={answers.stressLevel} onChange={e => set('stressLevel', e.target.value)} placeholder="e.g. 5" />
          </Field>
          <Field label="Occupation / Activity Level">
            <input className={inputCls} value={answers.occupation} onChange={e => set('occupation', e.target.value)} placeholder="e.g. Software engineer — sedentary office work" />
          </Field>
          <Field label="Daily Steps (average)">
            <input className={inputCls} type="number" value={answers.dailySteps} onChange={e => set('dailySteps', e.target.value)} placeholder="e.g. 8000" />
          </Field>
          <Field label="Recovery Score / HRV Note">
            <input className={inputCls} value={answers.recoveryScore} onChange={e => set('recoveryScore', e.target.value)} placeholder="e.g. Garmin Body Battery avg 60" />
          </Field>
          <Field label="Alcohol (units / week)">
            <input className={inputCls} value={answers.alcoholPerWeek} onChange={e => set('alcoholPerWeek', e.target.value)} placeholder="e.g. 4 beers on weekends" />
          </Field>
          <Field label="Smoking / Vaping Status">
            <input className={inputCls} value={answers.smokingStatus} onChange={e => set('smokingStatus', e.target.value)} placeholder="e.g. Non-smoker" />
          </Field>
        </div>

        {/* Coaching Preferences */}
        <SectionTitle>Coaching Preferences</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Preferred Coaching Style">
            <select className={inputCls} value={answers.coachingStyle} onChange={e => set('coachingStyle', e.target.value)}>
              <option value="">— select —</option>
              <option>Highly detailed explanations</option>
              <option>Direct and concise</option>
              <option>Motivational / high energy</option>
              <option>Analytical / data-driven</option>
              <option>Supportive / check-in focused</option>
            </select>
          </Field>
          <Field label="Check-in Frequency">
            <select className={inputCls} value={answers.checkInFrequency} onChange={e => set('checkInFrequency', e.target.value)}>
              <option value="">— select —</option>
              <option>Daily</option>
              <option>Every 2–3 days</option>
              <option>Weekly</option>
              <option>As needed</option>
            </select>
          </Field>
          <Field label="Primary Communication Channel">
            <input className={inputCls} value={answers.primaryCommChannel} onChange={e => set('primaryCommChannel', e.target.value)} placeholder="e.g. ChatGPT, Claude, WhatsApp with coach" />
          </Field>
        </div>
        <Field label="Biggest Challenge Right Now">
          <textarea className={inputCls} rows={2} value={answers.biggestChallenge} onChange={e => set('biggestChallenge', e.target.value)} placeholder="e.g. Consistency with nutrition on work travel days" />
        </Field>
        <Field label="Anything Else the Coach Should Know">
          <textarea className={inputCls} rows={3} value={answers.anythingElse} onChange={e => set('anythingElse', e.target.value)} placeholder="Family commitments, surgery scheduled, upcoming vacation, recent bloodwork results, past PED use, etc." />
        </Field>
      </div>

      {/* Download CTA */}
      <div className="rounded-[14px] p-5 bg-[rgba(18,14,14,0.78)] border border-[rgba(65,50,50,0.40)]
        shadow-[0_10px_24px_rgba(0,0,0,0.45)] flex flex-col gap-3">
        <p className="text-sm text-[#9A9A9A]">
          When you&apos;re done, download your questionnaire as JSON. You&apos;ll paste it into the
          AI in the next step alongside the data-generation prompt.
        </p>
        <button
          onClick={downloadJson}
          className="flex items-center gap-2 px-5 py-3 rounded-lg font-semibold text-white text-sm
            bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
            shadow-[0_8px_20px_rgba(220,38,38,0.22)]
            hover:brightness-110 active:scale-95 transition-all duration-200"
        >
          {copied ? <Check size={16} /> : <Download size={16} />}
          {downloaded ? 'Download Again' : 'Save & Download JSON'}
        </button>
        {downloaded && (
          <p className="text-xs text-[#22C55E]">
            ✓ questionnaire-answers.json downloaded and copied to clipboard
          </p>
        )}
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
          disabled={!downloaded}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-semibold text-sm text-white
            bg-gradient-to-r from-[color:var(--accent)] to-[color:var(--accent-2)] border border-[color:color-mix(in_srgb,var(--accent)_50%,transparent)]
            shadow-[0_8px_20px_rgba(220,38,38,0.22)]
            hover:brightness-110 active:scale-95 transition-all duration-200
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          I&apos;ve Saved My Questionnaire
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
