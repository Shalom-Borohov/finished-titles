import { afterEach, vi } from 'vitest'
import worker from '../../src/index'
import type { Env, SearchResponse } from '../../src/types'

export const APP_ORIGIN = 'https://shalom-borohov.github.io'
export const LOCAL_ORIGIN = 'http://localhost:5173'
export const OTHER_ORIGIN = 'https://not-the-app.example'
export const BASE_ENV: Env = { ALLOWED_ORIGINS: `${APP_ORIGIN},${LOCAL_ORIGIN}` }
export const ALLOWED_ORIGIN_HEADERS = { Origin: APP_ORIGIN }
export const TMDB_HOST = 'api.themoviedb.org'
export const TMDB_ENV: Env = { ...BASE_ENV, TMDB_TOKEN: 'tmdb-test-token' }

const WORKER_URL = 'https://finished-titles-search.example'

export type RecordedRequest = {
  url: URL
  method: string
  headers: Headers
  body: string
}

type UpstreamHandler = (request: RecordedRequest) => Response | Promise<Response>

export function stubUpstreams(handlers: Record<string, UpstreamHandler>): RecordedRequest[] {
  const recorded: RecordedRequest[] = []

  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const outgoing = new Request(input, init)
    const url = new URL(outgoing.url)

    const request: RecordedRequest = {
      url,
      method: outgoing.method,
      headers: outgoing.headers,
      body: await outgoing.text(),
    }

    recorded.push(request)

    if (!Object.hasOwn(handlers, url.hostname)) {
      throw new Error(`Unexpected upstream ${url.hostname}`)
    }

    return handlers[url.hostname](request)
  })

  return recorded
}

export function requestTo(recorded: RecordedRequest[], hostname: string): RecordedRequest {
  const request = recorded.find(({ url }) => url.hostname === hostname)

  if (!request) {
    throw new Error(`No request reached ${hostname}`)
  }

  return request
}

export function callWorker(path: string, init: RequestInit, env: Env = BASE_ENV) {
  return worker.fetch(new Request(`${WORKER_URL}${path}`, init), env)
}

export function search(query: string, env: Env = BASE_ENV) {
  const params = new URLSearchParams({ q: query })

  return callWorker(`/search?${params}`, { headers: ALLOWED_ORIGIN_HEADERS }, env)
}

export async function searchBody(query: string, env: Env = BASE_ENV) {
  const response = await search(query, env)

  return response.json<SearchResponse>()
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
