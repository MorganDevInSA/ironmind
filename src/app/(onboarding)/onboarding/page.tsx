'use client';

import { useState } from 'react';
import { StepProcessMap } from '@/components/onboarding/StepProcessMap';
import { StepCoachPersona } from '@/components/onboarding/StepCoachPersona';
import { StepQuestionnaire } from '@/components/onboarding/StepQuestionnaire';
import { StepGenerateJson } from '@/components/onboarding/StepGenerateJson';
import { StepAnalysisSetup } from '@/components/onboarding/StepAnalysisSetup';
import { StepImportFiles } from '@/components/onboarding/StepImportFiles';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';

const STEPS = ['Overview', 'Coach Prompt', 'Questionnaire', 'Generate Data', 'Analysis', 'Import'];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const skipToDemo = () => setStep(5);

  return (
    <div className="min-h-screen flex flex-col bg-[color:var(--bg-0)]">
      <OnboardingProgress steps={STEPS} current={step} />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-3xl mx-auto w-full">
        {step === 0 && <StepProcessMap onNext={next} />}
        {step === 1 && <StepCoachPersona onNext={next} onBack={back} />}
        {step === 2 && <StepQuestionnaire onNext={next} onBack={back} onSkipToDemo={skipToDemo} />}
        {step === 3 && <StepGenerateJson onNext={next} onBack={back} />}
        {step === 4 && <StepAnalysisSetup onNext={next} onBack={back} />}
        {step === 5 && <StepImportFiles onBack={back} />}
      </div>
    </div>
  );
}
