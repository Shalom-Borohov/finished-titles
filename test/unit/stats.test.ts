import { describe, expect, it } from 'vitest'
import { buildStats, type LibraryStats } from '../../src/domain/stats'
import type { MediaType } from '../../src/domain/types'
import { entry } from '../helpers/entries'

const hoursOf = (byType: LibraryStats['byType'], type: MediaType) => byType.find((row) => row.type === type)?.hours

describe('buildStats', () => {
  it('counts totals by status', () => {
    const { total, finished, stopped } = buildStats([entry(), entry(), entry({ status: 'stopped' })])

    expect([total, finished, stopped]).toEqual([3, 2, 1])
  })

  it('lists every type, biggest first', () => {
    const { byType } = buildStats([entry({ type: 'book' }), entry({ type: 'anime' }), entry({ type: 'anime' })])

    expect(byType.slice(0, 3)).toEqual([
      { type: 'anime', count: 2, hours: 0 },
      { type: 'book', count: 1, hours: 0 },
      { type: 'series', count: 0, hours: 0 },
    ])
    expect(byType).toHaveLength(7)
  })

  it('adds up the hours spent on each type', () => {
    const { byType } = buildStats([
      entry({ type: 'movie', lengthMinutes: [120] }),
      entry({ type: 'movie', lengthMinutes: [180] }),
      entry({ type: 'series', seasons: 1, lengthMinutes: [600, 700] }),
      entry({ type: 'book' }),
    ])

    expect(hoursOf(byType, 'movie')).toBe(5)
    expect(hoursOf(byType, 'series')).toBe(10)
    expect(hoursOf(byType, 'book')).toBe(0)
  })

  it('rounds the hours of a type once, not each title', () => {
    const { byType } = buildStats([entry({ lengthMinutes: [20] }), entry({ lengthMinutes: [20] })])

    expect(hoursOf(byType, 'movie')).toBe(1)
  })

  it('totals the hours as the sum of the rounded rows', () => {
    const { byType, hours } = buildStats([entry({ lengthMinutes: [90] }), entry({ type: 'series', lengthMinutes: [90] })])

    expect([hoursOf(byType, 'movie'), hoursOf(byType, 'series'), hours]).toEqual([2, 2, 4])
  })

  it('counts the hours played in the games row and in the total', () => {
    const { byType, hours } = buildStats([
      entry({ type: 'game', hours: 3 }),
      entry({ type: 'game', status: 'ongoing', hours: 5 }),
      entry({ lengthMinutes: [120] }),
    ])

    expect(hoursOf(byType, 'game')).toBe(8)
    expect(hours).toBe(10)
  })

  it('lists every rating in order, and leaves unrated entries out of it', () => {
    const { byRating } = buildStats([entry({ rating: 'liked' }), entry({ rating: 'favorite' }), entry({ rating: 'liked' }), entry()])

    expect(byRating).toEqual([
      { rating: 'favorite', count: 1 },
      { rating: 'loved', count: 0 },
      { rating: 'liked', count: 2 },
      { rating: 'okay', count: 0 },
      { rating: 'disliked', count: 0 },
    ])
  })

  it('counts exact dates and year-only values in the same year', () => {
    const { byYear } = buildStats([entry({ finishedOn: '2024-03-10' }), entry({ finishedOn: '2024' }), entry({ finishedOn: '2025' })])

    expect(byYear).toEqual([
      { year: 2025, count: 1 },
      { year: 2024, count: 2 },
    ])
  })

  it('keeps the six most recent years with titles and counts the older ones apart', () => {
    const years = ['2026', '2024', '2022', '2021', '2020', '2019', '2018', '2010', '2010']
    const { byYear, olderCount } = buildStats(years.map((finishedOn) => entry({ finishedOn })))

    expect(byYear.map(({ year }) => year)).toEqual([2026, 2024, 2022, 2021, 2020, 2019])
    expect(olderCount).toBe(3)
  })

  it('counts undated titles apart', () => {
    const { byYear, undatedCount, total } = buildStats([entry(), entry({ finishedOn: '2025' })])

    expect(undatedCount).toBe(1)
    expect(total).toBe(2)
    expect(byYear).toEqual([{ year: 2025, count: 1 }])
  })
})
