import { normalizeEntry } from '../domain/entries'
import type { Entry } from '../domain/types'
import { db } from './db'

export type EntryDraft = Omit<Entry, 'id' | 'createdAt'>

type FoundDetails = Pick<Entry, 'genres' | 'lengthMinutes'>

export const allEntries = () => db.entries.toArray()

export async function addEntry(draft: EntryDraft, now: number) {
  await db.entries.add(normalizeEntry({ ...draft, id: crypto.randomUUID(), createdAt: now }))
}

export async function updateEntry(entry: Entry) {
  await db.transaction('rw', db.entries, async () => {
    const stored = await db.entries.get(entry.id)
    const genres = entry.genres ?? stored?.genres
    const lengthMinutes = entry.lengthMinutes ?? stored?.lengthMinutes

    await db.entries.put(normalizeEntry({ ...entry, genres, lengthMinutes }))
  })
}

export async function fillMissingDetails(id: string, details: FoundDetails) {
  return db.transaction('rw', db.entries, async () => {
    const entry = await db.entries.get(id)

    if (!entry) {
      return false
    }

    const genres = entry.genres ?? details.genres
    const lengthMinutes = entry.lengthMinutes ?? details.lengthMinutes

    if (genres === entry.genres && lengthMinutes === entry.lengthMinutes) {
      return false
    }

    await db.entries.put(normalizeEntry({ ...entry, genres, lengthMinutes }))

    return true
  })
}

export async function deleteEntry(id: string) {
  await db.entries.delete(id)
}
