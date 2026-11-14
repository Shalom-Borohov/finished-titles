import { describe, expect, it } from 'vitest'
import { filterEntries, findExisting, homeTiles, normalizeEntry, sortNewestFirst, verdictLabel } from '../../src/domain/entries'
import { entry } from '../helpers/entries'

const titles = (entries: { title: string }[]) => entries.map(({ title }) => title)

describe('sortNewestFirst', () => {
  it('orders by finish date, with year-only after exact dates of that year and blanks last', () => {
    const entries = [
      entry({ title: 'blank', finishedOn: undefined }),
      entry({ title: '2024 only', finishedOn: '2024' }),
      entry({ title: 'March 2024', finishedOn: '2024-03-10' }),
      entry({ title: '2025', finishedOn: '2025-01-01' }),
      entry({ title: 'June 2024', finishedOn: '2024-06-01' }),
    ]

    expect(titles(sortNewestFirst(entries))).toEqual(['2025', 'June 2024', 'March 2024', '2024 only', 'blank'])
  })

  it('puts the later-added entry first on a tie', () => {
    const entries = [
      entry({ title: 'earlier', finishedOn: '2025', createdAt: 1 }),
      entry({ title: 'later', finishedOn: '2025', createdAt: 2 }),
      entry({ title: 'blank earlier', createdAt: 3 }),
      entry({ title: 'blank later', createdAt: 4 }),
    ]

    expect(titles(sortNewestFirst(entries))).toEqual(['later', 'earlier', 'blank later', 'blank earlier'])
  })
})

describe('verdictLabel', () => {
  it('shows the rating of a finished entry', () => {
    expect(verdictLabel(entry({ rating: 'favorite' }))).toBe('אהוב במיוחד')
  })

  it('adds the seasons watched', () => {
    expect(verdictLabel(entry({ type: 'anime', rating: 'liked', seasons: 4 }))).toBe('אהבתי · 4 עונות')
  })

  it('leaves out a single season, which says little in a small grid', () => {
    expect(verdictLabel(entry({ type: 'series', rating: 'favorite', seasons: 1 }))).toBe('אהוב במיוחד')
  })

  it('is empty when a finished entry has nothing to show', () => {
    expect(verdictLabel(entry())).toBe('')
  })

  it('shows where a show stopped', () => {
    expect(verdictLabel(entry({ type: 'series', status: 'stopped', stoppedSeason: 2, rating: 'okay' }))).toBe('נעצר בעונה 2')
  })

  it('shows stopped without a season', () => {
    expect(verdictLabel(entry({ type: 'book', status: 'stopped' }))).toBe('נעצר')
  })
})

describe('filterEntries', () => {
  const entries = [
    entry({ title: 'Dune', type: 'movie' }),
    entry({ title: 'Lost', type: 'series', status: 'stopped' }),
    entry({ title: 'Dark', type: 'series' }),
  ]

  it('keeps one type', () => {
    expect(titles(filterEntries(entries, { type: 'series', status: 'all', query: '' }))).toEqual(['Lost', 'Dark'])
  })

  it('keeps one status', () => {
    expect(titles(filterEntries(entries, { type: 'series', status: 'stopped', query: '' }))).toEqual(['Lost'])
  })

  it('searches titles ignoring case and surrounding spaces', () => {
    expect(titles(filterEntries(entries, { type: 'series', status: 'all', query: '  dAr ' }))).toEqual(['Dark'])
  })

  it('can span every type', () => {
    expect(titles(filterEntries(entries, { type: 'all', status: 'all', query: 'd' }))).toEqual(['Dune', 'Dark'])
  })
})

describe('homeTiles', () => {
  it('has a tile per type, with counts, even when empty', () => {
    const tiles = homeTiles([entry({ type: 'anime' }), entry({ type: 'anime' }), entry({ type: 'book' })])

    expect(tiles.map(({ type, count }) => [type, count])).toEqual([
      ['anime', 2],
      ['series', 0],
      ['movie', 0],
      ['book', 1],
      ['game', 0],
      ['comic', 0],
      ['other', 0],
    ])
  })

  it('fans the three most recent titles, including those with no poster', () => {
    const tiles = homeTiles([
      entry({ title: 'Oldest', type: 'anime', finishedOn: '2021', posterUrl: 'oldest.jpg' }),
      entry({ title: 'Third', type: 'anime', finishedOn: '2022', posterUrl: 'third.jpg' }),
      entry({ title: 'No poster', type: 'anime', finishedOn: '2023' }),
      entry({ title: 'Newest', type: 'anime', finishedOn: '2025', posterUrl: 'newest.jpg' }),
    ])

    expect(tiles[0].posters.map(({ title }) => title)).toEqual(['Newest', 'No poster', 'Third'])
  })
})

describe('findExisting', () => {
  const dune = entry({ title: 'Dune', type: 'movie', source: 'tmdb', sourceId: '438631' })
  const notes = entry({ title: 'My Comic', type: 'comic' })

  it('matches the same source and source ID, even if the title was edited', () => {
    const edited = { ...dune, title: 'Dune 2021' }

    expect(findExisting([edited], { title: 'Dune', type: 'movie', source: 'tmdb', sourceId: '438631' })).toBe(edited)
  })

  it('does not match another record with the same title', () => {
    expect(findExisting([dune], { title: 'Dune', type: 'movie', source: 'tmdb', sourceId: '841' })).toBeUndefined()
  })

  it('matches a manual entry on type and title, ignoring case and surrounding spaces', () => {
    expect(findExisting([notes], { title: '  my comic ', type: 'comic' })).toBe(notes)
  })

  it('does not match the same title under another type', () => {
    expect(findExisting([notes], { title: 'My Comic', type: 'book' })).toBeUndefined()
  })

  it('matches a search result to a title that was added by hand', () => {
    const manual = entry({ title: 'arrival', type: 'movie' })

    expect(findExisting([manual], { title: 'Arrival', type: 'movie', source: 'tmdb', sourceId: '329865' })).toBe(manual)
  })
})

describe('normalizeEntry', () => {
  it('trims the title and drops blank text', () => {
    const normalized = normalizeEntry(entry({ title: '  Dune ', note: '   ', status: 'stopped', stopReason: ' ' }))

    expect(normalized.title).toBe('Dune')
    expect(normalized.note).toBeUndefined()
    expect(normalized.stopReason).toBeUndefined()
  })

  it('keeps seasons watched only for finished shows', () => {
    expect(normalizeEntry(entry({ type: 'anime', seasons: 3 })).seasons).toBe(3)
    expect(normalizeEntry(entry({ type: 'movie', seasons: 3 })).seasons).toBeUndefined()
    expect(normalizeEntry(entry({ type: 'anime', status: 'stopped', seasons: 3 })).seasons).toBeUndefined()
  })

  it('keeps the stopped season only for stopped shows', () => {
    expect(normalizeEntry(entry({ type: 'series', status: 'stopped', stoppedSeason: 2 })).stoppedSeason).toBe(2)
    expect(normalizeEntry(entry({ type: 'series', stoppedSeason: 2 })).stoppedSeason).toBeUndefined()
    expect(normalizeEntry(entry({ type: 'book', status: 'stopped', stoppedSeason: 2 })).stoppedSeason).toBeUndefined()
  })

  it('keeps the end year only for shows, finished or stopped', () => {
    expect(normalizeEntry(entry({ type: 'series', endYear: 2013 })).endYear).toBe(2013)
    expect(normalizeEntry(entry({ type: 'anime', status: 'stopped', endYear: 2013 })).endYear).toBe(2013)
    expect(normalizeEntry(entry({ type: 'movie', endYear: 2013 })).endYear).toBeUndefined()
    expect(normalizeEntry(entry({ type: 'book', endYear: 2013 })).endYear).toBeUndefined()
  })

  it('keeps the reason only for stopped entries', () => {
    expect(normalizeEntry(entry({ status: 'stopped', stopReason: 'נמרח' })).stopReason).toBe('נמרח')
    expect(normalizeEntry(entry({ stopReason: 'נמרח' })).stopReason).toBeUndefined()
  })
})
