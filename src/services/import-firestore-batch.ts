/**
 * Firestore writeBatch helpers for coach JSON import — groups independent doc paths
 * that can share one atomic commit (≤500 ops; we use ≤3 per batch).
 */
import { doc } from 'firebase/firestore';
import type {
  AthleteProfile,
  JournalEntry,
  Program,
  Phase,
  VolumeLandmarks,
  SupplementProtocol,
  NutritionDay,
} from '@/lib/types';
import type { NutritionPlanSeed } from '@/lib/seed/nutrition';
import {
  createWriteBatch,
  getCollectionRef,
  getDocumentRef,
  stripUndefinedDeep,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';

const profileConverter = createConverter<AthleteProfile>();
const protocolConverter = createConverter<SupplementProtocol>();
const landmarksConverter = createConverter<VolumeLandmarks>();
const programConverter = createConverter<Program>();
const phaseConverter = createConverter<Phase>();
const nutritionPlanConverter = createConverter<NutritionPlanSeed>();
const nutritionDayConverter = createConverter<NutritionDay>();
const journalConverter = createConverter<JournalEntry>();

export interface CoachImportStaticBatchInput {
  profile?: AthleteProfile;
  protocol?: SupplementProtocol;
  landmarks?: VolumeLandmarks;
}

/** Single commit for profile + supplement protocol + volume landmarks (any subset). */
export async function commitCoachImportStaticBatch(
  userId: string,
  input: CoachImportStaticBatchInput,
): Promise<void> {
  const { profile, protocol, landmarks } = input;
  if (!profile && !protocol && !landmarks) return;

  const batch = createWriteBatch();
  if (profile) {
    const ref = getDocumentRef(collections.profiles(userId), 'data', profileConverter);
    batch.set(ref, stripUndefinedDeep(profile) as AthleteProfile, { merge: true });
  }
  if (protocol) {
    const ref = getDocumentRef(
      collections.supplementProtocol(userId),
      'current',
      protocolConverter,
    );
    batch.set(ref, stripUndefinedDeep(protocol) as SupplementProtocol, { merge: true });
  }
  if (landmarks) {
    const ref = getDocumentRef(collections.volumeLandmarks(userId), 'data', landmarksConverter);
    batch.set(ref, stripUndefinedDeep(landmarks) as VolumeLandmarks, { merge: true });
  }
  await batch.commit();
}

/** First program on an empty `programs` subcollection — one batch.set, no active-pointer transaction. */
export async function createProgramImportFirstOnly(
  userId: string,
  program: Omit<Program, 'id'>,
): Promise<string> {
  const batch = createWriteBatch();
  const colRef = getCollectionRef(collections.programs(userId), programConverter);
  const programRef = doc(colRef);
  batch.set(programRef, stripUndefinedDeep(program as Program) as Program);
  await batch.commit();
  return programRef.id;
}

/** First phase on an empty `phases` subcollection — one batch.set, no active-pointer transaction. */
export async function createPhaseImportFirstOnly(
  userId: string,
  phase: Omit<Phase, 'id'>,
): Promise<string> {
  const batch = createWriteBatch();
  const colRef = getCollectionRef(collections.phases(userId), phaseConverter);
  const phaseRef = doc(colRef);
  batch.set(phaseRef, stripUndefinedDeep(phase as Phase) as Phase);
  await batch.commit();
  return phaseRef.id;
}

export interface CoachImportNutritionBatchInput {
  plan: NutritionPlanSeed;
  dayDate: string;
  day: NutritionDay;
  journal: Omit<JournalEntry, 'id'>;
}

/** Nutrition plan + day + journal entry in one commit (import-time only). */
export async function commitCoachImportNutritionBatch(
  userId: string,
  input: CoachImportNutritionBatchInput,
): Promise<{ journalId: string }> {
  const batch = createWriteBatch();
  const planRef = getDocumentRef(
    collections.nutritionPlan(userId),
    'current',
    nutritionPlanConverter,
  );
  batch.set(planRef, stripUndefinedDeep(input.plan) as NutritionPlanSeed, { merge: true });

  const dayRef = getDocumentRef(
    collections.nutritionDays(userId),
    input.dayDate,
    nutritionDayConverter,
  );
  batch.set(dayRef, stripUndefinedDeep(input.day) as NutritionDay, { merge: true });

  const journalCol = getCollectionRef(collections.journalEntries(userId), journalConverter);
  const journalRef = doc(journalCol);
  batch.set(journalRef, stripUndefinedDeep(input.journal as JournalEntry) as JournalEntry);

  await batch.commit();
  return { journalId: journalRef.id };
}
