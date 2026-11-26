import { authorizedHeaders, isFullDate, TV_REFERENCE_PREFIX, tmdbJson } from './tmdb'
import {
  aggregateCreditsSchema,
  movieCreditsSchema,
  movieDetailsSchema,
  type TmdbCastMember,
  type TmdbCrewMember,
  type TmdbGenre,
  type TmdbWatchProviders,
  tvDetailsSchema,
  watchProvidersSchema,
} from './tmdbDetailsSchemas'
import type { Env, TitleDetails } from './types'
import { isPositiveInteger, isUsableTitle } from './upstream'

const MAX_CAST = 5
const DIRECTOR_JOB = 'Director'

function isNamedGenre(genre: TmdbGenre): genre is TitleDetails['genres'][number] {
  return typeof genre.id === 'number' && isUsableTitle(genre.name)
}

function namesOf(people: { name?: string | null }[]) {
  return people.map(({ name }) => name).filter(isUsableTitle)
}

function genresOf(genres: TmdbGenre[]) {
  return genres.filter(isNamedGenre)
}

function directorsOf(crew: TmdbCrewMember[]) {
  return [...new Set(namesOf(crew.filter(({ job }) => job === DIRECTOR_JOB)))]
}

function leadingCast(cast: TmdbCastMember[]) {
  return namesOf(cast.toSorted((first, second) => first.order - second.order)).slice(0, MAX_CAST)
}

function israeliStreamers(providers: TmdbWatchProviders) {
  return providers.results.IL.flatrate
    .toSorted((first, second) => first.display_priority - second.display_priority)
    .map(({ provider_name }) => provider_name)
    .filter(isUsableTitle)
}

async function tvDetails(reference: string, headers: HeadersInit): Promise<TitleDetails> {
  const [details, credits, providers] = await Promise.all([
    tmdbJson(reference, headers, tvDetailsSchema),
    tmdbJson(`${reference}/aggregate_credits`, headers, aggregateCreditsSchema),
    tmdbJson(`${reference}/watch/providers`, headers, watchProvidersSchema),
  ])

  const [episodeMinutes] = details.episode_run_time
  const nextEpisodeDate = details.next_episode_to_air?.air_date

  return {
    originalTitle: isUsableTitle(details.original_name) ? details.original_name : undefined,
    genres: genresOf(details.genres),
    creators: namesOf(details.created_by),
    cast: leadingCast(credits.cast),
    networks: namesOf(details.networks),
    episodes: isPositiveInteger(details.number_of_episodes) ? details.number_of_episodes : undefined,
    episodeMinutes: isPositiveInteger(episodeMinutes) ? episodeMinutes : undefined,
    nextEpisodeDate: isFullDate(nextEpisodeDate) ? nextEpisodeDate : undefined,
    watchInIsrael: israeliStreamers(providers),
  }
}

async function movieDetails(reference: string, headers: HeadersInit): Promise<TitleDetails> {
  const [details, credits, providers] = await Promise.all([
    tmdbJson(reference, headers, movieDetailsSchema),
    tmdbJson(`${reference}/credits`, headers, movieCreditsSchema),
    tmdbJson(`${reference}/watch/providers`, headers, watchProvidersSchema),
  ])

  return {
    originalTitle: isUsableTitle(details.original_title) ? details.original_title : undefined,
    genres: genresOf(details.genres),
    creators: directorsOf(credits.crew),
    cast: leadingCast(credits.cast),
    networks: [],
    runtimeMinutes: isPositiveInteger(details.runtime) ? details.runtime : undefined,
    watchInIsrael: israeliStreamers(providers),
  }
}

export async function tmdbTitleDetails(reference: string, env: Env): Promise<TitleDetails> {
  const headers = authorizedHeaders(env)

  return reference.startsWith(TV_REFERENCE_PREFIX) ? tvDetails(reference, headers) : movieDetails(reference, headers)
}
