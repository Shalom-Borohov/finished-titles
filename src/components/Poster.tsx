import { useState } from 'react'
import './Poster.css'
import { usePosterRetry } from './usePosterRetry'

const PLACEHOLDER_COLORS = ['#d9d4fb', '#cfe0fa', '#f7d9e6', '#d3efe6', '#fbe6c8', '#e3d9f5']

function placeholderColor(title: string) {
  const sum = Array.from(title).reduce((total, character) => total + (character.codePointAt(0) ?? 0), 0)

  return PLACEHOLDER_COLORS[sum % PLACEHOLDER_COLORS.length]
}

type PosterProps = {
  title: string
  posterUrl?: string
  dimmed?: boolean
  compact?: boolean
}

export function Poster({ title, posterUrl, dimmed, compact }: PosterProps) {
  const [failedUrl, setFailedUrl] = useState<string>()
  const isFailed = posterUrl !== undefined && failedUrl === posterUrl
  const { retryUrl, stopRetrying } = usePosterRetry(isFailed ? posterUrl : undefined)
  const className = ['poster', dimmed && 'poster-dimmed', compact && 'poster-compact'].filter(Boolean).join(' ')

  const showLoadedPoster = () => {
    stopRetrying()
    setFailedUrl(undefined)
  }

  return (
    <div className={className}>
      {posterUrl && !isFailed ? (
        <img src={posterUrl} alt="" loading="lazy" crossOrigin="anonymous" onError={() => setFailedUrl(posterUrl)} />
      ) : (
        <>
          <div
            className="poster-placeholder"
            aria-hidden="true"
            data-title={title}
            style={{ backgroundColor: placeholderColor(title) }}
          />
          {retryUrl && (
            <img hidden src={retryUrl} alt="" crossOrigin="anonymous" onLoad={showLoadedPoster} onError={stopRetrying} />
          )}
        </>
      )}
    </div>
  )
}
