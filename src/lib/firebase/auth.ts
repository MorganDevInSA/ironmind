import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from './config';

// Auth state observer
export function onAuthChange(callback: (user: User | null) => void) {
  if (!auth) {
    console.warn('Firebase auth not initialized');
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentUser(): User | null {
  return auth?.currentUser || null;
}

// Email/Password sign up
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  if (!auth) throw new Error('Firebase auth not initialized');

  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await sendEmailVerification(user);
  return user;
}

// Email/Password sign in
export async function signInWithEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase auth not initialized');

  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
}

// Resend verification link
export async function resendEmailVerification() {
  if (!auth) throw new Error('Firebase auth not initialized');
  if (!auth.currentUser) throw new Error('No authenticated user to verify');
  await sendEmailVerification(auth.currentUser);
}

// Google sign in
export async function signInWithGoogle() {
  if (!auth) throw new Error('Firebase auth not initialized');

  const provider = new GoogleAuthProvider();
  const { user } = await signInWithPopup(auth, provider);
  return user;
}

// Sign out
export async function logout() {
  if (!auth) throw new Error('Firebase auth not initialized');

  await signOut(auth);
}

// Get user UID
export function getUserId(): string | null {
  return auth?.currentUser?.uid || null;
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!auth?.currentUser;
}
