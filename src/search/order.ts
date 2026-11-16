import type { TypeFilter } from '../domain/entries'
import { SEARCH_SOURCES } from '../domain/types'
import type { SearchResult } from './client'

function mixByRank(results: SearchResult[]) {
  const bySource = SEARCH_SOURCES.map((source) => results.filter((result) => result.source === source))
  const rounds = Math.max(...bySource.map(({ length }) => length))

  return Array.from({ length: rounds }, (_, rank) =>
    bySource.filter(({ length }) => rank < length).map((sourceResults) => sourceResults[rank]),
  ).flat()
}

export function orderSearchPage(results: SearchResult[], listType: TypeFilter): SearchResult[] {
  const ofListType = results.filter(({ type }) => type === listType)
  const rest = results.filter(({ type }) => type !== listType)

  return [...ofListType, ...mixByRank(rest)]
}
