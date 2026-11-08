import { finishYear } from './finishDate'
import { type Entry, MEDIA_TYPES, type MediaType, type Rating, RATINGS } from './types'

const CHART_YEARS = 6

export type LibraryStats = {
  total: number
  finished: number
  stopped: number
  byType: { type: MediaType; count: number }[]
  byRating: { rating: Rating; count: number }[]
  byYear: { year: number; count: number }[]
  olderCount: number
  undatedCount: number
}

function countByYear(entries: Entry[]) {
  const counts = new Map<number, number>()

  for (const { finishedOn } of entries) {
    if (finishedOn) {
      const year = finishYear(finishedOn)

      counts.set(year, (counts.get(year) ?? 0) + 1)
    }
  }

  return Array.from(counts, ([year, count]) => ({ year, count })).toSorted((first, second) => second.year - first.year)
}

export function buildStats(entries: Entry[]): LibraryStats {
  const countWhere = (matches: (entry: Entry) => boolean) => entries.filter(matches).length
  const years = countByYear(entries)

  return {
    total: entries.length,
    finished: countWhere(({ status }) => status === 'finished'),
    stopped: countWhere(({ status }) => status === 'stopped'),
    byType: MEDIA_TYPES.map((type) => ({ type, count: countWhere((entry) => entry.type === type) })).toSorted(
      (first, second) => second.count - first.count,
    ),
    byRating: RATINGS.map((rating) => ({ rating, count: countWhere((entry) => entry.rating === rating) })),
    byYear: years.slice(0, CHART_YEARS),
    olderCount: years.slice(CHART_YEARS).reduce((sum, { count }) => sum + count, 0),
    undatedCount: countWhere(({ finishedOn }) => !finishedOn),
  }
}
