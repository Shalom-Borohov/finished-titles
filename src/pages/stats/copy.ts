import { COMMON_COPY } from '../../copy/common'
import type { LibraryStats } from '../../domain/stats'

const HOURS_FORMAT = new Intl.NumberFormat('he-IL')

const hoursText = (hours: number) => (hours === 1 ? 'שעה אחת' : `${HOURS_FORMAT.format(hours)} שעות`)

export const STATS_COPY = {
  summary: ({ total, finished, stopped, ongoing }: LibraryStats) =>
    [
      COMMON_COPY.titleCount(total),
      `${finished} סיימתי`,
      `${stopped} עצרתי`,
      ...(ongoing ? [`${ongoing} ממשיך`] : []),
    ].join(COMMON_COPY.separator),
  hours: hoursText,
  typeCount: (count: number, hours: number) => (hours > 0 ? [count, hoursText(hours)].join(COMMON_COPY.separator) : String(count)),
  byYear: 'לפי שנה',
  byType: 'לפי סוג',
  byRating: 'איך היה',
  noDatedTitles: 'עדיין אין כותרים עם תאריך',
  yearBar: (year: number, count: number) => `${year}: ${COMMON_COPY.titleCount(count)}`,
  leftOut: (olderCount: number, undatedCount: number) => {
    const parts = [
      ...(olderCount ? [`${COMMON_COPY.titleCount(olderCount)} משנים קודמות`] : []),
      ...(undatedCount ? [`${COMMON_COPY.titleCount(undatedCount)} בלי תאריך`] : []),
    ]

    return `לא בגרף: ${parts.join(' ו')}`
  },
} as const
