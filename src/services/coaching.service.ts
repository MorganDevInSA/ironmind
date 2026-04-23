import type { Phase, JournalEntry } from '@/lib/types';
import {
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  getCollectionCount,
  getDocumentRef,
  runFirestoreTransaction,
  stripUndefinedDeep,
  where,
  orderBy,
  limit,
  createConverter,
} from '@/lib/firebase';
import type { QueryConstraint } from 'firebase/firestore';
import { format, subDays } from 'date-fns';
import { collections } from '@/lib/firebase/config';
import { ServiceError, withService } from '@/lib/errors';

/**
 * Journal list / search / tag bounds (principal review: power-user contract).
 * Documented in `Documentation/ARCHITECTURE.md` §8 — raise only with index + product review.
 */
/** Default cap for journal list queries (UI / hooks). */
const DEFAULT_JOURNAL_LIST_LIMIT = 200;
/** Max entries scanned for client-side search / tag aggregation. */
const JOURNAL_SEARCH_SCAN_LIMIT = 500;
/** Calendar days to scan for title/content search (Phase B — bounded window). */
const JOURNAL_SEARCH_WINDOW_DAYS = 120;
/** Calendar days to scan when building the tag universe. */
const JOURNAL_TAGS_WINDOW_DAYS = 180;

const phaseConverter = createConverter<Phase>();
const journalConverter = createConverter<JournalEntry>();

// Phases

export async function getPhases(userId: string): Promise<Phase[]> {
  return withService('coaching', 'read phases', () =>
    queryDocuments<Phase>(
      collections.phases(userId),
      [orderBy('startDate', 'desc')],
      phaseConverter,
    ),
  );
}

export async function getActivePhase(userId: string): Promise<Phase | null> {
  return withService('coaching', 'read active phase', async () => {
    const phases = await queryDocuments<Phase>(
      collections.phases(userId),
      [where('isActive', '==', true), limit(1)],
      phaseConverter,
    );
    return phases[0] || null;
  });
}

export async function getPhase(userId: string, phaseId: string): Promise<Phase | null> {
  return withService('coaching', 'read phase', () =>
    getDocument<Phase>(collections.phases(userId), phaseId, phaseConverter),
  );
}

export async function createPhase(userId: string, phase: Omit<Phase, 'id'>): Promise<string> {
  return withService('coaching', 'create phase', () =>
    addDocument<Phase>(collections.phases(userId), phase as Phase, phaseConverter),
  );
}

export async function updatePhase(
  userId: string,
  phaseId: string,
  updates: Partial<Phase>,
): Promise<void> {
  return withService('coaching', 'update phase', () =>
    updateDocument<Phase>(collections.phases(userId), phaseId, updates),
  );
}

export async function setActivePhase(userId: string, phaseId: string): Promise<void> {
  return withService('coaching', 'set active phase', async () => {
    const phases = await getPhases(userId);
    if (!phases.some((p) => p.id === phaseId)) {
      throw new ServiceError('That coaching phase was not found.', 'NOT_FOUND', 'coaching');
    }

    const path = collections.phases(userId);
    await runFirestoreTransaction(async (transaction) => {
      const refs = phases.map((p) => getDocumentRef<Phase>(path, p.id, phaseConverter));
      const snaps = await Promise.all(refs.map((r) => transaction.get(r)));
      for (let i = 0; i < snaps.length; i++) {
        if (!snaps[i].exists()) {
          throw new ServiceError(
            `Coaching phase ${phases[i].id} is missing in the database.`,
            'NOT_FOUND',
            'coaching',
          );
        }
      }

      for (const phase of phases) {
        const ref = getDocumentRef<Phase>(path, phase.id, phaseConverter);
        const shouldBeActive = phase.id === phaseId;
        if (phase.isActive !== shouldBeActive) {
          const patch = stripUndefinedDeep({ isActive: shouldBeActive });
          transaction.update(ref, patch as Partial<Phase>);
        }
      }
    });
  });
}

/**
 * Idempotent repair when multiple phases are `isActive: true`. Picks newest `updatedAt`, then
 * `startDate`, then `id`, then **`setActivePhase`** to normalize. No-op if ≤1 active.
 * Not called automatically — support tooling or future Settings only.
 */
export async function repairMultipleActivePhases(userId: string): Promise<void> {
  return withService('coaching', 'repair multiple active phases', async () => {
    const phases = await getPhases(userId);
    const active = phases.filter((p) => p.isActive);
    if (active.length <= 1) return;

    type Row = Phase & { updatedAt?: string };
    const winner = [...(active as Row[])].sort((a, b) => {
      const ua = a.updatedAt ?? '';
      const ub = b.updatedAt ?? '';
      if (ua !== ub) return ub.localeCompare(ua);
      return b.startDate.localeCompare(a.startDate) || a.id.localeCompare(b.id);
    })[0];

    await setActivePhase(userId, winner.id);
  });
}

export async function deletePhase(userId: string, phaseId: string): Promise<void> {
  return withService('coaching', 'delete phase', () =>
    deleteDocument(collections.phases(userId), phaseId),
  );
}

// Journal Entries

export async function getJournalEntries(
  userId: string,
  limitCount?: number,
): Promise<JournalEntry[]> {
  return withService('coaching', 'read journal entries', () => {
    const cap = limitCount ?? DEFAULT_JOURNAL_LIST_LIMIT;
    const constraints: QueryConstraint[] = [orderBy('date', 'desc'), limit(cap)];

    return queryDocuments<JournalEntry>(
      collections.journalEntries(userId),
      constraints,
      journalConverter,
    );
  });
}

export async function getJournalEntry(
  userId: string,
  entryId: string,
): Promise<JournalEntry | null> {
  return withService('coaching', 'read journal entry', () =>
    getDocument<JournalEntry>(collections.journalEntries(userId), entryId, journalConverter),
  );
}

export async function createJournalEntry(
  userId: string,
  entry: Omit<JournalEntry, 'id'>,
): Promise<string> {
  return withService('coaching', 'create journal entry', () =>
    addDocument<JournalEntry>(
      collections.journalEntries(userId),
      entry as JournalEntry,
      journalConverter,
    ),
  );
}

export async function updateJournalEntry(
  userId: string,
  entryId: string,
  updates: Partial<JournalEntry>,
): Promise<void> {
  return withService('coaching', 'update journal entry', () =>
    updateDocument<JournalEntry>(collections.journalEntries(userId), entryId, updates),
  );
}

export async function deleteJournalEntry(userId: string, entryId: string): Promise<void> {
  return withService('coaching', 'delete journal entry', () =>
    deleteDocument(collections.journalEntries(userId), entryId),
  );
}

// Get journal entries by tag
export async function getJournalEntriesByTag(userId: string, tag: string): Promise<JournalEntry[]> {
  return withService('coaching', 'read journal entries by tag', () =>
    queryDocuments<JournalEntry>(
      collections.journalEntries(userId),
      [
        where('tags', 'array-contains', tag),
        orderBy('date', 'desc'),
        limit(JOURNAL_SEARCH_SCAN_LIMIT),
      ],
      journalConverter,
    ),
  );
}

// Search journal entries (bounded to recent calendar window + row cap)
export async function searchJournalEntries(
  userId: string,
  searchTerm: string,
  maxScanDays: number = JOURNAL_SEARCH_WINDOW_DAYS,
): Promise<JournalEntry[]> {
  return withService('coaching', 'search journal entries', async () => {
    const toStr = format(new Date(), 'yyyy-MM-dd');
    const fromStr = format(subDays(new Date(), maxScanDays), 'yyyy-MM-dd');
    const entries = await getJournalEntriesInRange(userId, fromStr, toStr);
    const lowerTerm = searchTerm.toLowerCase();

    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerTerm) ||
        entry.content.toLowerCase().includes(lowerTerm) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(lowerTerm)),
    );
  });
}

// Get all unique tags (bounded window — not full account history)
export async function getAllTags(
  userId: string,
  maxScanDays: number = JOURNAL_TAGS_WINDOW_DAYS,
): Promise<string[]> {
  return withService('coaching', 'read all tags', async () => {
    const toStr = format(new Date(), 'yyyy-MM-dd');
    const fromStr = format(subDays(new Date(), maxScanDays), 'yyyy-MM-dd');
    const entries = await getJournalEntriesInRange(userId, fromStr, toStr);
    const tagsSet = new Set<string>();

    for (const entry of entries) {
      for (const tag of entry.tags) {
        tagsSet.add(tag);
      }
    }

    return Array.from(tagsSet).sort();
  });
}

// Get journal entry count
export async function getJournalEntryCount(userId: string): Promise<number> {
  return withService('coaching', 'count journal entries', () =>
    getCollectionCount(collections.journalEntries(userId)),
  );
}

// Get entries from specific date range
export async function getJournalEntriesInRange(
  userId: string,
  from: string,
  to: string,
): Promise<JournalEntry[]> {
  return withService('coaching', 'read journal entries in range', () =>
    queryDocuments<JournalEntry>(
      collections.journalEntries(userId),
      [
        where('date', '>=', from),
        where('date', '<=', to),
        orderBy('date', 'desc'),
        limit(JOURNAL_SEARCH_SCAN_LIMIT),
      ],
      journalConverter,
    ),
  );
}
