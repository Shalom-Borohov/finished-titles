import { maxLength, minLength, pipe, safeParse, string, trim } from 'valibot'
import { corsHeaders, forbiddenResponse, isAllowedOrigin, preflightResponse } from './cors'
import { searchIgdb } from './igdb'
import { searchOpenLibrary } from './openLibrary'
import { searchTmdb } from './tmdb'
import type { Env, SearchResponse } from './types'

const SEARCH_PATH = '/search'
const SEARCH_METHOD = 'GET'
const PREFLIGHT_METHOD = 'OPTIONS'
const QUERY_PARAMETER = 'q'
const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 100
const SOURCE_DEADLINE_MS = 8000
const BAD_REQUEST_STATUS = 400
const NOT_FOUND_STATUS = 404

const SOURCES = [
  { name: 'tmdb', search: searchTmdb },
  { name: 'openlibrary', search: searchOpenLibrary },
  { name: 'igdb', search: searchIgdb },
] as const

const querySchema = pipe(string(), trim(), minLength(MIN_QUERY_LENGTH), maxLength(MAX_QUERY_LENGTH))

function rejectAtDeadline(): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error('Source missed the deadline')), SOURCE_DEADLINE_MS)
  })
}

async function searchAllSources(query: string, env: Env): Promise<SearchResponse> {
  const outcomes = await Promise.allSettled(
    SOURCES.map((source) => Promise.race([source.search(query, env), rejectAtDeadline()])),
  )

  return {
    results: outcomes.flatMap((outcome) => (outcome.status === 'fulfilled' ? outcome.value : [])),
    unavailable: SOURCES.filter((_source, index) => outcomes[index].status === 'rejected').map((source) => source.name),
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin')

    if (!isAllowedOrigin(origin, env.ALLOWED_ORIGINS)) {
      return forbiddenResponse()
    }

    if (request.method === PREFLIGHT_METHOD) {
      return preflightResponse(origin)
    }

    const headers = corsHeaders(origin)
    const url = new URL(request.url)

    if (request.method !== SEARCH_METHOD || url.pathname !== SEARCH_PATH) {
      return new Response(null, { status: NOT_FOUND_STATUS, headers })
    }

    const query = safeParse(querySchema, url.searchParams.get(QUERY_PARAMETER))

    if (!query.success) {
      return new Response(null, { status: BAD_REQUEST_STATUS, headers })
    }

    return Response.json(await searchAllSources(query.output, env), { headers })
  },
} satisfies ExportedHandler<Env>
