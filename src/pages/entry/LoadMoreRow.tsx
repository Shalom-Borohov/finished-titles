import { useEffect, useRef } from 'react'
import type { MoreStatus } from '../../search/pages'
import { ENTRY_COPY } from './copy'
import { useIsVisible } from './useIsVisible'

type LoadMoreRowProps = {
  page: number
  status: MoreStatus
  onLoadMore: () => void
  onRetry: () => void
}

export function LoadMoreRow({ page, status, onLoadMore, onRetry }: LoadMoreRowProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const isEndVisible = useIsVisible(endRef, page)

  useEffect(() => {
    if (isEndVisible && status === 'idle') {
      onLoadMore()
    }
  }, [isEndVisible, status, onLoadMore])

  return (
    <div ref={endRef} className="load-more">
      {status === 'loading' && <p className="search-status">{ENTRY_COPY.loadingMore}</p>}
      {status === 'failed' && (
        <>
          <p className="search-status">{ENTRY_COPY.loadMoreFailed}</p>
          <button type="button" className="load-more-retry" onClick={onRetry}>
            {ENTRY_COPY.retryLoadMore}
          </button>
        </>
      )}
    </div>
  )
}
