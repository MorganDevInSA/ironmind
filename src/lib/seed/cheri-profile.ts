import type { AthleteProfile } from '@/lib/types';

export const cheriProfile: AthleteProfile = {
  clientName: 'Cheri',
  sex: 'female',
  age: 45,
  height: '5\'6" (167.6 cm)',
  currentWeight: 95,
  targetWeight: 83,
  weightUnit: 'kg',
  trainingAge: 'beginner',
  currentPhase: 'rebuild',
  primaryGoal: 'Reduce body fat to 83 kg while rebuilding strength, fitness, and confidence.',
  secondaryGoals: [
    'Improve consistency',
    'Increase daily movement',
    'Improve sleep routine',
    'Build lean muscle',
    'Increase energy',
  ],
  injuryConstraints: [
    {
      name: 'None reported',
      implications: [],
      adaptations: [
        'Use conservative loading',
        'Progress only with good technique',
        'Monitor recovery and soreness',
      ],
    },
  ],
  strengthBodyparts: ['lower body', 'general strength potential', 'coordination'],
  weakpointBodyparts: ['conditioning', 'upper body endurance', 'body-fat reduction'],
  nutritionStyle:
    'Structured simple meals with repeatable high-protein options and calorie control.',
  metabolismNote: 'Normal to slow; easier fat gain tendency inferred.',
};
