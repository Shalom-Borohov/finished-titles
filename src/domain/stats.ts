import { finishYear } from './finishDate'
import { MINUTES_PER_HOUR, minutesSpent } from './hours'
import { type Entry, MEDIA_TYPES, type MediaType, type Rating, RATINGS } from './types'

const CHART_YEARS = 6

export type LibraryStats = {
  total: number
  finished: number
  stopped: number
  ongoing: number
  hours: number
  byType: { type: MediaType; count: number; hours: number }[]
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

function typeRow(entries: Entry[], type: MediaType) {
  const ofType = entries.filter((entry) => entry.type === type)
  const minutes = ofType.reduce((sum, entry) => sum + minutesSpent(entry), 0)

  return { type, count: ofType.length, hours: Math.round(minutes / MINUTES_PER_HOUR) }
}

export function buildStats(entries: Entry[]): LibraryStats {
  const countWhere = (matches: (entry: Entry) => boolean) => entries.filter(matches).length
  const years = countByYear(entries)
  const byType = MEDIA_TYPES.map((type) => typeRow(entries, type)).toSorted((first, second) => second.count - first.count)

  return {
    total: entries.length,
    finished: countWhere(({ status }) => status === 'finished'),
    stopped: countWhere(({ status }) => status === 'stopped'),
    ongoing: countWhere(({ status }) => status === 'ongoing'),
    hours: byType.reduce((sum, { hours }) => sum + hours, 0),
    byType,
    byRating: RATINGS.map((rating) => ({ rating, count: countWhere((entry) => entry.rating === rating) })),
    byYear: years.slice(0, CHART_YEARS),
    olderCount: years.slice(CHART_YEARS).reduce((sum, { count }) => sum + count, 0),
    undatedCount: countWhere(({ finishedOn }) => !finishedOn),
  }
}
