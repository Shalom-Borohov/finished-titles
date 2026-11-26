import { useEffect, useState } from 'react'
import { useAppUpdate } from './useAppUpdate'

export const TIMING = { exitMs: 180 } as const

type BarPhase = 'offered' | 'leaving' | 'dismissed'

export function useUpdateBar() {
  const { updateWaiting, applyUpdate } = useAppUpdate()
  const [phase, setPhase] = useState<BarPhase>('offered')

  useEffect(() => {
    function offerAgainInForeground() {
      if (document.visibilityState === 'visible') {
        setPhase('offered')
      }
    }

    document.addEventListener('visibilitychange', offerAgainInForeground)

    return () => document.removeEventListener('visibilitychange', offerAgainInForeground)
  }, [])

  useEffect(() => {
    if (phase !== 'leaving') {
      return
    }

    const timer = setTimeout(() => setPhase('dismissed'), TIMING.exitMs)

    return () => clearTimeout(timer)
  }, [phase])

  return {
    shown: updateWaiting && phase !== 'dismissed',
    leaving: phase === 'leaving',
    dismiss: () => setPhase('leaving'),
    applyUpdate,
  }
}
