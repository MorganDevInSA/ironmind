import type { AthleteProfile, UserData } from '@/lib/types';
import {
  getDocument,
  setDocument,
  createConverter,
} from '@/lib/firebase';
import { collections } from '@/lib/firebase/config';
import { withService } from '@/lib/errors';

const converter = createConverter<AthleteProfile>();
const userConverter = createConverter<UserData>();

// Get athlete profile
export async function getProfile(userId: string): Promise<AthleteProfile | null> {
  return withService('profile', 'read profile', () =>
    getDocument<AthleteProfile>(
      collections.profiles(userId),
      'data',
      converter
    )
  );
}

// Update athlete profile
export async function updateProfile(
  userId: string,
  profile: Partial<AthleteProfile>
): Promise<void> {
  return withService('profile', 'update profile', () =>
    setDocument<AthleteProfile>(
      collections.profiles(userId),
      'data',
      profile as AthleteProfile,
      converter
    )
  );
}

// Get user data (including isSeeded flag)
export async function getUserData(userId: string): Promise<UserData | null> {
  return withService('profile', 'read user data', () =>
    getDocument<UserData>(
      collections.users,
      userId,
      userConverter
    )
  );
}

// Update user data
export async function updateUserData(
  userId: string,
  data: Partial<UserData>
): Promise<void> {
  return withService('profile', 'update user data', () =>
    setDocument<UserData>(
      collections.users,
      userId,
      data as UserData,
      userConverter
    )
  );
}

// Check if user is seeded
export async function isUserSeeded(userId: string): Promise<boolean> {
  return withService('profile', 'check seed status', async () => {
    const userData = await getUserData(userId);
    return userData?.isSeeded ?? false;
  });
}

// Mark user as seeded
export async function markUserSeeded(userId: string): Promise<void> {
  return withService('profile', 'mark user seeded', () =>
    updateUserData(userId, { isSeeded: true })
  );
}
