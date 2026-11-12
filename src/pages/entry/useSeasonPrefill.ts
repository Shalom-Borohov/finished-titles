import { useEffect, useEffectEvent } from 'react'
import { fetchAiredSeasons } from '../../search/client'

export function useSeasonPrefill(tvId: string | undefined, onSeasons: (seasons: number) => void) {
  const fillSeasons = useEffectEvent(onSeasons)

  useEffect(() => {
    if (!tvId) {
      return
    }

    const controller = new AbortController()

    fetchAiredSeasons(tvId, controller.signal)
      .then((seasons) => {
        if (seasons > 0 && !controller.signal.aborted) {
          fillSeasons(seasons)
        }
      })
      .catch(() => {})

    return () => controller.abort()
  }, [tvId])
}
