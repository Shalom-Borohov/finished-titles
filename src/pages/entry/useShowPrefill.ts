import { useEffect, useEffectEvent } from 'react'
import { fetchShowPrefill, type ShowPrefill } from '../../search/client'

export function useShowPrefill(tvId: string | undefined, onPrefill: (prefill: ShowPrefill) => void) {
  const fillShow = useEffectEvent(onPrefill)

  useEffect(() => {
    if (!tvId) {
      return
    }

    const controller = new AbortController()

    fetchShowPrefill(tvId, controller.signal)
      .then((prefill) => {
        if (!controller.signal.aborted) {
          fillShow(prefill)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [tvId])
}
