import { array, filterItems, type InferOutput, is, number, object, optional, parse, pick, picklist, pipe, string, unknown } from 'valibot'
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

export type SearchResponse = InferOutput<typeof searchResponseSchema>

export type SearchResult = SearchResponse['results'][number]

export async function searchTitles(query: string, signal: AbortSignal): Promise<SearchResponse> {
  const baseUrl: string | undefined = import.meta.env.VITE_SEARCH_URL

  if (!baseUrl) {
    throw new Error('search service is not configured')
  }

  const response = await fetch(`${baseUrl}/search?q=${encodeURIComponent(query)}`, { signal })

  if (!response.ok) {
    throw new Error(`search failed with status ${response.status}`)
  }

  return parse(searchResponseSchema, await response.json())
}
