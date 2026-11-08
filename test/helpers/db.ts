import { db } from '../../src/data/db'

export async function resetDb() {
  await db.entries.clear()
}
