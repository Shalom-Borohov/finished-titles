import { array, nullish, number, object, string } from 'valibot'
import type { SearchResult } from './types'
import { isUsableTitle, parseUpstreamJson } from './upstream'

const SEARCH_URL = 'https://openlibrary.org/search.json'
const COVER_URL = 'https://covers.openlibrary.org/b/id'
const USER_AGENT = 'finished-titles (personal project)'
const REQUESTED_FIELDS = 'key,title,first_publish_year,cover_i'
const MAX_RESULTS = 5

const responseSchema = object({
  docs: array(
    object({
      key: string(),
      title: nullish(string()),
      first_publish_year: nullish(number()),
      cover_i: nullish(number()),
    }),
  ),
})

export async function searchOpenLibrary(query: string): Promise<SearchResult[]> {
  const url = new URL(SEARCH_URL)

  url.search = new URLSearchParams({
    q: query,
    fields: REQUESTED_FIELDS,
    limit: String(MAX_RESULTS),
  }).toString()

  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  const { docs } = await parseUpstreamJson(response, responseSchema)

  const results = docs.flatMap((doc): SearchResult[] => {
    if (!isUsableTitle(doc.title)) {
      return []
    }

    return [
      {
        source: 'openlibrary',
        sourceId: doc.key,
        title: doc.title,
        type: 'book',
        year: doc.first_publish_year ?? undefined,
        posterUrl: doc.cover_i == null ? undefined : `${COVER_URL}/${doc.cover_i}-M.jpg`,
      },
    ]
  })

  return results.slice(0, MAX_RESULTS)
}
