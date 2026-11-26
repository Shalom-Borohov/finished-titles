import { fetchLength, fetchShowPrefill, tvIdOfTitle } from './client'
import { inTurns } from './inTurns'

const PARALLEL_SEASONS = 4

const FIRST_SEASON = 1

const UNKNOWN_SEASON_MINUTES = 0

async function movieMinutes(titleId: string, signal: AbortSignal) {
  const { minutes } = await fetchLength(titleId, undefined, signal)

  return minutes === undefined ? [] : [minutes]
}

export async function fetchSeasonMinutes(titleId: string, seasons: number, signal: AbortSignal) {
  const seasonNumbers = Array.from({ length: seasons }, (_, index) => FIRST_SEASON + index)
  const minutesBySeason = seasonNumbers.map(() => UNKNOWN_SEASON_MINUTES)
  const firstFailure = new AbortController()
  const seasonsSignal = AbortSignal.any([signal, firstFailure.signal])

  await inTurns(
    seasonNumbers,
    PARALLEL_SEASONS,
    async (season) => {
      try {
        const { minutes } = await fetchLength(titleId, season, seasonsSignal)

        minutesBySeason[season - FIRST_SEASON] = minutes ?? UNKNOWN_SEASON_MINUTES
      } catch (error) {
        firstFailure.abort()
        throw error
      }
    },
    seasonsSignal,
  )
  seasonsSignal.throwIfAborted()

  return minutesBySeason
}

export async function fetchTitleMinutes(titleId: string, signal: AbortSignal): Promise<number[]> {
  const tvId = tvIdOfTitle(titleId)

  if (!tvId) {
    return movieMinutes(titleId, signal)
  }

  const { seasons } = await fetchShowPrefill(tvId, signal)

  return fetchSeasonMinutes(titleId, seasons, signal)
}
