import type { AthleteProfile } from '@/lib/types';

export const jordanProfile: AthleteProfile = {
  clientName: 'Jordan',
  sex: 'female',
  age: 33,
  height: "5'5\" (165 cm)",
  currentWeight: 72,
  targetWeight: 66,
  weightUnit: 'kg',
  trainingAge: 'beginner',
  currentPhase: 'rebuild',
  primaryGoal: 'Build a sustainable fitness habit, lose 6 kg of body fat, and feel energetic in daily life.',
  secondaryGoals: [
    'Improve overall strength and mobility',
    'Build confidence in the gym',
    'Establish consistent sleep and recovery routine',
    'Reduce stress through exercise',
  ],
  injuryConstraints: [
    {
      name: 'Occasional lower back tightness',
      implications: [
        'Avoid heavy axial loading until technique is solid',
        'Monitor discomfort on hip hinge patterns',
      ],
      adaptations: [
        'Prioritise hip hinge technique with light loads',
        'Include daily mobility and core activation work',
        'Use tempo and controlled range of motion',
      ],
    },
  ],
  strengthBodyparts: ['legs', 'core stability'],
  weakpointBodyparts: ['upper body pushing strength', 'posterior chain', 'conditioning'],
  nutritionStyle: 'Simple home cooking — prefers whole foods, dislikes calorie counting. Intuitive with structure.',
  metabolismNote: 'Normal metabolism. Responds well to moderate deficit with high protein.',
};
