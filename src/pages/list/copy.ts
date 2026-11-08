export const LIST_COPY = {
  allTitles: 'כל הכותרים',
  backHome: 'חזרה לבית',
  search: 'חיפוש',
  statusFilter: 'סינון לפי מצב',
  all: 'הכל',
  finished: (count: number) => `סיימתי ${count}`,
  stopped: (count: number) => `עצרתי ${count}`,
  emptyType: 'עדיין אין כאן כותרים',
  noMatches: 'לא נמצאו כותרים',
} as const
