import { useEffect, useEffectEvent } from 'react'
import { fetchShowPrefill, type ShowPrefill, tvIdOfTitle } from '../../search/client'
import { fetchSeasonMinutes, fetchTitleMinutes } from '../../search/length'

type PrefillHandlers = {
  onShow: (prefill: ShowPrefill) => void
  onLength: (lengthMinutes: number[]) => void
}

export function usePickPrefill(titleId: string | undefined, { onShow, onLength }: PrefillHandlers) {
  const fillShow = useEffectEvent(onShow)
  const fillLength = useEffectEvent(onLength)

  useEffect(() => {
    if (!titleId) {
      return
    }

    const controller = new AbortController()
    const { signal } = controller
    const tvId = tvIdOfTitle(titleId)

    async function prefill(pickedId: string) {
      if (!tvId) {
        const lengthMinutes = await fetchTitleMinutes(pickedId, signal)

        if (!signal.aborted) {
          fillLength(lengthMinutes)
        }

        return
      }

      const showPrefill = await fetchShowPrefill(tvId, signal)

      if (signal.aborted) {
        return
      }

      fillShow(showPrefill)

      const lengthMinutes = await fetchSeasonMinutes(pickedId, showPrefill.seasons, signal)

      if (!signal.aborted) {
        fillLength(lengthMinutes)
      }
    }

    prefill(titleId).catch(() => {})

    return () => controller.abort()
  }, [titleId])
}
