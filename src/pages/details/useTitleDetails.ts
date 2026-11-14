import { useEffect, useState } from 'react'
import { fetchTitleDetails, type TitleDetails } from '../../search/client'

type TitleDetailsState = { kind: 'loading' } | { kind: 'failed' } | { kind: 'loaded'; details: TitleDetails }

export function useTitleDetails(titleId: string) {
  const [state, setState] = useState<TitleDetailsState>({ kind: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetchTitleDetails(titleId, controller.signal).then(
      (details) => !controller.signal.aborted && setState({ kind: 'loaded', details }),
      () => !controller.signal.aborted && setState({ kind: 'failed' }),
    )

    return () => controller.abort()
  }, [titleId, attempt])

  function retry() {
    setState({ kind: 'loading' })
    setAttempt((current) => current + 1)
  }

  return { state, retry }
}
