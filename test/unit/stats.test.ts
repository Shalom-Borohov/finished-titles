import { describe, expect, it } from 'vitest'
import { buildStats } from '../../src/domain/stats'
import { entry } from '../helpers/entries'

describe('buildStats', () => {
  it('counts totals by status', () => {
    const { total, finished, stopped } = buildStats([entry(), entry(), entry({ status: 'stopped' })])

    expect([total, finished, stopped]).toEqual([3, 2, 1])
  })

  it('lists every type, biggest first', () => {
    const { byType } = buildStats([entry({ type: 'book' }), entry({ type: 'anime' }), entry({ type: 'anime' })])

    expect(byType.slice(0, 3)).toEqual([
      { type: 'anime', count: 2 },
      { type: 'book', count: 1 },
      { type: 'series', count: 0 },
    ])
    expect(byType).toHaveLength(7)
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
