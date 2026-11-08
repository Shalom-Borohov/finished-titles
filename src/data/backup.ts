import { array, type InferOutput, literal, number, object, parse, parseJson, pipe, string } from 'valibot'
import { normalizeEntry } from '../domain/entries'
import { entrySchema } from '../domain/types'
import { db } from './db'
import { allEntries } from './repo'

const BACKUP_VERSION = 1

const backupSchema = object({
  version: literal(BACKUP_VERSION),
  exportedAt: number(),
  entries: array(entrySchema),
})

const backupFileSchema = pipe(string(), parseJson(), backupSchema)

export type Backup = InferOutput<typeof backupSchema>

export const parseBackup = (text: string) => parse(backupFileSchema, text)

export async function exportBackup(now: number): Promise<Backup> {
  return { version: BACKUP_VERSION, exportedAt: now, entries: await allEntries() }
}

export async function restoreBackup(backup: Backup) {
  await db.transaction('rw', db.entries, async () => {
    await db.entries.clear()
    await db.entries.bulkPut(backup.entries.map(normalizeEntry))
  })
}
