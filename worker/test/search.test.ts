import { describe, expect, it, vi } from 'vitest'
import {
  ALLOWED_ORIGIN_HEADERS,
  BASE_ENV,
  callWorker,
  requestTo,
  search,
  searchBody,
  stubUpstreams,
  TMDB_HOST,
} from './helpers/worker'

const OPEN_LIBRARY_HOST = 'openlibrary.org'
const TWITCH_HOST = 'id.twitch.tv'
const IGDB_HOST = 'api.igdb.com'
const SOURCE_DEADLINE_MS = 8000

const ALL_SOURCES_ENV = {
  ...BASE_ENV,
  TMDB_TOKEN: 'tmdb-token',
  TWITCH_CLIENT_ID: 'client-id',
  TWITCH_CLIENT_SECRET: 'client-secret',
}

const tmdbReply = () => Response.json({ results: [{ id: 1, media_type: 'movie', title: 'From TMDB' }] })
const openLibraryReply = () => Response.json({ docs: [{ key: '/works/OL1W', title: 'From Open Library' }] })
const twitchReply = () => Response.json({ access_token: 'token' })
const igdbReply = () => Response.json([{ id: 1, name: 'From IGDB' }])
const neverSettles = () => new Promise<Response>(() => {})

describe('search merging', () => {
  it('answers 200 JSON with results in TMDB, Open Library, IGDB order', async () => {
    stubUpstreams({
      [TMDB_HOST]: tmdbReply,
      [OPEN_LIBRARY_HOST]: openLibraryReply,
      [TWITCH_HOST]: twitchReply,
      [IGDB_HOST]: igdbReply,
    })

    const response = await search('from', ALL_SOURCES_ENV)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    expect(body).toEqual({
      results: [
        { source: 'tmdb', sourceId: 'movie/1', title: 'From TMDB', type: 'movie' },
        { source: 'openlibrary', sourceId: '/works/OL1W', title: 'From Open Library', type: 'book' },
        { source: 'igdb', sourceId: '1', title: 'From IGDB', type: 'game' },
      ],
      unavailable: [],
    })
  })

  it('keeps the merge order when a later source answers first', async () => {
    let releaseTmdb = () => {}

    const tmdbGate = new Promise<void>((resolve) => {
      releaseTmdb = resolve
    })

    stubUpstreams({
      [TMDB_HOST]: async () => {
        await tmdbGate

        return tmdbReply()
      },
      [OPEN_LIBRARY_HOST]: () => {
        releaseTmdb()

        return openLibraryReply()
      },
    })

    const body = await searchBody('from', { ...BASE_ENV, TMDB_TOKEN: 'tmdb-token' })

    expect(body.results.map((result) => result.source)).toEqual(['tmdb', 'openlibrary'])
  })

  it('still returns the other sources when one fails', async () => {
    stubUpstreams({
      [TMDB_HOST]: () => new Response('down', { status: 500 }),
      [OPEN_LIBRARY_HOST]: openLibraryReply,
      [TWITCH_HOST]: twitchReply,
      [IGDB_HOST]: igdbReply,
    })

    const body = await searchBody('from', ALL_SOURCES_ENV)

    expect(body.results.map((result) => result.source)).toEqual(['openlibrary', 'igdb'])
    expect(body.unavailable).toEqual(['tmdb'])
  })

  it('answers 200 with every source listed when all of them fail', async () => {
    stubUpstreams({})

    const response = await search('from', ALL_SOURCES_ENV)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ results: [], unavailable: ['tmdb', 'openlibrary', 'igdb'] })
  })

  it('lists a source that never answers as unavailable and still returns the rest', async () => {
    vi.useFakeTimers()

    stubUpstreams({
      [TMDB_HOST]: tmdbReply,
      [OPEN_LIBRARY_HOST]: neverSettles,
    })

    const pendingResponse = search('from', { ...BASE_ENV, TMDB_TOKEN: 'tmdb-token' })

    await vi.advanceTimersByTimeAsync(SOURCE_DEADLINE_MS)

    const response = await pendingResponse
    const body = await response.json()

    expect(body).toEqual({
      results: [{ source: 'tmdb', sourceId: 'movie/1', title: 'From TMDB', type: 'movie' }],
      unavailable: ['openlibrary'],
    })
  })
})

describe('query validation', () => {
  it.each([
    ['empty', '/search?q='],
    ['absent', '/search'],
    ['one character', '/search?q=a'],
    ['one character once trimmed', '/search?q=%20a%20'],
    ['only spaces', '/search?q=%20%20%20%20'],
    ['101 characters', `/search?q=${'a'.repeat(101)}`],
  ])('answers 400 without calling out when q is %s', async (_description, path) => {
    const requests = stubUpstreams({ [OPEN_LIBRARY_HOST]: openLibraryReply })

    const response = await callWorker(path, { headers: ALLOWED_ORIGIN_HEADERS })

    expect(response.status).toBe(400)
    expect(requests).toEqual([])
  })

  it.each([
    ['2 characters', 'ab'],
    ['100 characters', 'a'.repeat(100)],
    ['Hebrew', 'שלום'],
  ])('accepts %s', async (_description, query) => {
    stubUpstreams({ [OPEN_LIBRARY_HOST]: openLibraryReply })

    const response = await search(query)

    expect(response.status).toBe(200)
  })

  it('measures and forwards the trimmed query', async () => {
    const paddedHundred = `  ${'a'.repeat(100)}  `
    const requests = stubUpstreams({ [OPEN_LIBRARY_HOST]: openLibraryReply })

    const response = await search(paddedHundred)

    expect(response.status).toBe(200)
    expect(requestTo(requests, OPEN_LIBRARY_HOST).url.searchParams.get('q')).toBe('a'.repeat(100))
  })
})

describe('routing', () => {
  it.each(['/', '/search/', '/other', '/search/extra', '/seasons/', '/seasons/1396', '/season'])(
    'answers 404 for the path %s',
    async (path) => {
      const requests = stubUpstreams({})

      const response = await callWorker(`${path}?q=dune&tv=1396`, { headers: ALLOWED_ORIGIN_HEADERS })

      expect(response.status).toBe(404)
      expect(requests).toEqual([])
    },
  )

  it.each(
    ['POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].flatMap((method) => [
      [method, '/search?q=dune'],
      [method, '/seasons?tv=1396'],
    ]),
  )('answers 404 for %s on %s', async (method, path) => {
    const requests = stubUpstreams({})

    const response = await callWorker(path, { method, headers: ALLOWED_ORIGIN_HEADERS })

    expect(response.status).toBe(404)
    expect(requests).toEqual([])
  })

  it('never lets the caller choose the upstream', async () => {
    const requests = stubUpstreams({ [OPEN_LIBRARY_HOST]: openLibraryReply })

    await callWorker('/search?q=dune&apiurl=https://attacker.example/', { headers: ALLOWED_ORIGIN_HEADERS })

    expect(requests.map(({ url }) => url.hostname)).toEqual([OPEN_LIBRARY_HOST])
  })
})
