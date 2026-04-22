import type { Phase, JournalEntry } from '@/lib/types';
import {
  getDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  queryDocuments,
  where,
  orderBy,
  limit,
  createConverter,
} from '@/lib/firebase';
import type { QueryConstraint } from 'firebase/firestore';
import { collections } from '@/lib/firebase/config';
import { withService } from '@/lib/errors';

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
    for (const phase of phases) {
      if (phase.id !== phaseId && phase.isActive) {
        await updatePhase(userId, phase.id, { isActive: false });
      }
    }
    await updatePhase(userId, phaseId, { isActive: true });
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
    const constraints: QueryConstraint[] = [orderBy('date', 'desc')];
    if (limitCount) {
      constraints.push(limit(limitCount));
    }

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
      [where('tags', 'array-contains', tag), orderBy('date', 'desc')],
      journalConverter,
    ),
  );
}

// Search journal entries
export async function searchJournalEntries(
  userId: string,
  searchTerm: string,
): Promise<JournalEntry[]> {
  return withService('coaching', 'search journal entries', async () => {
    const entries = await getJournalEntries(userId);
    const lowerTerm = searchTerm.toLowerCase();

    return entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(lowerTerm) ||
        entry.content.toLowerCase().includes(lowerTerm) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(lowerTerm)),
    );
  });
}

// Get all unique tags
export async function getAllTags(userId: string): Promise<string[]> {
  return withService('coaching', 'read all tags', async () => {
    const entries = await getJournalEntries(userId);
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
  return withService('coaching', 'count journal entries', async () => {
    const entries = await getJournalEntries(userId);
    return entries.length;
  });
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
      [where('date', '>=', from), where('date', '<=', to), orderBy('date', 'desc')],
      journalConverter,
    ),
  );
}
