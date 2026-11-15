import { useIonViewDidEnter, useIonViewDidLeave } from '@ionic/react'
import { useEffect, useRef, useState } from 'react'
import { TagIcon } from '../../components/icons'
import { useAllEntries } from '../../data/hooks'
import { awaitingGenres } from '../../domain/entries'
import type { Entry } from '../../domain/types'
import { SETTINGS_COPY } from './copy'
import { fillGenres, type GenreFillResult } from './genreFill'

const FULL_WIDTH_PERCENT = 100

type FillProgress = { done: number; total: number }

function FillProgressBar({ done, total }: FillProgress) {
  return (
    <div className="genre-fill-progress">
      <span>{SETTINGS_COPY.fillingGenres(done, total)}</span>
      <div
        className="genre-fill-track"
        role="progressbar"
        aria-label={SETTINGS_COPY.genreFillProgress}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        <div className="genre-fill-bar" style={{ width: `${(done / total) * FULL_WIDTH_PERCENT}%` }} />
      </div>
    </div>
  )
}

export function GenreFillSettings() {
  const entries = useAllEntries()
  const [progress, setProgress] = useState<FillProgress>()
  const [result, setResult] = useState<GenreFillResult>()
  const runController = useRef<AbortController>(undefined)
  const isInView = useRef(true)

  useEffect(() => () => runController.current?.abort(), [])
  useIonViewDidEnter(() => {
    isInView.current = true
  })
  useIonViewDidLeave(() => {
    isInView.current = false
    setResult(undefined)
  })

  const waiting = entries && awaitingGenres(entries)
  const shownResult = result && result.failed === waiting?.length ? result : undefined

  if (!waiting || (waiting.length === 0 && !progress && !shownResult)) {
    return null
  }

  async function fill(titles: Entry[]) {
    const controller = new AbortController()

    runController.current = controller
    setProgress({ done: 0, total: titles.length })

    const outcome = await fillGenres(titles, (done) => setProgress({ done, total: titles.length }), controller.signal)

    setProgress(undefined)

    if (isInView.current) {
      setResult(outcome)
    }
  }

  const actionLabel = shownResult ? SETTINGS_COPY.retryGenres(shownResult.failed) : SETTINGS_COPY.fillGenres

  const note = shownResult
    ? SETTINGS_COPY.genresFilled(shownResult.filled, shownResult.failed)
    : SETTINGS_COPY.genresWaiting(progress ? progress.total : waiting.length)

  return (
    <section className="card">
      <h2>{SETTINGS_COPY.genres}</h2>
      {progress && <FillProgressBar {...progress} />}
      {!progress && waiting.length > 0 && (
        <button type="button" className="settings-action" onClick={() => void fill(waiting)}>
          <TagIcon />
          {actionLabel}
        </button>
      )}
      <p className="settings-note" aria-live="polite">
        {note}
      </p>
    </section>
  )
}
