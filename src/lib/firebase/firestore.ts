import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreDataConverter,
  CollectionReference,
  DocumentReference,
  QueryConstraint,
  WithFieldValue,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Firestore rejects `undefined` values. Strip them recursively from any
 * object/array before every write. Applied automatically by setDocument,
 * updateDocument, and addDocument.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) return value;
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    return value.map(stripUndefinedDeep).filter((v) => v !== undefined) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const next = stripUndefinedDeep(v);
    if (next !== undefined) out[k] = next;
  }
  return out as T;
}

// Type-safe converter factory
export function createConverter<T>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data: WithFieldValue<T>): DocumentData => {
      // Convert Date objects to Timestamps
      const converted = { ...(data as object) } as DocumentData;
      for (const key in converted) {
        if (converted[key] instanceof Date) {
          converted[key] = Timestamp.fromDate(converted[key]);
        }
      }
      // Add server timestamp for updatedAt if not present
      if (!converted.updatedAt) {
        converted.updatedAt = serverTimestamp();
      }
      return converted;
    },
    fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>): T => {
      const data = snapshot.data();
      // Convert Timestamps back to Date objects and ISO strings
      const converted = { ...data } as Record<string, unknown>;
      for (const key in converted) {
        if (converted[key] instanceof Timestamp) {
          converted[key] = (converted[key] as Timestamp).toDate().toISOString();
        }
      }
      return { id: snapshot.id, ...converted } as unknown as T;
    },
  };
}

// Generic document operations
export async function getDocument<T>(
  collectionPath: string,
  docId: string,
  converter?: FirestoreDataConverter<T>,
): Promise<T | null> {
  if (!db) throw new Error('Firestore not initialized');

  const docRef = (
    converter
      ? doc(db, collectionPath, docId).withConverter(converter)
      : doc(db, collectionPath, docId)
  ) as DocumentReference<T>;

  const snapshot = await getDoc(docRef);
  return snapshot.exists() ? (snapshot.data() as T) : null;
}

export async function setDocument<T>(
  collectionPath: string,
  docId: string,
  data: WithFieldValue<T>,
  converter?: FirestoreDataConverter<T>,
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const safe = stripUndefinedDeep(data) as WithFieldValue<T>;
  const docRef = (
    converter
      ? doc(db, collectionPath, docId).withConverter(converter)
      : doc(db, collectionPath, docId)
  ) as DocumentReference<T>;

  await setDoc(docRef, safe, { merge: true });
}

export async function updateDocument<T>(
  collectionPath: string,
  docId: string,
  data: Partial<T>,
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const safe = stripUndefinedDeep(data) as DocumentData;
  const docRef = doc(db, collectionPath, docId);
  await updateDoc(docRef, safe);
}

export async function addDocument<T>(
  collectionPath: string,
  data: WithFieldValue<T>,
  converter?: FirestoreDataConverter<T>,
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const safe = stripUndefinedDeep(data) as WithFieldValue<T>;
  const colRef = (
    converter
      ? collection(db, collectionPath).withConverter(converter)
      : collection(db, collectionPath)
  ) as CollectionReference<T>;

  const docRef = await addDoc(colRef, safe);
  return docRef.id;
}

export async function deleteDocument(collectionPath: string, docId: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const docRef = doc(db, collectionPath, docId);
  await deleteDoc(docRef);
}

// Query operations
export async function queryDocuments<T>(
  collectionPath: string,
  constraints: QueryConstraint[],
  converter?: FirestoreDataConverter<T>,
): Promise<T[]> {
  if (!db) throw new Error('Firestore not initialized');

  const colRef = (
    converter
      ? collection(db, collectionPath).withConverter(converter)
      : collection(db, collectionPath)
  ) as CollectionReference<T>;

  const q = query(colRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as T);
}

export async function getAllDocuments<T>(
  collectionPath: string,
  converter?: FirestoreDataConverter<T>,
): Promise<T[]> {
  if (!db) throw new Error('Firestore not initialized');

  const colRef = (
    converter
      ? collection(db, collectionPath).withConverter(converter)
      : collection(db, collectionPath)
  ) as CollectionReference<T>;

  const snapshot = await getDocs(colRef);
  return snapshot.docs.map((doc) => doc.data() as T);
}

// Query constraint helpers
export { where, orderBy, limit };

// Timestamp helpers
export function toTimestamp(date: Date | string): Timestamp {
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date));
  }
  return Timestamp.fromDate(date);
}

export function fromTimestamp(timestamp: Timestamp): string {
  return timestamp.toDate().toISOString();
}

// Collection reference helper
export function getCollectionRef<T>(
  collectionPath: string,
  converter?: FirestoreDataConverter<T>,
): CollectionReference<T> {
  if (!db) throw new Error('Firestore not initialized');

  return converter
    ? collection(db, collectionPath).withConverter(converter)
    : (collection(db, collectionPath) as CollectionReference<T>);
}

// Document reference helper
export function getDocumentRef<T>(
  collectionPath: string,
  docId: string,
  converter?: FirestoreDataConverter<T>,
): DocumentReference<T> {
  if (!db) throw new Error('Firestore not initialized');

  return converter
    ? doc(db, collectionPath, docId).withConverter(converter)
    : (doc(db, collectionPath, docId) as DocumentReference<T>);
}
