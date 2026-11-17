import { useCallback, useEffect, useState } from 'react'
import type { TypeFilter } from '../../domain/entries'
import { searchTitles } from '../../search/client'
import { appendPage, type LoadedPages, type MoreStatus, NO_PAGES } from '../../search/pages'

const MINIMUM_QUERY_LENGTH = 2

const SEARCH_DELAY_MS = 300

const FIRST_PAGE = 1

type SearchOutcome = { phase: 'failed' } | ({ phase: 'done' } & LoadedPages)

export type SearchState = { phase: 'idle' } | { phase: 'searching' } | SearchOutcome

type Settled = { query: string; signal: AbortSignal; outcome: SearchOutcome }

const isShowing = (settled: Settled | undefined, query: string): settled is Settled =>
  settled?.query === query && !settled.signal.aborted

function searchState(settled: Settled | undefined, trimmedQuery: string, isSearchable: boolean): SearchState {
  if (!isSearchable) {
    return { phase: 'idle' }
  }

  return isShowing(settled, trimmedQuery) ? settled.outcome : { phase: 'searching' }
}

export function useTitleSearch(query: string, listType: TypeFilter) {
  const [settled, setSettled] = useState<Settled>()
  const trimmedQuery = query.trim()
  const isSearchable = trimmedQuery.length >= MINIMUM_QUERY_LENGTH

  useEffect(() => {
    if (!isSearchable) {
      return
    }

    const controller = new AbortController()
    const { signal } = controller

    const timer = setTimeout(() => {
      searchTitles(trimmedQuery, FIRST_PAGE, signal)
        .then((response) =>
          setSettled({
            query: trimmedQuery,
            signal,
            outcome: { phase: 'done', ...appendPage(NO_PAGES, response, FIRST_PAGE, listType) },
          }),
        )
        .catch(() => {
          if (!signal.aborted) {
            setSettled({ query: trimmedQuery, signal, outcome: { phase: 'failed' } })
          }
        })
    }, SEARCH_DELAY_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmedQuery, isSearchable, listType])

  const fetchNextPage = useCallback(
    (shownQuery: string, signal: AbortSignal, nextPage: number) => {
      const update = (change: (latest: LoadedPages) => LoadedPages) =>
        setSettled((latest) =>
          latest?.signal === signal && latest.outcome.phase === 'done'
            ? { ...latest, outcome: { phase: 'done', ...change(latest.outcome) } }
            : latest,
        )

      update((latest) => ({ ...latest, more: 'loading' }))
      searchTitles(shownQuery, nextPage, signal)
        .then((response) => update((latest) => appendPage(latest, response, nextPage, listType)))
        .catch(() => {
          if (!signal.aborted) {
            update((latest) => ({ ...latest, more: 'failed' }))
          }
        })
    },
    [listType],
  )

  const loadFrom = useCallback(
    (expected: MoreStatus) => {
      if (
        isShowing(settled, trimmedQuery) &&
        settled.outcome.phase === 'done' &&
        settled.outcome.more === expected &&
        settled.outcome.hasMore
      ) {
        fetchNextPage(settled.query, settled.signal, settled.outcome.page + 1)
      }
    },
    [settled, trimmedQuery, fetchNextPage],
  )

  const loadMore = useCallback(() => loadFrom('idle'), [loadFrom])

  const retryLoadMore = useCallback(() => loadFrom('failed'), [loadFrom])

  return { search: searchState(settled, trimmedQuery, isSearchable), loadMore, retryLoadMore }
}
