import { fillMissingGenres } from '../../data/repo'
import type { Entry } from '../../domain/types'
import { fetchTitleDetails, tmdbTitleId } from '../../search/client'
import { genresFromTmdb } from '../../search/tmdbGenres'

const PARALLEL_LOOKUPS = 4

type FillOutcome = 'filled' | 'kept' | 'failed'

export type GenreFillResult = { filled: number; failed: number }

async function fillOne(entry: Entry, signal: AbortSignal): Promise<FillOutcome> {
  const titleId = tmdbTitleId(entry)

  if (!titleId) {
    return 'failed'
  }

  try {
    const details = await fetchTitleDetails(titleId, signal)
    const genres = genresFromTmdb(details.genres.map((genre) => genre.id))

    return (await fillMissingGenres(entry.id, genres)) ? 'filled' : 'kept'
  } catch {
    return 'failed'
  }
}

export async function fillGenres(
  entries: Entry[],
  onProgress: (done: number) => void,
  signal: AbortSignal,
): Promise<GenreFillResult> {
  const result: GenreFillResult = { filled: 0, failed: 0 }
  let next = 0
  let done = 0

  async function lookUpInTurn() {
    while (next < entries.length && !signal.aborted) {
      const entry = entries[next]

      next += 1

      const outcome = await fillOne(entry, signal)

      if (outcome !== 'kept') {
        result[outcome] += 1
      }

      done += 1
      onProgress(done)
    }
  }

  await Promise.all(Array.from({ length: PARALLEL_LOOKUPS }, lookUpInTurn))

  return result
}
