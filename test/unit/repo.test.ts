import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../src/data/db'
import { addEntry, allEntries, deleteEntry, fillMissingGenres, updateEntry } from '../../src/data/repo'
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

  it('keeps stored genres when an update never set them', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', source: 'tmdb', sourceId: 'movie/438631' }, NOW)

    const [openedOnForm] = await allEntries()

    await fillMissingGenres(openedOnForm.id, ['scifi'])
    await updateEntry({ ...openedOnForm, rating: 'loved' })

    const [updated] = await allEntries()

    expect(updated).toMatchObject({ rating: 'loved', genres: ['scifi'] })
  })

  it('saves genres an update cleared', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', genres: ['scifi'] }, NOW)

    const [saved] = await allEntries()

    await updateEntry({ ...saved, genres: [] })

    const [updated] = await allEntries()

    expect(updated.genres).toEqual([])
  })

  it('fills in genres that were never set', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', source: 'tmdb', sourceId: 'movie/438631' }, NOW)

    const [saved] = await allEntries()

    expect(await fillMissingGenres(saved.id, ['scifi'])).toBe(true)
    expect((await allEntries())[0]).toEqual({ ...saved, genres: ['scifi'] })
  })

  it.each([
    ['genres the owner ticked', ['drama']],
    ['genres the owner cleared', []],
  ] as const)('does not overwrite %s', async (_name, genres) => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', genres: [...genres] }, NOW)

    const [saved] = await allEntries()

    expect(await fillMissingGenres(saved.id, ['scifi'])).toBe(false)
    expect((await allEntries())[0].genres).toEqual(genres)
  })

  it('does not bring back an entry deleted meanwhile', async () => {
    expect(await fillMissingGenres('missing', ['scifi'])).toBe(false)
    expect(await allEntries()).toEqual([])
  })

  it('normalises when it fills genres', async () => {
    await db.entries.put({ id: 'a', title: ' Dune ', type: 'movie', status: 'finished', createdAt: NOW, seasons: 2 })

    await fillMissingGenres('a', ['scifi'])

    const [filled] = await allEntries()

    expect(filled.title).toBe('Dune')
    expect(filled.seasons).toBeUndefined()
  })

  it('deletes an entry', async () => {
    await addEntry({ title: 'Keep', type: 'book', status: 'finished' }, NOW)
    await addEntry({ title: 'Remove', type: 'book', status: 'finished' }, NOW)

    const remove = (await allEntries()).find(({ title }) => title === 'Remove')

    await deleteEntry(remove?.id ?? 'missing')

    expect((await allEntries()).map(({ title }) => title)).toEqual(['Keep'])
  })
})
