import type { AthleteProfile } from '@/lib/types';

export const mariaProfile: AthleteProfile = {
  clientName: 'Maria',
  sex: 'female',
  age: 45,
  height: '5\'4" (162 cm)',
  currentWeight: 57,
  targetWeight: 60,
  weightUnit: 'kg',
  trainingAge: 'beginner',
  currentPhase: 'rebuild',
  primaryGoal:
    'Gain a little quality weight and muscle slowly while improving cardio — strong for daily life without obsessing over the scale.',
  secondaryGoals: [
    'Use pool, hill stairs, and home space effectively (no traditional gym)',
    'Navigate shared custody weeks with either 3 focused training days or shorter kid-friendly sessions',
    'Build sustainable habits around food she actually enjoys',
    'Improve conditioning without joint beat-up',
  ],
  injuryConstraints: [
    {
      name: 'No acute injuries reported',
      implications: ['Progress conservatively on stairs volume if knees bark'],
      adaptations: [
        'Step height and cadence adjustable on hill repeats',
        'Pool work for low-impact intervals',
        'Bodyweight patterns before loading backpacks',
      ],
    },
  ],
  strengthBodyparts: ['relative leanness', 'mobility from daily movement'],
  weakpointBodyparts: ['upper body pushing strength', 'cardio base', 'absolute scale weight'],
  nutritionStyle:
    'Eats intuitively with a loose structure — prefers not to stress about food; protein-forward meals when possible.',
  metabolismNote: 'Naturally lean / fast burner — scale moves slowly even when strength improves.',
};
