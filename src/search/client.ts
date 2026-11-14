import {
  array,
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
import { posterUrlSchema, SEARCH_SOURCES, SEARCHABLE_TYPES } from '../domain/types'

const searchResultSchema = object({
  source: picklist(SEARCH_SOURCES),
  sourceId: string(),
  title: string(),
  type: picklist(SEARCHABLE_TYPES),
  year: optional(number()),
  posterUrl: optional(posterUrlSchema),
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
})

const showPrefillSchema = object({
  seasons: pipe(number(), integer(), minValue(0)),
  endYear: optional(pipe(number(), integer())),
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

export async function searchTitles(query: string, signal: AbortSignal): Promise<SearchResponse> {
  return parse(searchResponseSchema, await fetchFromSearchService(`/search?q=${encodeURIComponent(query)}`, signal))
}

const tmdbTitleMatch = (titleId: string) => TMDB_TITLE_ID.exec(titleId)

export const isTmdbShowId = (titleId: string) => tmdbTitleMatch(titleId)?.[1] === TMDB_SHOW_KIND

export function tmdbTvId({ source, sourceId }: SearchResult) {
  const match = tmdbTitleMatch(sourceId)

  return source === 'tmdb' && match?.[1] === TMDB_SHOW_KIND ? match[2] : undefined
}

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
