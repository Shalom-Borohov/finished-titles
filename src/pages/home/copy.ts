import { COMMON_COPY } from '../../copy/common'

export const HOME_COPY = {
  total: (count: number) => `מה שראיתי, קראתי ושיחקתי${COMMON_COPY.separator}${count}`,
  searchAll: 'חיפוש בכל הכותרים',
} as const
