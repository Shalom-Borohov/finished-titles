import { IonContent } from '@ionic/react'
import { useEffect, useState } from 'react'
import { Poster } from '../../components/Poster'
import { COMMON_COPY } from '../../copy/common'
import { MEDIA_TYPE_SINGULAR_LABELS } from '../../copy/labels'
import { useAllEntries } from '../../data/hooks'
import { findExisting } from '../../domain/entries'
import type { Entry } from '../../domain/types'
import { type SearchResponse, type SearchResult, searchTitles } from '../../search/client'
import { ENTRY_COPY } from './copy'
import { SheetHeader } from './SheetHeader'
import './searchStep.css'

const MINIMUM_QUERY_LENGTH = 2

const MAXIMUM_QUERY_LENGTH = 100

const SEARCH_DELAY_MS = 300

type SearchOutcome = { phase: 'failed' } | ({ phase: 'done' } & SearchResponse)

type SearchState = { phase: 'idle' } | { phase: 'searching' } | SearchOutcome

function useTitleSearch(query: string): SearchState {
  const [settled, setSettled] = useState<{ query: string; outcome: SearchOutcome }>()
  const trimmedQuery = query.trim()
  const isSearchable = trimmedQuery.length >= MINIMUM_QUERY_LENGTH

  useEffect(() => {
    if (!isSearchable) {
      return
    }

    const controller = new AbortController()

    const timer = setTimeout(() => {
      searchTitles(trimmedQuery, controller.signal)
        .then((response) => setSettled({ query: trimmedQuery, outcome: { phase: 'done', ...response } }))
        .catch(() => {
          if (!controller.signal.aborted) {
            setSettled({ query: trimmedQuery, outcome: { phase: 'failed' } })
          }
        })
    }, SEARCH_DELAY_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [trimmedQuery, isSearchable])

  if (!isSearchable) {
    return { phase: 'idle' }
  }

  return settled?.query === trimmedQuery ? settled.outcome : { phase: 'searching' }
}

const resultMeta = ({ type, year }: SearchResult) =>
  [MEDIA_TYPE_SINGULAR_LABELS[type], ...(year ? [year] : [])].join(COMMON_COPY.separator)

const isSearchDown = (search: SearchState) =>
  search.phase === 'failed' ||
  (search.phase === 'done' && search.results.length === 0 && search.unavailable.length > 0)

function searchMessage({ results, unavailable }: SearchResponse) {
  const hasResults = results.length > 0
  const isMissingSources = unavailable.length > 0

  if (hasResults) {
    return isMissingSources ? ENTRY_COPY.sourcesMissing : undefined
  }

  return isMissingSources ? ENTRY_COPY.searchUnavailable : ENTRY_COPY.noResults
}

type SearchStepProps = {
  onPickResult: (result: SearchResult) => void
  onOpenExisting: (entry: Entry) => void
  onManualEntry: (typedTitle: string) => void
  onClose: () => void
}

export function SearchStep({ onPickResult, onOpenExisting, onManualEntry, onClose }: SearchStepProps) {
  const [query, setQuery] = useState('')
  const search = useTitleSearch(query)
  const entries = useAllEntries()

  return (
    <>
      <SheetHeader title={COMMON_COPY.addTitle} onClose={onClose} />
      <IonContent>
        <div className="sheet-body">
          <label>
            <span className="visually-hidden">{ENTRY_COPY.searchTitle}</span>
            <input
              className="field search-input"
              type="search"
              dir="auto"
              maxLength={MAXIMUM_QUERY_LENGTH}
              placeholder={ENTRY_COPY.searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          {search.phase === 'searching' && <p className="search-status">{ENTRY_COPY.searching}</p>}
          {search.phase === 'failed' && <p className="search-status">{ENTRY_COPY.searchUnavailable}</p>}
          {search.phase === 'done' && searchMessage(search) && (
            <p className="search-status">{searchMessage(search)}</p>
          )}

          {search.phase === 'done' &&
            search.results.map((result) => {
              const existing = findExisting(entries ?? [], result)

              return (
                <button
                  key={`${result.source}-${result.sourceId}`}
                  type="button"
                  className="search-result"
                  onClick={() => (existing ? onOpenExisting(existing) : onPickResult(result))}
                >
                  <span className="search-result-poster">
                    <Poster title={result.title} posterUrl={result.posterUrl} compact />
                  </span>
                  <span className="search-result-text">
                    <span className="search-result-title" dir="ltr">
                      {result.title}
                    </span>
                    <span className="search-result-meta">{resultMeta(result)}</span>
                  </span>
                  {existing && <span className="search-result-listed">{ENTRY_COPY.alreadyListed}</span>}
                </button>
              )
            })}

          <button type="button" className="manual-entry" onClick={() => onManualEntry(query.trim())}>
            {isSearchDown(search) ? ENTRY_COPY.manualEntryWhenSearchIsDown : ENTRY_COPY.manualEntry}
          </button>
        </div>
      </IonContent>
    </>
  )
}
