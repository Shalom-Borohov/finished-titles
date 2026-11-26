import { useEffect, useRef } from 'react'
import type { MoreStatus } from '../../search/pages'
import { ENTRY_COPY } from './copy'
import { useIsVisible } from './useIsVisible'

const MORE_STATUS_MESSAGES: Record<MoreStatus, string | undefined> = {
  idle: undefined,
  loading: ENTRY_COPY.loadingMore,
  failed: ENTRY_COPY.loadMoreFailed,
}

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
      <p className="search-status" role="status">
        {MORE_STATUS_MESSAGES[status]}
      </p>
      {status === 'failed' && (
        <button type="button" className="load-more-retry" onClick={onRetry}>
          {ENTRY_COPY.retryLoadMore}
        </button>
      )}
    </div>
  )
}
