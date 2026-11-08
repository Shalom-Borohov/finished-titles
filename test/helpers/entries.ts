import type { Entry } from '../../src/domain/types'

const FIRST_CREATED_AT = 1_000

let nextId = 0

export function entry(fields: Partial<Entry> = {}): Entry {
  nextId += 1

  return {
    id: `entry-${nextId}`,
    title: `Title ${nextId}`,
    type: 'movie',
    status: 'finished',
    createdAt: FIRST_CREATED_AT + nextId,
    ...fields,
  }
}
