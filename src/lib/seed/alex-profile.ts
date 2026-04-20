import type { AthleteProfile } from '@/lib/types';

export const alexProfile: AthleteProfile = {
  clientName: 'Alex',
  sex: 'male',
  age: 28,
  height: "5'11\" (180 cm)",
  currentWeight: 82,
  targetWeight: 88,
  weightUnit: 'kg',
  trainingAge: 'intermediate',
  currentPhase: 'hypertrophy',
  primaryGoal: 'Gain 6 kg of lean mass while minimising fat gain — targeting 88 kg.',
  secondaryGoals: [
    'Increase squat and deadlift totals',
    'Improve upper body thickness (chest, back)',
    'Build consistent training habits around work schedule',
    'Optimise sleep and recovery quality',
  ],
  injuryConstraints: [
    {
      name: 'None reported',
      implications: [],
      adaptations: [
        'Progress load systematically using double-progression',
        'Monitor joint discomfort on heavy compounds',
      ],
    },
  ],
  strengthBodyparts: ['legs', 'pull strength', 'shoulder pressing'],
  weakpointBodyparts: ['chest thickness', 'triceps', 'rear delts'],
  nutritionStyle: 'Flexible tracking — hits protein daily, carbs around training, relaxed weekends.',
  metabolismNote: 'Fast-moderate; tolerates surpluses well without excess fat gain.',
};
