import { COMMON_COPY } from '../../copy/common'

export const STATS_COPY = {
  summary: (total: number, finished: number, stopped: number) =>
    [COMMON_COPY.titleCount(total), `${finished} סיימתי`, `${stopped} עצרתי`].join(COMMON_COPY.separator),
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
