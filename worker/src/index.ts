import { maxLength, minLength, pipe, regex, safeParse, string, trim } from 'valibot'
import { corsHeaders, forbiddenResponse, isAllowedOrigin, preflightResponse } from './cors'
import { searchIgdb } from './igdb'
import { searchOpenLibrary } from './openLibrary'
import { searchTmdb, tmdbAiredSeasons } from './tmdb'
import type { Env, SearchResponse } from './types'

const SEARCH_PATH = '/search'
const SEASONS_PATH = '/seasons'
const READ_METHOD = 'GET'
const PREFLIGHT_METHOD = 'OPTIONS'
const QUERY_PARAMETER = 'q'
const TV_PARAMETER = 'tv'
const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 100
const DIGITS_ONLY = /^\d+$/
const SOURCE_DEADLINE_MS = 8000
const BAD_REQUEST_STATUS = 400
const NOT_FOUND_STATUS = 404
const BAD_GATEWAY_STATUS = 502

const SOURCES = [
  { name: 'tmdb', search: searchTmdb },
  { name: 'openlibrary', search: searchOpenLibrary },
  { name: 'igdb', search: searchIgdb },
] as const

const querySchema = pipe(string(), trim(), minLength(MIN_QUERY_LENGTH), maxLength(MAX_QUERY_LENGTH))
const tvIdSchema = pipe(string(), regex(DIGITS_ONLY))

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

    if (request.method !== READ_METHOD) {
      return new Response(null, { status: NOT_FOUND_STATUS, headers })
    }

    if (url.pathname === SEARCH_PATH) {
      const query = safeParse(querySchema, url.searchParams.get(QUERY_PARAMETER))

      if (!query.success) {
        return new Response(null, { status: BAD_REQUEST_STATUS, headers })
      }

      return Response.json(await searchAllSources(query.output, env), { headers })
    }

    if (url.pathname === SEASONS_PATH) {
      const tvId = safeParse(tvIdSchema, url.searchParams.get(TV_PARAMETER))

      if (!tvId.success) {
        return new Response(null, { status: BAD_REQUEST_STATUS, headers })
      }

      try {
        return Response.json({ seasons: await tmdbAiredSeasons(tvId.output, env) }, { headers })
      } catch {
        return new Response(null, { status: BAD_GATEWAY_STATUS, headers })
      }
    }

    return new Response(null, { status: NOT_FOUND_STATUS, headers })
  },
} satisfies ExportedHandler<Env>
