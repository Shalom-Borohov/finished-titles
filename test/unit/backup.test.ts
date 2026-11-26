import { beforeEach, describe, expect, it } from 'vitest'
import { exportBackup, NewerBackupError, parseBackup, restoreBackup } from '../../src/data/backup'
import { db } from '../../src/data/db'
import { addEntry, allEntries } from '../../src/data/repo'
import { entrySchema, GENRES, MEDIA_TYPES, RATINGS, SEARCH_SOURCES, STATUSES } from '../../src/domain/types'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'

const NOW = 1_700_000_000_000

const backupText = (entries: object[]) => JSON.stringify({ version: 1, exportedAt: NOW, entries })

const sorted = (items: readonly string[]) => items.toSorted()

const VERSION_3_FORMAT = {
  version: 3,
  backupFields: ['entries', 'exportedAt', 'version'],
  entryFields: sorted([
    'id',
    'title',
    'type',
    'status',
    'createdAt',
    'releaseYear',
    'endYear',
    'posterUrl',
    'source',
    'sourceId',
    'rating',
    'note',
    'finishedOn',
    'seasons',
    'stoppedSeason',
    'stopReason',
    'genres',
    'hours',
    'lengthMinutes',
  ]),
  types: sorted(['anime', 'series', 'movie', 'book', 'game', 'comic', 'other']),
  statuses: sorted(['finished', 'stopped', 'ongoing']),
  ratings: sorted(['favorite', 'loved', 'liked', 'okay', 'disliked']),
  genres: sorted([
    'horror',
    'animation',
    'action',
    'drama',
    'history',
    'adventure',
    'kids',
    'scifi',
    'music',
    'thriller',
    'war',
    'mystery',
    'western',
    'family',
    'politics',
    'fantasy',
    'crime',
    'comedy',
    'reality',
    'romance',
    'documentary',
  ]),
  sources: sorted(['tmdb', 'openlibrary', 'igdb']),
}

describe('backup', () => {
  beforeEach(resetDb)

  it('is version 3, and any field or allowed value added to the format needs a new version', async () => {
    const backup = await exportBackup(NOW)

    expect({
      version: backup.version,
      backupFields: sorted(Object.keys(backup)),
      entryFields: sorted(Object.keys(entrySchema.entries)),
      types: sorted(MEDIA_TYPES),
      statuses: sorted(STATUSES),
      ratings: sorted(RATINGS),
      genres: sorted(GENRES),
      sources: sorted(SEARCH_SOURCES),
    }).toEqual(VERSION_3_FORMAT)
  })

  it('survives a round trip through a file', async () => {
    await addEntry({ title: 'Frieren', type: 'anime', status: 'finished', rating: 'favorite', finishedOn: '2026-04-01', seasons: 1, note: 'יפה' }, NOW)
    await addEntry({ title: 'Lost', type: 'series', status: 'stopped', stoppedSeason: 2, stopReason: 'נמרח', finishedOn: '2019' }, NOW)

    const before = await allEntries()
    const text = JSON.stringify(await exportBackup(NOW))

    await resetDb()
    await restoreBackup(parseBackup(text))

    expect(await allEntries()).toEqual(before)
  })

  it('keeps genres through a round trip, including an empty list', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', genres: ['scifi', 'drama'] }, NOW)
    await addEntry({ title: 'Cleared', type: 'book', status: 'stopped', genres: [] }, NOW)

    const before = await allEntries()
    const text = JSON.stringify(await exportBackup(NOW))

    await resetDb()
    await restoreBackup(parseBackup(text))

    const restored = await allEntries()

    expect(restored).toEqual(before)
    expect(restored.map(({ genres }) => genres)).toEqual(expect.arrayContaining([['scifi', 'drama'], []]))
  })

  it('keeps the TMDB lengths through a round trip, including an empty list', async () => {
    await addEntry({ title: 'Dune', type: 'movie', status: 'finished', lengthMinutes: [155] }, NOW)
    await addEntry({ title: 'Severance', type: 'series', status: 'stopped', lengthMinutes: [480, 0] }, NOW)
    await addEntry({ title: 'Unknown', type: 'movie', status: 'finished', lengthMinutes: [] }, NOW)

    const before = await allEntries()
    const text = JSON.stringify(await exportBackup(NOW))

    await resetDb()
    await restoreBackup(parseBackup(text))

    const restored = await allEntries()

    expect(restored).toEqual(before)
    expect(restored.map(({ lengthMinutes }) => lengthMinutes)).toEqual(expect.arrayContaining([[155], [480, 0], []]))
  })

  it('still imports a version 2 backup, leaving the lengths unset', async () => {
    const versionTwoMovie = { id: 'a', title: 'Dune', type: 'movie', status: 'finished', createdAt: NOW, genres: ['scifi'] }

    await restoreBackup(parseBackup(JSON.stringify({ version: 2, exportedAt: NOW, entries: [versionTwoMovie] })))

    const [restored] = await allEntries()

    expect(restored).toMatchObject({ title: 'Dune', genres: ['scifi'] })
    expect(restored.lengthMinutes).toBeUndefined()
  })

  it('keeps a game still being played and its hours through a round trip', async () => {
    await addEntry({ title: 'Destiny 2', type: 'game', status: 'ongoing', hours: 1200, finishedOn: '2020' }, NOW)

    const text = JSON.stringify(await exportBackup(NOW))

    await resetDb()
    await restoreBackup(parseBackup(text))

    expect((await allEntries())[0]).toMatchObject({ status: 'ongoing', hours: 1200 })
  })

  it('still imports a version 1 backup, keeping the genres, end year and hours it may hold', async () => {
    const versionOneGame = { id: 'a', title: 'Destiny 2', type: 'game', status: 'ongoing', createdAt: NOW, genres: ['action'], hours: 1200 }
    const versionOneSeries = { id: 'b', title: 'Lost', type: 'series', status: 'finished', createdAt: NOW, releaseYear: 2004, endYear: 2010 }

    await restoreBackup(parseBackup(backupText([versionOneGame, versionOneSeries])))

    const restored = await allEntries()

    expect(restored.find(({ id }) => id === 'a')).toMatchObject({ status: 'ongoing', genres: ['action'], hours: 1200 })
    expect(restored.find(({ id }) => id === 'b')).toMatchObject({ endYear: 2010 })
  })

  it('restores an old backup that has no genres, leaving them unset', async () => {
    await restoreBackup(parseBackup(backupText([{ id: 'a', title: 'Dune', type: 'movie', status: 'finished', createdAt: NOW, source: 'tmdb', sourceId: 'movie/438631' }])))

    const [restored] = await allEntries()

    expect(restored.title).toBe('Dune')
    expect(restored.genres).toBeUndefined()
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
    ['an unknown type', backupText([{ id: 'a', title: 'x', type: 'podcast', status: 'finished', createdAt: NOW }])],
    ['a bad finish date', backupText([{ id: 'a', title: 'x', type: 'movie', status: 'finished', createdAt: NOW, finishedOn: 'soon' }])],
    ['a blank title', backupText([{ id: 'a', title: '  ', type: 'movie', status: 'finished', createdAt: NOW }])],
    ['an unknown genre', backupText([{ id: 'a', title: 'x', type: 'movie', status: 'finished', createdAt: NOW, genres: ['Drama'] }])],
    ['zero hours', backupText([{ id: 'a', title: 'x', type: 'game', status: 'finished', createdAt: NOW, hours: 0 }])],
    ['part of an hour', backupText([{ id: 'a', title: 'x', type: 'game', status: 'finished', createdAt: NOW, hours: 1.5 }])],
    ['negative minutes', backupText([{ id: 'a', title: 'x', type: 'movie', status: 'finished', createdAt: NOW, lengthMinutes: [-1] }])],
    ['part of a minute', backupText([{ id: 'a', title: 'x', type: 'movie', status: 'finished', createdAt: NOW, lengthMinutes: [90.5] }])],
    ['a fractional version', JSON.stringify({ version: 1.5, exportedAt: NOW, entries: [] })],
    ['version 0', JSON.stringify({ version: 0, exportedAt: NOW, entries: [] })],
    ['a version written as text', JSON.stringify({ version: '2', exportedAt: NOW, entries: [] })],
    ['two titles with one id', backupText([entry({ id: 'same', title: 'Dune' }), entry({ id: 'same', title: 'Arrival' })])],
  ])('rejects %s', (_name, text) => {
    expect(() => parseBackup(text)).toThrow()
  })

  it.each([
    ['a whole newer backup', JSON.stringify({ version: 4, exportedAt: NOW, entries: [] })],
    ['a newer backup in a shape this version cannot read', '{"version":4}'],
  ])('refuses %s as newer, not as invalid', (_name, text) => {
    expect(() => parseBackup(text)).toThrow(NewerBackupError)
  })

  it('calls a fractional version above its own invalid, not newer', () => {
    const fractionalVersion = JSON.stringify({ version: 4.5, exportedAt: NOW, entries: [] })

    expect(() => parseBackup(fractionalVersion)).toThrow()
    expect(() => parseBackup(fractionalVersion)).not.toThrow(NewerBackupError)
  })

  it('normalises restored entries, so a hand-edited file cannot store fields that do not apply', async () => {
    const seasonsOnAMovie = { id: 'a', title: 'Dune', type: 'movie', status: 'finished', createdAt: NOW, seasons: 3 }

    await restoreBackup(parseBackup(backupText([seasonsOnAMovie])))

    const [restored] = await allEntries()

    expect(restored.seasons).toBeUndefined()
  })

  it('normalises a hand-edited book that is ongoing or has hours', async () => {
    const ongoingBook = { id: 'a', title: 'Dune', type: 'book', status: 'ongoing', createdAt: NOW, hours: 30 }

    await restoreBackup(parseBackup(backupText([ongoingBook])))

    const [restored] = await allEntries()

    expect(restored).toMatchObject({ status: 'finished', hours: undefined })
  })

  it('keeps the list when a restore is not attempted after a bad file', async () => {
    await addEntry({ title: 'Keep', type: 'book', status: 'finished' }, NOW)

    expect(() => parseBackup('{oops')).toThrow()
    expect(await db.entries.count()).toBe(1)
  })
})
