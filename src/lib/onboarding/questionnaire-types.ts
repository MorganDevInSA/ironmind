export interface InjuryBlock {
  name: string;
  status: string;
  avoid: string;
  substitute: string;
}

export interface QuestionnaireAnswers {
  // Identity & Biometrics
  fullName: string;
  age: string;
  gender: string;
  height: string;
  currentWeight: string;
  bodyFatEstimate: string;
  weightUnit: string;

  // Training Background
  yearsTraining: string;
  trainingLevel: string;
  trainingHistory: string;
  competitionHistory: string;

  // Primary Goal
  primaryGoal: string;
  goalType: string;
  timeline: string;
  successLooksLike: string;

  // Secondary Goals
  secondaryGoal1: string;
  secondaryGoal2: string;
  secondaryGoal3: string;
  secondaryGoal4: string;
  secondaryGoal5: string;

  // Injuries & Health
  injuries: [InjuryBlock, InjuryBlock, InjuryBlock];
  medicalConditions: string;
  medications: string;

  // Physique Assessment
  strongPart1: string;
  strongPart2: string;
  strongPart3: string;
  weakPart1: string;
  weakPart2: string;
  weakPart3: string;
  symmetryScore: string;
  bodyFatVsMusclePriority: string;

  // Training Setup
  gymAccess: string;
  equipment: string;
  trainingDaysPerWeek: string;
  sessionDurationMinutes: string;
  homeGymNotes: string;

  // Performance Baselines
  squat1RMkg: string;
  deadlift1RMkg: string;
  benchPress1RMkg: string;
  overheadPress1RMkg: string;
  barbell1RMkg: string;
  otherLift: string;

  // Cardio & Conditioning
  currentCardioType: string;
  currentCardioFrequency: string;
  currentCardioDuration: string;
  cardioCapacity: string;
  cardioGoal: string;

  // Nutrition
  currentCalories: string;
  currentProteinG: string;
  currentCarbsG: string;
  currentFatG: string;
  mealsPerDay: string;
  mealTimingPreference: string;
  foodDislikes: string;
  foodAllergies: string;
  digestiveIssues: string;
  nutritionStyle: string;
  adherenceRating: string;

  // Supplements
  morningSupplements: string;
  preworkoutSupplements: string;
  intraworkoutSupplements: string;
  postworkoutSupplements: string;
  nighttimeSupplements: string;
  supplementBudget: string;

  // Recovery & Lifestyle
  avgSleepHours: string;
  sleepQuality: string;
  stressLevel: string;
  occupation: string;
  dailySteps: string;
  recoveryScore: string;
  alcoholPerWeek: string;
  smokingStatus: string;

  // Coaching Preferences
  coachingStyle: string;
  checkInFrequency: string;
  primaryCommChannel: string;
  biggestChallenge: string;
  anythingElse: string;
}

export const defaultAnswers = (): QuestionnaireAnswers => ({
  fullName: '', age: '', gender: '', height: '', currentWeight: '', bodyFatEstimate: '', weightUnit: 'kg',
  yearsTraining: '', trainingLevel: '', trainingHistory: '', competitionHistory: '',
  primaryGoal: '', goalType: '', timeline: '', successLooksLike: '',
  secondaryGoal1: '', secondaryGoal2: '', secondaryGoal3: '', secondaryGoal4: '', secondaryGoal5: '',
  injuries: [
    { name: '', status: '', avoid: '', substitute: '' },
    { name: '', status: '', avoid: '', substitute: '' },
    { name: '', status: '', avoid: '', substitute: '' },
  ],
  medicalConditions: '', medications: '',
  strongPart1: '', strongPart2: '', strongPart3: '',
  weakPart1: '', weakPart2: '', weakPart3: '',
  symmetryScore: '', bodyFatVsMusclePriority: '',
  gymAccess: '', equipment: '', trainingDaysPerWeek: '', sessionDurationMinutes: '', homeGymNotes: '',
  squat1RMkg: '', deadlift1RMkg: '', benchPress1RMkg: '', overheadPress1RMkg: '', barbell1RMkg: '', otherLift: '',
  currentCardioType: '', currentCardioFrequency: '', currentCardioDuration: '', cardioCapacity: '', cardioGoal: '',
  currentCalories: '', currentProteinG: '', currentCarbsG: '', currentFatG: '',
  mealsPerDay: '', mealTimingPreference: '', foodDislikes: '', foodAllergies: '',
  digestiveIssues: '', nutritionStyle: '', adherenceRating: '',
  morningSupplements: '', preworkoutSupplements: '', intraworkoutSupplements: '',
  postworkoutSupplements: '', nighttimeSupplements: '', supplementBudget: '',
  avgSleepHours: '', sleepQuality: '', stressLevel: '', occupation: '',
  dailySteps: '', recoveryScore: '', alcoholPerWeek: '', smokingStatus: '',
  coachingStyle: '', checkInFrequency: '', primaryCommChannel: '', biggestChallenge: '', anythingElse: '',
});

function nullify(v: string | number | undefined): string | number | null {
  if (v === '' || v === undefined || v === null) return null;
  return v;
}

function nullifyNum(v: string): number | null {
  const parsed = parseFloat(v);
  return isNaN(parsed) ? null : parsed;
}

export function buildQuestionnaireJson(answers: QuestionnaireAnswers): Record<string, unknown> {
  const injuries = answers.injuries.map(i => ({
    name: nullify(i.name),
    status: nullify(i.status),
    avoid: nullify(i.avoid),
    substitute: nullify(i.substitute),
  }));

  return {
    identity: {
      fullName: nullify(answers.fullName),
      age: nullifyNum(answers.age),
      gender: nullify(answers.gender),
      height: nullify(answers.height),
      currentWeightKg: nullifyNum(answers.currentWeight),
      bodyFatEstimatePercent: nullifyNum(answers.bodyFatEstimate),
      weightUnit: nullify(answers.weightUnit),
    },
    trainingBackground: {
      yearsTraining: nullifyNum(answers.yearsTraining),
      trainingLevel: nullify(answers.trainingLevel),
      trainingHistory: nullify(answers.trainingHistory),
      competitionHistory: nullify(answers.competitionHistory),
    },
    primaryGoal: {
      goal: nullify(answers.primaryGoal),
      type: nullify(answers.goalType),
      timeline: nullify(answers.timeline),
      successLooksLike: nullify(answers.successLooksLike),
    },
    secondaryGoals: [
      answers.secondaryGoal1, answers.secondaryGoal2, answers.secondaryGoal3,
      answers.secondaryGoal4, answers.secondaryGoal5,
    ].map(nullify).filter(Boolean),
    injuries,
    healthConstraints: {
      medicalConditions: nullify(answers.medicalConditions),
      medications: nullify(answers.medications),
    },
    physiqueAssessment: {
      strongParts: [answers.strongPart1, answers.strongPart2, answers.strongPart3].map(nullify).filter(Boolean),
      weakParts: [answers.weakPart1, answers.weakPart2, answers.weakPart3].map(nullify).filter(Boolean),
      symmetryScore: nullify(answers.symmetryScore),
      priority: nullify(answers.bodyFatVsMusclePriority),
    },
    trainingSetup: {
      gymAccess: nullify(answers.gymAccess),
      equipment: nullify(answers.equipment),
      daysPerWeek: nullifyNum(answers.trainingDaysPerWeek),
      sessionDurationMinutes: nullifyNum(answers.sessionDurationMinutes),
      homeGymNotes: nullify(answers.homeGymNotes),
    },
    performanceBaselines: {
      squat1RMkg: nullifyNum(answers.squat1RMkg),
      deadlift1RMkg: nullifyNum(answers.deadlift1RMkg),
      benchPress1RMkg: nullifyNum(answers.benchPress1RMkg),
      overheadPress1RMkg: nullifyNum(answers.overheadPress1RMkg),
      barbell1RMkg: nullifyNum(answers.barbell1RMkg),
      other: nullify(answers.otherLift),
    },
    cardio: {
      type: nullify(answers.currentCardioType),
      frequencyPerWeek: nullifyNum(answers.currentCardioFrequency),
      durationMinutes: nullifyNum(answers.currentCardioDuration),
      capacity: nullify(answers.cardioCapacity),
      goal: nullify(answers.cardioGoal),
    },
    nutrition: {
      currentCalories: nullifyNum(answers.currentCalories),
      currentProteinG: nullifyNum(answers.currentProteinG),
      currentCarbsG: nullifyNum(answers.currentCarbsG),
      currentFatG: nullifyNum(answers.currentFatG),
      mealsPerDay: nullifyNum(answers.mealsPerDay),
      mealTimingPreference: nullify(answers.mealTimingPreference),
      foodDislikes: nullify(answers.foodDislikes),
      foodAllergies: nullify(answers.foodAllergies),
      digestiveIssues: nullify(answers.digestiveIssues),
      nutritionStyle: nullify(answers.nutritionStyle),
      adherenceRating: nullify(answers.adherenceRating),
    },
    supplements: {
      morning: nullify(answers.morningSupplements),
      preworkout: nullify(answers.preworkoutSupplements),
      intraworkout: nullify(answers.intraworkoutSupplements),
      postworkout: nullify(answers.postworkoutSupplements),
      nighttime: nullify(answers.nighttimeSupplements),
      budget: nullify(answers.supplementBudget),
    },
    recoveryAndLifestyle: {
      avgSleepHours: nullifyNum(answers.avgSleepHours),
      sleepQuality: nullify(answers.sleepQuality),
      stressLevel: nullify(answers.stressLevel),
      occupation: nullify(answers.occupation),
      dailySteps: nullifyNum(answers.dailySteps),
      recoveryScore: nullify(answers.recoveryScore),
      alcoholPerWeek: nullify(answers.alcoholPerWeek),
      smokingStatus: nullify(answers.smokingStatus),
    },
    coachingPreferences: {
      coachingStyle: nullify(answers.coachingStyle),
      checkInFrequency: nullify(answers.checkInFrequency),
      primaryCommChannel: nullify(answers.primaryCommChannel),
      biggestChallenge: nullify(answers.biggestChallenge),
      anythingElse: nullify(answers.anythingElse),
    },
  };
}
