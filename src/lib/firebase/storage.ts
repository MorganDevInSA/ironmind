import {
  ref,
  uploadBytes,
  getBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  uploadString,
  getMetadata,
} from 'firebase/storage';
import { storage } from './config';

// Upload file
export async function uploadFile(
  path: string,
  file: File | Blob,
  metadata?: { contentType?: string; customMetadata?: Record<string, string> },
): Promise<string> {
  if (!storage) throw new Error('Firebase storage not initialized');

  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, metadata);
  return getDownloadURL(fileRef);
}

// Upload base64 string (for photos from camera)
export async function uploadBase64(
  path: string,
  base64String: string,
  contentType = 'image/jpeg',
): Promise<string> {
  if (!storage) throw new Error('Firebase storage not initialized');

  const fileRef = ref(storage, path);
  await uploadString(fileRef, base64String, 'base64', { contentType });
  return getDownloadURL(fileRef);
}

// Get download URL
export async function getFileUrl(path: string): Promise<string> {
  if (!storage) throw new Error('Firebase storage not initialized');

  const fileRef = ref(storage, path);
  return getDownloadURL(fileRef);
}

// Delete file
export async function deleteFile(path: string): Promise<void> {
  if (!storage) throw new Error('Firebase storage not initialized');

  const fileRef = ref(storage, path);
  await deleteObject(fileRef);
}

/** Full Storage paths under `users/{uid}/photos/pending/` (object names, not prefixes). */
export async function listPendingProgressPhotoPaths(userId: string): Promise<string[]> {
  if (!storage) throw new Error('Firebase storage not initialized');

  const dirRef = ref(storage, `users/${userId}/photos/pending`);
  const result = await listAll(dirRef);
  return result.items.map((item) => item.fullPath);
}

export async function deleteStoragePaths(paths: string[]): Promise<void> {
  await Promise.all(paths.map((p) => deleteFile(p)));
}

// List files in directory
export async function listFiles(path: string): Promise<{ name: string; path: string }[]> {
  if (!storage) throw new Error('Firebase storage not initialized');

  const dirRef = ref(storage, path);
  const result = await listAll(dirRef);

  return result.items.map((item) => ({
    name: item.name,
    path: item.fullPath,
  }));
}

// Get file metadata
export async function getFileMetadata(path: string) {
  if (!storage) throw new Error('Firebase storage not initialized');

  const fileRef = ref(storage, path);
  return getMetadata(fileRef);
}

// Progress tracking upload (returns upload task)
export function createUploadTask(path: string, file: File | Blob) {
  if (!storage) throw new Error('Firebase storage not initialized');

  const fileRef = ref(storage, path);
  return { ref: fileRef, uploadTask: uploadBytes(fileRef, file) };
}

// Generate unique file path
export function generateFilePath(userId: string, folder: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `users/${userId}/${folder}/${timestamp}_${sanitizedName}`;
}

/**
 * Move bytes from a pending object to a final path (copy + delete pending).
 * Used so failed check-ins can avoid committing a final URL until Firestore succeeds (future UI);
 * today `uploadProgressPhoto` runs both steps in one service call with cleanup on failure.
 */
export async function commitPendingStorageUpload(options: {
  pendingPath: string;
  finalPath: string;
  contentType?: string;
}): Promise<string> {
  if (!storage) throw new Error('Firebase storage not initialized');

  const { pendingPath, finalPath, contentType } = options;
  const pendingRef = ref(storage, pendingPath);
  const bytes = await getBytes(pendingRef);

  const finalRef = ref(storage, finalPath);
  await uploadBytes(finalRef, bytes, contentType ? { contentType } : undefined);
  await deleteObject(pendingRef);
  return getDownloadURL(finalRef);
}
