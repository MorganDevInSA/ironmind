import type { AthleteProfile } from '@/lib/types';

export const fezProfile: AthleteProfile = {
  clientName: 'Fez',
  sex: 'male',
  age: 27,
  height: '5\'9" (175 cm)',
  currentWeight: 73,
  targetWeight: 80,
  weightUnit: 'kg',
  trainingAge: 'advanced',
  currentPhase: 'lean-bulk',
  primaryGoal:
    'Gain lean bodybuilding muscle and strength from 73 kg toward 80 kg while keeping surf/bodyboard cardio capacity and shoulder integrity.',
  secondaryGoals: [
    'Protect repaired shoulder under progressive overload',
    'Maintain morning training consistency around full-time work',
    'Keep vegan protein high enough for a fast metabolism / hard-gainer profile',
    'Preserve VO2 and work capacity for competition-level bodyboarding',
  ],
  injuryConstraints: [
    {
      name: 'Prior shoulder surgery — 3 titanium pins (invert impact)',
      implications: [
        'Avoid maximal overhead barbell locking and unstable pressing angles',
        'Monitor pain, click, and night ache after upper sessions',
      ],
      adaptations: [
        'Neutral-grip machine and cable pressing before barbell work',
        'Landmine and partial-ROM overhead patterns within tolerance',
        'Higher rear-delt and external rotation volume; strict warm-up',
      ],
    },
  ],
  strengthBodyparts: ['back', 'legs', 'cardiovascular endurance'],
  weakpointBodyparts: [
    'chest thickness at long muscle lengths',
    'arms',
    'scale weight on vegan bulk',
  ],
  nutritionStyle:
    'Whole-food vegan with structured protein (tofu, tempeh, legumes, soy milk, plant protein powder). No alcohol or smoking.',
  metabolismNote: 'Fast metabolism — classic hard gainer; needs calorie density and consistency.',
};
