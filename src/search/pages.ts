import type { TypeFilter } from '../domain/entries'
import type { SearchResponse, SearchResult } from './client'
import { orderSearchPage } from './order'

export type MoreStatus = 'idle' | 'loading' | 'failed'

export type LoadedPages = SearchResponse & { page: number; more: MoreStatus; missingLastTime: string[] }

export const NO_PAGES: LoadedPages = {
  results: [],
  unavailable: [],
  hasMore: false,
  page: 0,
  more: 'idle',
  missingLastTime: [],
}

export const resultKey = ({ source, sourceId }: SearchResult) => `${source}-${sourceId}`

const FIRST_PAGE = 1

const lostSourceMidway = (earlier: LoadedPages, response: SearchResponse) =>
  earlier.page >= FIRST_PAGE && response.unavailable.some((source) => !earlier.missingLastTime.includes(source))

export function appendPage(
  earlier: LoadedPages,
  response: SearchResponse,
  page: number,
  listType: TypeFilter,
): LoadedPages {
  const shownKeys = new Set(earlier.results.map(resultKey))

  const newResults = orderSearchPage(response.results, listType).filter((result) => {
    const key = resultKey(result)
    const isNew = !shownKeys.has(key)

    shownKeys.add(key)

    return isNew
  })

  const results = [...earlier.results, ...newResults]
  const unavailable = [...new Set([...earlier.unavailable, ...response.unavailable])]
  const missingLastTime = response.unavailable

  if (lostSourceMidway(earlier, response)) {
    return { results, unavailable, missingLastTime, hasMore: true, page: earlier.page, more: 'failed' }
  }

  return { results, unavailable, missingLastTime, hasMore: response.hasMore, page, more: 'idle' }
}
