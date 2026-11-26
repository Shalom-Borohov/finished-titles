import { fillMissingDetails } from '../../data/repo'
import type { Entry, Genre } from '../../domain/types'
import { fetchTitleDetails, tmdbTitleId } from '../../search/client'
import { inTurns } from '../../search/inTurns'
import { fetchTitleMinutes } from '../../search/length'
import { genresFromTmdb } from '../../search/tmdbGenres'

const PARALLEL_LOOKUPS = 4

type FillOutcome = 'filled' | 'kept' | 'failed'

export type TmdbFillResult = { filled: number; failed: number }

async function lookUpGenres(titleId: string, signal: AbortSignal): Promise<Genre[]> {
  const details = await fetchTitleDetails(titleId, signal)

  return genresFromTmdb(details.genres.map((genre) => genre.id))
}

const foundOrNone = <Found>(lookup: PromiseSettledResult<Found>) =>
  lookup.status === 'fulfilled' ? lookup.value : undefined

async function fillOne(entry: Entry, signal: AbortSignal): Promise<FillOutcome> {
  const titleId = tmdbTitleId(entry)

  if (!titleId) {
    return 'failed'
  }

  const [genres, lengthMinutes] = await Promise.allSettled([
    entry.genres ?? lookUpGenres(titleId, signal),
    entry.lengthMinutes ?? fetchTitleMinutes(titleId, signal),
  ])

  try {
    const isSaved = await fillMissingDetails(entry.id, {
      genres: foundOrNone(genres),
      lengthMinutes: foundOrNone(lengthMinutes),
    })

    if (genres.status === 'rejected' || lengthMinutes.status === 'rejected') {
      return 'failed'
    }

    return isSaved ? 'filled' : 'kept'
  } catch {
    return 'failed'
  }
}

export async function fillFromTmdb(
  entries: Entry[],
  onProgress: (done: number) => void,
  signal: AbortSignal,
): Promise<TmdbFillResult> {
  const result: TmdbFillResult = { filled: 0, failed: 0 }
  let done = 0

  await inTurns(
    entries,
    PARALLEL_LOOKUPS,
    async (entry) => {
      const outcome = await fillOne(entry, signal)

      if (outcome !== 'kept') {
        result[outcome] += 1
      }

      done += 1
      onProgress(done)
    },
    signal,
  )

  return result
}
