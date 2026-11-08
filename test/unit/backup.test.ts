import { beforeEach, describe, expect, it } from 'vitest'
import { exportBackup, parseBackup, restoreBackup } from '../../src/data/backup'
import { db } from '../../src/data/db'
import { addEntry, allEntries } from '../../src/data/repo'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'

const NOW = 1_700_000_000_000

const backupText = (entries: object[]) => JSON.stringify({ version: 1, exportedAt: NOW, entries })

describe('backup', () => {
  beforeEach(resetDb)

  it('survives a round trip through a file', async () => {
    await addEntry({ title: 'Frieren', type: 'anime', status: 'finished', rating: 'favorite', finishedOn: '2026-04-01', seasons: 1, note: 'יפה' }, NOW)
    await addEntry({ title: 'Lost', type: 'series', status: 'stopped', stoppedSeason: 2, stopReason: 'נמרח', finishedOn: '2019' }, NOW)

    const before = await allEntries()
    const text = JSON.stringify(await exportBackup(NOW))

    await resetDb()
    await restoreBackup(parseBackup(text))

    expect(await allEntries()).toEqual(before)
  })

  it('records when it was exported, and keeps poster links but no images', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', posterUrl: 'https://image.tmdb.org/t/p/w342/dune.jpg' }, NOW)

    const backup = await exportBackup(NOW)

    expect(backup.exportedAt).toBe(NOW)
    expect(backup.entries[0].posterUrl).toBe('https://image.tmdb.org/t/p/w342/dune.jpg')
  })

  it('replaces the whole list on restore', async () => {
    await addEntry({ title: 'Old', type: 'book', status: 'finished' }, NOW)

    await restoreBackup(parseBackup(backupText([entry({ title: 'New' })])))

    expect((await allEntries()).map(({ title }) => title)).toEqual(['New'])
  })

  it('imports an entry with only the required fields', () => {
    const minimal = { id: 'a', title: 'Dune', type: 'movie', status: 'finished', createdAt: NOW }

    expect(parseBackup(backupText([minimal])).entries).toEqual([minimal])
  })

  it.each([
    ['not JSON', '{oops'],
    ['another shape', '{"version":1}'],
    ['a future format', JSON.stringify({ version: 2, exportedAt: NOW, entries: [] })],
    ['an unknown type', backupText([{ id: 'a', title: 'x', type: 'podcast', status: 'finished', createdAt: NOW }])],
    ['a bad finish date', backupText([{ id: 'a', title: 'x', type: 'movie', status: 'finished', createdAt: NOW, finishedOn: 'soon' }])],
    ['a blank title', backupText([{ id: 'a', title: '  ', type: 'movie', status: 'finished', createdAt: NOW }])],
  ])('rejects %s', (_name, text) => {
    expect(() => parseBackup(text)).toThrow()
  })

  it('normalises restored entries, so a hand-edited file cannot store fields that do not apply', async () => {
    const seasonsOnAMovie = { id: 'a', title: 'Dune', type: 'movie', status: 'finished', createdAt: NOW, seasons: 3 }

    await restoreBackup(parseBackup(backupText([seasonsOnAMovie])))

    const [restored] = await allEntries()

    expect(restored.seasons).toBeUndefined()
  })

  it('keeps the list when a restore is not attempted after a bad file', async () => {
    await addEntry({ title: 'Keep', type: 'book', status: 'finished' }, NOW)

    expect(() => parseBackup('{oops')).toThrow()
    expect(await db.entries.count()).toBe(1)
  })
})
