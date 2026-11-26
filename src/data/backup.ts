import { array, check, type InferOutput, integer, is, maxValue, minValue, number, object, parse, parseJson, pipe, string } from 'valibot'
import { normalizeEntry } from '../domain/entries'
import { type Entry, entrySchema } from '../domain/types'
import { db } from './db'
import { allEntries } from './repo'

const FIRST_BACKUP_VERSION = 1

const BACKUP_VERSION = 2

const hasUniqueIds = (entries: Entry[]) => new Set(entries.map(({ id }) => id)).size === entries.length

const backupSchema = object({
  version: pipe(number(), integer(), minValue(FIRST_BACKUP_VERSION), maxValue(BACKUP_VERSION)),
  exportedAt: number(),
  entries: pipe(array(entrySchema), check(hasUniqueIds)),
})

const backupFileSchema = pipe(string(), parseJson(), backupSchema)

const newerBackupFileSchema = pipe(string(), parseJson(), object({ version: pipe(number(), integer(), minValue(BACKUP_VERSION + 1)) }))

export type Backup = InferOutput<typeof backupSchema>

export class NewerBackupError extends Error {}

export function parseBackup(text: string) {
  if (is(newerBackupFileSchema, text)) {
    throw new NewerBackupError()
  }

  return parse(backupFileSchema, text)
}

export async function exportBackup(now: number): Promise<Backup> {
  return { version: BACKUP_VERSION, exportedAt: now, entries: await allEntries() }
}

export async function restoreBackup(backup: Backup) {
  await db.transaction('rw', db.entries, async () => {
    await db.entries.clear()
    await db.entries.bulkPut(backup.entries.map(normalizeEntry))
  })
}
