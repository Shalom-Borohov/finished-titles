import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../src/data/db'
import { addEntry, allEntries, deleteEntry, fillMissingDetails, updateEntry } from '../../src/data/repo'
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

    await fillMissingDetails(openedOnForm.id, { genres: ['scifi'] })
    await updateEntry({ ...openedOnForm, rating: 'loved' })

    const [updated] = await allEntries()

    expect(updated).toMatchObject({ rating: 'loved', genres: ['scifi'] })
  })

  it('keeps stored lengths when an update never set them', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', source: 'tmdb', sourceId: 'movie/438631' }, NOW)

    const [openedOnForm] = await allEntries()

    await fillMissingDetails(openedOnForm.id, { lengthMinutes: [155] })
    await updateEntry({ ...openedOnForm, rating: 'loved' })

    const [updated] = await allEntries()

    expect(updated).toMatchObject({ rating: 'loved', lengthMinutes: [155] })
  })

  it('keeps stored lengths when a show changes type', async () => {
    await addEntry({ title: 'Severance', type: 'series', status: 'finished', lengthMinutes: [480, 500] }, NOW)

    const [saved] = await allEntries()

    await updateEntry({ ...saved, type: 'movie', status: 'stopped' })

    expect((await allEntries())[0].lengthMinutes).toEqual([480, 500])
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

    expect(await fillMissingDetails(saved.id, { genres: ['scifi'] })).toBe(true)
    expect((await allEntries())[0]).toEqual({ ...saved, genres: ['scifi'] })
  })

  it('fills in lengths that were never set', async () => {
    await addEntry({ title: 'Severance', type: 'series', status: 'finished', source: 'tmdb', sourceId: 'tv/95396' }, NOW)

    const [saved] = await allEntries()

    expect(await fillMissingDetails(saved.id, { lengthMinutes: [480, 0] })).toBe(true)
    expect((await allEntries())[0]).toEqual({ ...saved, lengthMinutes: [480, 0] })
  })

  it('fills genres and lengths together', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', source: 'tmdb', sourceId: 'movie/438631' }, NOW)

    const [saved] = await allEntries()

    expect(await fillMissingDetails(saved.id, { genres: ['scifi'], lengthMinutes: [155] })).toBe(true)
    expect((await allEntries())[0]).toEqual({ ...saved, genres: ['scifi'], lengthMinutes: [155] })
  })

  it('fills only the missing field when the other is already set', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', genres: ['drama'] }, NOW)

    const [saved] = await allEntries()

    expect(await fillMissingDetails(saved.id, { genres: ['scifi'], lengthMinutes: [155] })).toBe(true)
    expect((await allEntries())[0]).toMatchObject({ genres: ['drama'], lengthMinutes: [155] })
  })

  it.each([
    ['genres the owner ticked', ['drama']],
    ['genres the owner cleared', []],
  ] as const)('does not overwrite %s', async (_name, genres) => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', genres: [...genres] }, NOW)

    const [saved] = await allEntries()

    expect(await fillMissingDetails(saved.id, { genres: ['scifi'] })).toBe(false)
    expect((await allEntries())[0].genres).toEqual(genres)
  })

  it.each([
    ['lengths already found', [155]],
    ['lengths TMDB did not have', []],
  ] as const)('does not overwrite %s', async (_name, lengthMinutes) => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', lengthMinutes: [...lengthMinutes] }, NOW)

    const [saved] = await allEntries()

    expect(await fillMissingDetails(saved.id, { lengthMinutes: [90] })).toBe(false)
    expect((await allEntries())[0].lengthMinutes).toEqual(lengthMinutes)
  })

  it('does not bring back an entry deleted meanwhile', async () => {
    expect(await fillMissingDetails('missing', { genres: ['scifi'], lengthMinutes: [155] })).toBe(false)
    expect(await allEntries()).toEqual([])
  })

  it('normalises when it fills details', async () => {
    await db.entries.put({ id: 'a', title: ' Dune ', type: 'movie', status: 'finished', createdAt: NOW, seasons: 2 })

    await fillMissingDetails('a', { genres: ['scifi'] })

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
