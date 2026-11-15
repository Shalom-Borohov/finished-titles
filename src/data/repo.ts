import { normalizeEntry } from '../domain/entries'
import type { Entry, Genre } from '../domain/types'
import { db } from './db'

export type EntryDraft = Omit<Entry, 'id' | 'createdAt'>

export const allEntries = () => db.entries.toArray()

export async function addEntry(draft: EntryDraft, now: number) {
  await db.entries.add(normalizeEntry({ ...draft, id: crypto.randomUUID(), createdAt: now }))
}

export async function updateEntry(entry: Entry) {
  await db.transaction('rw', db.entries, async () => {
    const stored = await db.entries.get(entry.id)
    const genres = entry.genres ?? stored?.genres

    await db.entries.put(normalizeEntry({ ...entry, genres }))
  })
}

export async function fillMissingGenres(id: string, genres: Genre[]) {
  return db.transaction('rw', db.entries, async () => {
    const entry = await db.entries.get(id)

    if (!entry || entry.genres !== undefined) {
      return false
    }

    await db.entries.put(normalizeEntry({ ...entry, genres }))

    return true
  })
}

export async function deleteEntry(id: string) {
  await db.entries.delete(id)
}
