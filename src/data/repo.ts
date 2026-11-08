import { normalizeEntry } from '../domain/entries'
import type { Entry } from '../domain/types'
import { db } from './db'

export type EntryDraft = Omit<Entry, 'id' | 'createdAt'>

export const allEntries = () => db.entries.toArray()

export async function addEntry(draft: EntryDraft, now: number) {
  await db.entries.add(normalizeEntry({ ...draft, id: crypto.randomUUID(), createdAt: now }))
}

export async function updateEntry(entry: Entry) {
  await db.entries.put(normalizeEntry(entry))
}

export async function deleteEntry(id: string) {
  await db.entries.delete(id)
}
