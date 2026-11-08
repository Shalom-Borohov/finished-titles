import Dexie, { type EntityTable } from 'dexie'
import type { Entry } from '../domain/types'

const DB_NAME = 'finished-titles'

class FinishedTitlesDb extends Dexie {
  entries!: EntityTable<Entry, 'id'>

  constructor() {
    super(DB_NAME)
    this.version(1).stores({
      entries: 'id',
    })
  }
}

export const db = new FinishedTitlesDb()
