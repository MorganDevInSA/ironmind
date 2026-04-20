import type { Program } from '@/lib/types';

export const sheriProgram: Omit<Program, 'id'> = {
  name: 'Sheri Foundation 7-Day Rotation',
  cycleLengthDays: 7,
  splitType: 'Full Body + Cardio',
  isActive: true,
  startDate: new Date().toISOString().split('T')[0],
  sessions: [
    {
      dayNumber: 1,
      name: 'Full Body A',
      type: 'lift',
      exercises: [
        { exerciseId: 'goblet-squat',  name: 'Goblet Squat',          sets: 3, reps: '10',      rest: 75, isKPI: true, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
        { exerciseId: 'db-bench',      name: 'DB Bench Press',         sets: 3, reps: '10',      rest: 75, isKPI: true, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
        { exerciseId: 'one-arm-row',   name: 'One Arm Row',            sets: 3, reps: '12/side', rest: 60, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
        { exerciseId: 'db-rdl',        name: 'DB Romanian Deadlift',   sets: 3, reps: '12',      rest: 75, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
      ],
      mobility: ['hips', 'thoracic spine'],
      notes: 'Leave 2 reps in reserve.',
    },
    {
      dayNumber: 2,
      name: 'Walk + Mobility',
      type: 'cardio',
      cardio: { type: 'Brisk Walk', duration: 30, note: 'Conversational pace. Keep effort moderate and sustainable.' },
      breathWork: [
        { name: 'Box Breathing', inhale: 4, hold: 2, exhale: 4, holdOut: 2, rounds: 5 },
      ],
      coreWork: [
        { name: 'Plank', sets: 3, holdSec: 20, perSide: false, prolapseSafe: true },
      ],
      mobility: ['hips', 'shoulders'],
    },
    {
      dayNumber: 3,
      name: 'Full Body B',
      type: 'lift',
      exercises: [
        { exerciseId: 'barbell-box-squat', name: 'Barbell Box Squat', sets: 3, reps: '8',  rest: 90, isKPI: true, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
        { exerciseId: 'incline-db-press',  name: 'Incline DB Press',  sets: 3, reps: '10', rest: 75, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
        { exerciseId: 'barbell-row',       name: 'Barbell Row',       sets: 3, reps: '10', rest: 75, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
        { exerciseId: 'glute-bridge',      name: 'Glute Bridge',      sets: 3, reps: '15', rest: 60, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
      ],
      mobility: ['ankles', 't-spine'],
    },
    {
      dayNumber: 4,
      name: 'Intervals',
      type: 'cardio',
      cardio: { type: 'March Intervals', duration: 20, note: '1 min brisk / 1 min easy. Keep effort moderate and sustainable.' },
      breathWork: [
        { name: 'Nasal Recovery', inhale: 4, hold: 0, exhale: 6, holdOut: 0, rounds: 8 },
      ],
      coreWork: [
        { name: 'Dead Bug', sets: 3, reps: 8, perSide: true, prolapseSafe: true },
      ],
      mobility: ['spine', 'hips'],
    },
    {
      dayNumber: 5,
      name: 'Full Body C',
      type: 'lift',
      exercises: [
        { exerciseId: 'split-squat',   name: 'Split Squat',    sets: 3, reps: '10/leg', rest: 75, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
        { exerciseId: 'floor-press',   name: 'DB Floor Press', sets: 3, reps: '10',     rest: 75, isKPI: true, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
        { exerciseId: 'barbell-row-2', name: 'Barbell Row',    sets: 3, reps: '10',     rest: 75, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
        { exerciseId: 'lateral-raise', name: 'Lateral Raise',  sets: 2, reps: '15',     rest: 45, notes: 'Use comfortable starting load, stop with 2-3 reps in reserve, focus on technique.' },
      ],
      mobility: ['hips', 'shoulders'],
    },
    {
      dayNumber: 6,
      name: 'Long Walk',
      type: 'cardio',
      cardio: { type: 'Walk', duration: 45, note: 'Steady pace. Keep effort moderate and sustainable.' },
      breathWork: [
        { name: 'Deep Breathing', inhale: 4, hold: 0, exhale: 6, holdOut: 0, rounds: 10 },
      ],
      coreWork: [
        { name: 'Side Plank', sets: 2, holdSec: 20, perSide: true, prolapseSafe: true },
      ],
      mobility: [],
    },
    {
      dayNumber: 7,
      name: 'Recovery',
      type: 'recovery',
      mobility: ['full body mobility', 'light stretch'],
      notes: 'Optional easy 20 min walk.',
    },
  ],
  kpis: [
    { exercise: 'Goblet Squat',      metric: 'load x reps', days: [1] },
    { exercise: 'DB Bench Press',    metric: 'load x reps', days: [1] },
    { exercise: 'Barbell Box Squat', metric: 'load x reps', days: [3] },
  ],
  progressionRule: 'Weeks 1-2 learn movements and complete sessions. Add reps before load. Only increase load when sessions feel manageable and recovery is good.',
  volumeTracking: {
    chest:      { setsPerCycle: 9, setsPerWeek: 9, status: 'at target' },
    back:       { setsPerCycle: 9, setsPerWeek: 9, status: 'at target' },
    quads:      { setsPerCycle: 9, setsPerWeek: 9, status: 'at target' },
    hamstrings: { setsPerCycle: 6, setsPerWeek: 6, status: 'minimum effective' },
    delts:      { setsPerCycle: 5, setsPerWeek: 5, status: 'introductory' },
  },
};
