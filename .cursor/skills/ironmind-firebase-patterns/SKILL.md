---
name: ironmind-firebase-patterns
description: Correct Firebase and Firestore patterns for IRONMIND. Use when writing or editing any Firebase service, Firestore query, auth integration, or storage upload. Prevents generic type errors, wrong function names, constraint type mismatches, and security gaps.
---

# IRONMIND Firebase Patterns

## Firestore Function Reference

These are the ONLY functions exported from `src/lib/firebase/firestore.ts`. Use exactly these names:

| Function              | Signature                           | Use for                 |
| --------------------- | ----------------------------------- | ----------------------- |
| `getDocument<T>`      | `(path, docId, converter?)`         | Fetch single doc        |
| `setDocument<T>`      | `(path, docId, data, converter?)`   | Create or merge doc     |
| `updateDocument<T>`   | `(path, docId, data)`               | Partial update          |
| `addDocument<T>`      | `(path, data, converter?)`          | Add with auto-ID        |
| `deleteDocument`      | `(path, docId)`                     | Delete doc              |
| `queryDocuments<T>`   | `(path, constraints[], converter?)` | Query with filters      |
| `getAllDocuments<T>`  | `(path, converter?)`                | Fetch entire collection |
| `getCollectionRef<T>` | `(path, converter?)`                | Raw collection ref      |
| `getDocumentRef<T>`   | `(path, docId, converter?)`         | Raw document ref        |

> ⚠️ `getDocuments` does NOT exist. Use `getAllDocuments`.

---

## Firestore Generic Type Pattern

The correct pattern for type-safe Firestore operations with optional converters uses type assertions to resolve TypeScript's union type complaints:

```ts
// ✅ CORRECT pattern for getDocument
export async function getDocument<T>(
  collectionPath: string,
  docId: string,
  converter?: FirestoreDataConverter<T>,
): Promise<T | null> {
  if (!db) throw new Error('Firestore not initialized');
  const base = doc(db, collectionPath, docId);
  const docRef = converter ? base.withConverter(converter) : base;
  const snapshot = await getDoc(docRef as DocumentReference<T>);
  return snapshot.exists() ? (snapshot.data() as T) : null;
}

// ✅ CORRECT pattern for queryDocuments
export async function queryDocuments<T>(
  collectionPath: string,
  constraints: QueryConstraint[],
  converter?: FirestoreDataConverter<T>,
): Promise<T[]> {
  if (!db) throw new Error('Firestore not initialized');
  const base = collection(db, collectionPath);
  const colRef = converter ? base.withConverter(converter) : base;
  const q = query(colRef as CollectionReference<T>, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as T);
}
```

Key insight: use `as DocumentReference<T>` / `as CollectionReference<T>` after the ternary to resolve the union.

---

## Query Constraints — Always Use `QueryConstraint[]`

```ts
// ✅ CORRECT — all constraint types extend QueryConstraint
import type { QueryConstraint } from 'firebase/firestore';

function buildConstraints(userId: string, limitCount: number): QueryConstraint[] {
  return [where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(limitCount)];
}
```

---

## Collection Paths — Always Use `collections` Helper

Never hardcode Firestore paths. Always use the `collections` object from `src/lib/firebase/config.ts`:

```ts
import { collections } from '@/lib/firebase/config';

// ✅ CORRECT
await getDocument(collections.profiles(userId), 'data', converter);
await getAllDocuments(collections.workouts(userId), converter);

// ❌ WRONG — hardcoded paths break if structure changes
await getDocument(`users/${userId}/profile`, 'data', converter);
```

Available paths:

```ts
collections.users; // 'users'
collections.profiles(uid); // 'users/{uid}/profile'
collections.programs(uid); // 'users/{uid}/programs'
collections.workouts(uid); // 'users/{uid}/workouts'
collections.nutritionDays(uid); // 'users/{uid}/nutrition'
collections.supplementLogs(uid); // 'users/{uid}/supplements'
collections.recoveryEntries(uid); // 'users/{uid}/recovery'
collections.checkIns(uid); // 'users/{uid}/checkins'
collections.phases(uid); // 'users/{uid}/phases'
collections.journalEntries(uid); // 'users/{uid}/journal'
collections.volumeLandmarks(uid); // 'users/{uid}/landmarks'
collections.supplementProtocol(uid); // 'users/{uid}/protocol'
```

---

## Null-Safety for `db`, `auth`, `storage`

All three Firebase service instances are `null` when config is missing. Always guard before use:

```ts
// ✅ Already handled inside lib/firebase/firestore.ts
if (!db) throw new Error('Firestore not initialized');

// In services — the guard is inside the helpers, so services don't need to repeat it
// But if calling Firebase SDK directly (avoid this), always check:
if (!auth) return null;
```

---

## No `undefined` in write payloads

The Firestore Web SDK **rejects `undefined`** as a field value (nested objects included). When merging partial updates:

- Build objects with **only defined keys**, or
- **Strip** `undefined` recursively before `setDocument` / `setDoc`.

Reference implementation: **`stripUndefinedDeep`** in `src/services/physique.service.ts` (check-ins with optional measurements). Apply the same idea for any domain that sends optional nested fields from forms.

---

## Firestore Timestamps → ISO Strings

The Firestore converter in `firestore.ts` automatically:

- **Writes**: converts `Date` objects → Firestore `Timestamp`
- **Reads**: converts Firestore `Timestamp` → ISO string (`string`)

This means ALL date/time fields in your TypeScript types **must be typed as `string`**, not `Date`.

```ts
// ✅ CORRECT type definition
interface WorkoutSession {
  date: string; // ISO string — what you receive from Firestore
  createdAt: string; // ISO string
}

// ❌ WRONG
interface WorkoutSession {
  date: Date; // Will actually be a string at runtime
}
```

---

## Auth Patterns

```ts
// Sign in
import { signInWithEmail, signInWithGoogle } from '@/lib/firebase';

// Sign out
import { signOut } from '@/lib/firebase';

// Observe auth state (use in AuthGuard only)
import { onAuthChange } from '@/lib/firebase';

// Never call Firebase auth SDK directly in components
// ❌ import { signInWithEmailAndPassword } from 'firebase/auth';
```

---

## Firebase Storage — Photo Uploads

```ts
import { uploadFile, getDownloadURL, deleteFile } from '@/services/storage.service';
// OR directly:
import { uploadBytes, getDownloadURL } from '@/lib/firebase';

// Path convention for progress photos:
// users/{uid}/photos/{checkInId}.jpg
```

---

## Firestore Security Rules — Committed & CI-Deployed

The live rules are in **`firestore.rules`** at the repo root, committed. They enforce owner-only access with a deny-all fallback:

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function isOwner(userId) { return isSignedIn() && request.auth.uid == userId; }

    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    match /users/{userId}/{collection}/{document=**} {
      allow read, write: if isOwner(userId);
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Storage rules** are in `storage.rules` (same owner-only pattern for `users/{userId}/**`).
**Indexes** are pre-declared in `firestore.indexes.json` — every composite query must have a matching index committed there.

### Deploy flow (CI, not manual)

Rules and indexes deploy from `.github/workflows/firebase-rules.yml` on push to `main` when any of these files change. The workflow uses a service account JSON (`FIREBASE_SERVICE_ACCOUNT` GitHub secret) with Rules Admin + Index Admin roles — minimum necessary permissions.

For a one-off manual deploy from a trusted machine:

```bash
# Rules only
npm run deploy:rules
# Indexes only
npm run deploy:indexes
# Or directly:
firebase deploy --only firestore:rules,firestore:indexes,storage:rules --project ironmindmp
```

**Never** edit rules in the Firebase console — changes will be overwritten by the next CI deploy. Edit `firestore.rules` and merge. See **`ironmind-cicd`** skill for the full pipeline.

---

## Offline Persistence

IndexedDB persistence is enabled in `src/lib/firebase/config.ts`. This means:

- First load requires network for seeding
- Subsequent loads can use cached data
- `'unavailable'` errors are expected when offline — handle gracefully, never throw to UI
- Seeding failures must be non-blocking (fire-and-forget with `.catch()`)

```ts
// ✅ Non-blocking seed pattern
seedUserData(uid).catch((err) => {
  if (err?.code === 'unavailable') {
    console.warn('Offline — seed deferred to next login');
  } else {
    console.error('Seed error:', err);
  }
});
```
