import type { AthleteProfile } from '@/lib/types';

export const mortonProfile: AthleteProfile = {
  clientName: 'Morton',
  sex: 'male',
  age: 46,
  height: "5'10\"",
  currentWeight: 80,
  targetWeight: 85,
  weightUnit: 'kg',
  trainingAge: 'advanced',
  currentPhase: 'rebuild',
  primaryGoal: 'Increase bodyweight from 80kg to 85kg while maximizing muscle gain and minimizing unnecessary fat gain',
  secondaryGoals: [
    'Restore previous strength levels',
    'Improve chest, back, and quad development',
    'Rebuild cardiovascular fitness',
    'Improve work capacity',
    'Maintain long-term health markers',
    'Sustain motivation and consistency',
    'Build a physique that reflects experience and maturity',
  ],
  injuryConstraints: [
    {
      name: 'Pelvic wall prolapse',
      implications: [
        'Avoid heavy squats',
        'Avoid deadlifts',
        'Avoid extreme bracing',
        'Avoid high intra-abdominal pressure movements',
      ],
      adaptations: [
        'Unilateral leg work',
        'Machine-free intelligent substitutions',
        'Controlled tempo',
        'Symptom monitoring (pelvic comfort 1-5 after hardest core set)',
      ],
    },
  ],
  strengthBodyparts: ['shoulders', 'calves', 'biceps'],
  weakpointBodyparts: ['quads', 'chest', 'back'],
  nutritionStyle: 'practical',
  metabolismNote: 'Fast metabolism — challenge is often eating enough consistently',
};
