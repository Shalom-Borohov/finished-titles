import {
  array,
  filterItems,
  type InferOutput,
  integer,
  is,
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

const airedSeasonsSchema = object({ seasons: pipe(number(), integer(), minValue(0)) })

const TMDB_TV_ID = /^tv\/(\d+)$/

export type SearchResponse = InferOutput<typeof searchResponseSchema>

export type SearchResult = SearchResponse['results'][number]

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

export function tmdbTvId({ source, sourceId }: SearchResult) {
  return source === 'tmdb' ? sourceId.match(TMDB_TV_ID)?.[1] : undefined
}

export async function fetchAiredSeasons(tvId: string, signal: AbortSignal): Promise<number> {
  const path = `/seasons?tv=${encodeURIComponent(tvId)}`

  return parse(airedSeasonsSchema, await fetchFromSearchService(path, signal)).seasons
}
