import { beforeEach, describe, expect, it } from 'vitest'
import { addEntry, allEntries, deleteEntry, updateEntry } from '../../src/data/repo'
import { resetDb } from '../helpers/db'

const NOW = 1_700_000_000_000

describe('repo', () => {
  beforeEach(resetDb)

  it('adds an entry with a new id and its creation time', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', rating: 'loved' }, NOW)

    const [saved] = await allEntries()

    expect(saved).toMatchObject({ title: 'Dune', type: 'movie', status: 'finished', rating: 'loved', createdAt: NOW })
    expect(saved.id).toEqual(expect.any(String))
  })

  it('gives each entry its own id', async () => {
    await addEntry({ title: 'One', type: 'book', status: 'finished' }, NOW)
    await addEntry({ title: 'Two', type: 'book', status: 'finished' }, NOW)

    const [first, second] = await allEntries()

    expect(first.id).not.toBe(second.id)
  })

  it('normalises on add, so stale fields are not kept', async () => {
    await addEntry({ title: '  Dune ', type: 'movie', status: 'finished', seasons: 2, stopReason: 'x' }, NOW)

    const [saved] = await allEntries()

    expect(saved.title).toBe('Dune')
    expect(saved.seasons).toBeUndefined()
    expect(saved.stopReason).toBeUndefined()
  })

  it('updates an entry, keeping its id and creation time, and drops fields that no longer apply', async () => {
    await addEntry({ title: 'Lost', type: 'series', status: 'stopped', stoppedSeason: 2, stopReason: 'נמרח' }, NOW)

    const [saved] = await allEntries()

    await updateEntry({ ...saved, status: 'finished', seasons: 6 })

    const [updated] = await allEntries()

    expect(updated).toMatchObject({ id: saved.id, createdAt: NOW, status: 'finished', seasons: 6 })
    expect(updated.stoppedSeason).toBeUndefined()
    expect(updated.stopReason).toBeUndefined()
  })

  it('deletes an entry', async () => {
    await addEntry({ title: 'Keep', type: 'book', status: 'finished' }, NOW)
    await addEntry({ title: 'Remove', type: 'book', status: 'finished' }, NOW)

    const remove = (await allEntries()).find(({ title }) => title === 'Remove')

    await deleteEntry(remove?.id ?? 'missing')

    expect((await allEntries()).map(({ title }) => title)).toEqual(['Keep'])
  })
})
