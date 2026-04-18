import type { AthleteProfile, UserData } from '@/lib/types';
import {
  getDocument,
  setDocument,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';

const converter = createConverter<AthleteProfile>();
const userConverter = createConverter<UserData>();

// Get athlete profile
export async function getProfile(userId: string): Promise<AthleteProfile | null> {
  return getDocument<AthleteProfile>(
    collections.profiles(userId),
    'data',
    converter
  );
}

// Update athlete profile
export async function updateProfile(
  userId: string,
  profile: Partial<AthleteProfile>
): Promise<void> {
  await setDocument<AthleteProfile>(
    collections.profiles(userId),
    'data',
    profile as AthleteProfile,
    converter
  );
}

// Get user data (including isSeeded flag)
export async function getUserData(userId: string): Promise<UserData | null> {
  return getDocument<UserData>(
    collections.users,
    userId,
    userConverter
  );
}

// Update user data
export async function updateUserData(
  userId: string,
  data: Partial<UserData>
): Promise<void> {
  await setDocument<UserData>(
    collections.users,
    userId,
    data as UserData,
    userConverter
  );
}

// Check if user is seeded
export async function isUserSeeded(userId: string): Promise<boolean> {
  const userData = await getUserData(userId);
  return userData?.isSeeded ?? false;
}

// Mark user as seeded
export async function markUserSeeded(userId: string): Promise<void> {
  await updateUserData(userId, { isSeeded: true });
}
