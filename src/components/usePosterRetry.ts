import { useEffect, useState } from 'react'

export function usePosterRetry(failedUrl: string | undefined) {
  const [retryingUrl, setRetryingUrl] = useState<string>()

  useEffect(() => {
    if (failedUrl === undefined) {
      return
    }

    const retry = () => {
      if (navigator.onLine && document.visibilityState === 'visible') {
        setRetryingUrl(failedUrl)
      }
    }

    window.addEventListener('online', retry)
    document.addEventListener('visibilitychange', retry)

    return () => {
      window.removeEventListener('online', retry)
      document.removeEventListener('visibilitychange', retry)
    }
  }, [failedUrl])

  return {
    retryUrl: retryingUrl === failedUrl ? retryingUrl : undefined,
    stopRetrying: () => setRetryingUrl(undefined),
  }
}
