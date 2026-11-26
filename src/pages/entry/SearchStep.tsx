import { IonContent } from '@ionic/react'
import { useState } from 'react'
import { Poster } from '../../components/Poster'
import { SheetHeader } from '../../components/SheetHeader'
import { COMMON_COPY } from '../../copy/common'
import { MEDIA_TYPE_SINGULAR_LABELS } from '../../copy/labels'
import { useAllEntries } from '../../data/hooks'
import { findExisting, type TypeFilter } from '../../domain/entries'
import type { Entry } from '../../domain/types'
import type { SearchResponse, SearchResult } from '../../search/client'
import { resultKey } from '../../search/pages'
import { ENTRY_COPY } from './copy'
import { LoadMoreRow } from './LoadMoreRow'
import { type SearchState, useTitleSearch } from './useTitleSearch'
import './searchStep.css'

const MAXIMUM_QUERY_LENGTH = 100

const resultMeta = ({ type, year }: SearchResult) =>
  [MEDIA_TYPE_SINGULAR_LABELS[type], ...(year ? [year] : [])].join(COMMON_COPY.separator)

const isSearchDown = (search: SearchState) =>
  search.phase === 'failed' ||
  (search.phase === 'done' && !search.hasMore && search.results.length === 0 && search.unavailable.length > 0)

function pageMessage({ results, unavailable, hasMore }: SearchResponse) {
  const hasResults = results.length > 0
  const isMissingSources = unavailable.length > 0

  if (hasResults || hasMore) {
    return isMissingSources ? ENTRY_COPY.sourcesMissing : undefined
  }

  return isMissingSources ? ENTRY_COPY.searchUnavailable : ENTRY_COPY.noResults
}

function searchMessage(search: SearchState) {
  if (search.phase === 'searching') {
    return ENTRY_COPY.searching
  }

  if (search.phase === 'failed') {
    return ENTRY_COPY.searchUnavailable
  }

  return search.phase === 'done' ? pageMessage(search) : undefined
}

type SearchStepProps = {
  listType: TypeFilter
  onPickResult: (result: SearchResult) => void
  onOpenExisting: (entry: Entry) => void
  onManualEntry: (typedTitle: string) => void
  onClose: () => void
}

export function SearchStep({ listType, onPickResult, onOpenExisting, onManualEntry, onClose }: SearchStepProps) {
  const [query, setQuery] = useState('')
  const { search, loadMore, retryLoadMore } = useTitleSearch(query, listType)
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

          <button type="button" className="manual-entry" onClick={() => onManualEntry(query.trim())}>
            {isSearchDown(search) ? ENTRY_COPY.manualEntryWhenSearchIsDown : ENTRY_COPY.manualEntry}
          </button>

          <p className="search-status" role="status">
            {searchMessage(search)}
          </p>

          {search.phase === 'done' &&
            search.results.map((result) => {
              const existing = findExisting(entries ?? [], { ...result, releaseYear: result.year })

              return (
                <button
                  key={resultKey(result)}
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

          {search.phase === 'done' && search.hasMore && (
            <LoadMoreRow page={search.page} status={search.more} onLoadMore={loadMore} onRetry={retryLoadMore} />
          )}
        </div>
      </IonContent>
    </>
  )
}
