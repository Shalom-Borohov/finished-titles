import { array, type InferOutput, nullish, number, object, string } from 'valibot'
import { authorizedHeaders, isFullDate, tmdbJson, todayUtc } from './tmdb'
import type { Env, TitleLength } from './types'
import { isPositiveInteger } from './upstream'

const SEASON_SEGMENT = 'season'
const NO_MINUTES = 0

const movieRuntimeSchema = object({ runtime: nullish(number()) })

const episodeSchema = object({ air_date: nullish(string()), runtime: nullish(number()) })
const seasonEpisodesSchema = object({ episodes: nullish(array(episodeSchema), []) })

type TmdbEpisode = InferOutput<typeof episodeSchema>

function airedMinutes(episode: TmdbEpisode, today: string) {
  const hasAired = isFullDate(episode.air_date) && episode.air_date <= today

  return hasAired && isPositiveInteger(episode.runtime) ? episode.runtime : NO_MINUTES
}

async function movieMinutes(reference: string, headers: HeadersInit): Promise<TitleLength> {
  const { runtime } = await tmdbJson(reference, headers, movieRuntimeSchema)

  return isPositiveInteger(runtime) ? { minutes: runtime } : {}
}

async function seasonMinutes(reference: string, season: number, headers: HeadersInit): Promise<TitleLength> {
  const { episodes } = await tmdbJson(`${reference}/${SEASON_SEGMENT}/${season}`, headers, seasonEpisodesSchema)
  const today = todayUtc()

  return { minutes: episodes.reduce((total, episode) => total + airedMinutes(episode, today), NO_MINUTES) }
}

export async function tmdbTitleMinutes(reference: string, season: number | null, env: Env): Promise<TitleLength> {
  const headers = authorizedHeaders(env)

  return season === null ? movieMinutes(reference, headers) : seasonMinutes(reference, season, headers)
}
