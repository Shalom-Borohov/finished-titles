import {
  array,
  boolean,
  check,
  fallback,
  filterItems,
  type InferOutput,
  integer,
  is,
  isoDate,
  minValue,
  number,
  object,
  optional,
  parse,
  pick,
  picklist,
  pipe,
  string,
  unknown,
} from 'valibot'
import { isFinishDate } from '../domain/finishDate'
import { MINIMUM_MINUTES, posterUrlSchema, SEARCH_SOURCES, SEARCHABLE_TYPES } from '../domain/types'

const searchResultSchema = object({
  source: picklist(SEARCH_SOURCES),
  sourceId: string(),
  title: string(),
  type: picklist(SEARCHABLE_TYPES),
  year: optional(number()),
  posterUrl: optional(posterUrlSchema),
  genreIds: optional(array(number())),
})

const kindSchema = object({ source: string(), type: string() })

const knownKindSchema = pick(searchResultSchema, ['source', 'type'])

const isUnknownKind = (result: unknown) => is(kindSchema, result) && !is(knownKindSchema, result)

const searchResponseSchema = object({
  results: pipe(
    array(unknown()),
    filterItems((result) => !isUnknownKind(result)),
    array(searchResultSchema),
  ),
  unavailable: array(string()),
  hasMore: optional(boolean(), false),
})

const showPrefillSchema = object({
  seasons: pipe(number(), integer(), minValue(0)),
  endYear: optional(pipe(number(), integer())),
})

const lengthSchema = object({
  minutes: optional(pipe(number(), integer(), minValue(MINIMUM_MINUTES))),
})

const minutesSchema = pipe(number(), integer(), minValue(1))

const namesSchema = optional(array(string()), [])

const titleDetailsSchema = object({
  originalTitle: optional(string()),
  genres: optional(array(object({ id: number(), name: string() })), []),
  creators: namesSchema,
  cast: namesSchema,
  networks: namesSchema,
  episodes: optional(pipe(number(), integer(), minValue(1))),
  episodeMinutes: optional(minutesSchema),
  runtimeMinutes: optional(minutesSchema),
  nextEpisodeDate: fallback(optional(pipe(string(), isoDate(), check(isFinishDate))), undefined),
  watchInIsrael: namesSchema,
})

const TMDB_TITLE_ID = /^(tv|movie)\/(\d+)$/

const TMDB_SHOW_KIND = 'tv'

export type SearchResponse = InferOutput<typeof searchResponseSchema>

export type SearchResult = SearchResponse['results'][number]

export type ShowPrefill = InferOutput<typeof showPrefillSchema>

export type Length = InferOutput<typeof lengthSchema>

export type TitleDetails = InferOutput<typeof titleDetailsSchema>

async function fetchFromSearchService(path: string, signal: AbortSignal): Promise<unknown> {
  const baseUrl: string | undefined = import.meta.env.VITE_SEARCH_URL

  if (!baseUrl) {
    throw new Error('search service is not configured')
  }

  const response = await fetch(`${baseUrl}${path}`, { signal })

  if (!response.ok) {
    throw new Error(`search service failed with status ${response.status}`)
  }

  return response.json()
}

export async function searchTitles(query: string, page: number, signal: AbortSignal): Promise<SearchResponse> {
  const path = `/search?q=${encodeURIComponent(query)}&page=${page}`

  return parse(searchResponseSchema, await fetchFromSearchService(path, signal))
}

const tmdbTitleMatch = (titleId: string) => TMDB_TITLE_ID.exec(titleId)

export function tvIdOfTitle(titleId: string) {
  const match = tmdbTitleMatch(titleId)

  return match?.[1] === TMDB_SHOW_KIND ? match[2] : undefined
}

export const isTmdbShowId = (titleId: string) => tvIdOfTitle(titleId) !== undefined

export function tmdbTitleId({ source, sourceId }: Partial<Pick<SearchResult, 'source' | 'sourceId'>>) {
  return source === 'tmdb' && sourceId && tmdbTitleMatch(sourceId) ? sourceId : undefined
}

export async function fetchShowPrefill(tvId: string, signal: AbortSignal): Promise<ShowPrefill> {
  const path = `/seasons?tv=${encodeURIComponent(tvId)}`

  return parse(showPrefillSchema, await fetchFromSearchService(path, signal))
}

export async function fetchTitleDetails(titleId: string, signal: AbortSignal): Promise<TitleDetails> {
  const path = `/details?title=${encodeURIComponent(titleId)}`

  return parse(titleDetailsSchema, await fetchFromSearchService(path, signal))
}

export async function fetchLength(titleId: string, season: number | undefined, signal: AbortSignal): Promise<Length> {
  const query = new URLSearchParams({ title: titleId })

  if (season !== undefined) {
    query.set('season', String(season))
  }

  return parse(lengthSchema, await fetchFromSearchService(`/length?${query}`, signal))
}
