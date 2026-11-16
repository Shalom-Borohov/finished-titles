import { array, nullish, number, object, string } from 'valibot'
import type { SearchResult, SourcePage } from './types'
import { isUsableTitle, PAGE_SIZE, parseUpstreamJson } from './upstream'

const SEARCH_URL = 'https://openlibrary.org/search.json'
const COVER_URL = 'https://covers.openlibrary.org/b/id'
const USER_AGENT = 'finished-titles (personal project)'
const REQUESTED_FIELDS = 'key,title,first_publish_year,cover_i'

const responseSchema = object({
  docs: array(
    object({
      key: string(),
      title: nullish(string()),
      first_publish_year: nullish(number()),
      cover_i: nullish(number()),
    }),
  ),
  numFound: number(),
})

export async function searchOpenLibrary(query: string, page: number): Promise<SourcePage> {
  const url = new URL(SEARCH_URL)

  url.search = new URLSearchParams({
    q: query,
    fields: REQUESTED_FIELDS,
    limit: String(PAGE_SIZE),
    page: String(page),
  }).toString()

  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  const { docs, numFound } = await parseUpstreamJson(response, responseSchema)

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

  return { results, hasMore: page * PAGE_SIZE < numFound }
}
