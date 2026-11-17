import { describe, expect, it, vi } from 'vitest'
import { PAGE_SIZE } from '../src/upstream'
import {
  ALLOWED_ORIGIN_HEADERS,
  BASE_ENV,
  callWorker,
  emptyOpenLibraryReply,
  IGDB_HOST,
  igdbGames,
  OPEN_LIBRARY_HOST,
  requestTo,
  search,
  searchBody,
  stubUpstreams,
  TMDB_HOST,
  TWITCH_HOST,
} from './helpers/worker'

const SOURCE_DEADLINE_MS = 8000
const SINGLE_PAGE = 1
const LAST_ACCEPTED_PAGE = 500

const ALL_SOURCES_ENV = {
  ...BASE_ENV,
  TMDB_TOKEN: 'tmdb-token',
  TWITCH_CLIENT_ID: 'client-id',
  TWITCH_CLIENT_SECRET: 'client-secret',
}

const tmdbMovies = [{ id: 1, media_type: 'movie', title: 'From TMDB' }]
const openLibraryBooks = [{ key: '/works/OL1W', title: 'From Open Library' }]

const tmdbReply = (totalPages = SINGLE_PAGE) => Response.json({ results: tmdbMovies, total_pages: totalPages })
const openLibraryReply = (numFound = openLibraryBooks.length) => Response.json({ docs: openLibraryBooks, numFound })
const twitchReply = () => Response.json({ access_token: 'token' })
const igdbReply = () => Response.json([{ id: 1, name: 'From IGDB' }])
const igdbReplyWithMore = () => Response.json(igdbGames(PAGE_SIZE))
const neverSettles = () => new Promise<Response>(() => {})

const allSourcesAnswering = {
  [TMDB_HOST]: () => tmdbReply(),
  [OPEN_LIBRARY_HOST]: () => openLibraryReply(),
  [TWITCH_HOST]: twitchReply,
  [IGDB_HOST]: igdbReply,
}

describe('search merging', () => {
  it('answers 200 JSON with results in TMDB, Open Library, IGDB order', async () => {
    stubUpstreams(allSourcesAnswering)

    const response = await search('from', { env: ALL_SOURCES_ENV })
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
      hasMore: false,
    })
  })

  it.each([
    ['TMDB', { [TMDB_HOST]: () => tmdbReply(SINGLE_PAGE + 1) }],
    ['Open Library', { [OPEN_LIBRARY_HOST]: () => openLibraryReply(PAGE_SIZE + 1) }],
    ['IGDB', { [IGDB_HOST]: igdbReplyWithMore }],
  ])('has more when only %s has another page', async (_description, sourceWithMore) => {
    stubUpstreams({ ...allSourcesAnswering, ...sourceWithMore })

    const body = await searchBody('from', { env: ALL_SOURCES_ENV })

    expect(body.hasMore).toBe(true)
  })

  it('has no more on the last page the Worker accepts, even when a source has more', async () => {
    stubUpstreams({ ...allSourcesAnswering, [TMDB_HOST]: () => tmdbReply(LAST_ACCEPTED_PAGE + 1) })

    const body = await searchBody('from', { env: ALL_SOURCES_ENV, page: LAST_ACCEPTED_PAGE })

    expect(body.hasMore).toBe(false)
  })

  it('ignores the page count of a source that failed', async () => {
    stubUpstreams({
      ...allSourcesAnswering,
      [TMDB_HOST]: () => Response.json({ results: 'none', total_pages: 5 }),
    })

    const body = await searchBody('from', { env: ALL_SOURCES_ENV })

    expect(body.unavailable).toEqual(['tmdb'])
    expect(body.hasMore).toBe(false)
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

    const body = await searchBody('from', { env: { ...BASE_ENV, TMDB_TOKEN: 'tmdb-token' } })

    expect(body.results.map((result) => result.source)).toEqual(['tmdb', 'openlibrary'])
  })

  it('still returns the other sources when one fails', async () => {
    stubUpstreams({ ...allSourcesAnswering, [TMDB_HOST]: () => new Response('down', { status: 500 }) })

    const body = await searchBody('from', { env: ALL_SOURCES_ENV })

    expect(body.results.map((result) => result.source)).toEqual(['openlibrary', 'igdb'])
    expect(body.unavailable).toEqual(['tmdb'])
  })

  it('answers 200 with every source listed when all of them fail', async () => {
    stubUpstreams({})

    const response = await search('from', { env: ALL_SOURCES_ENV })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ results: [], unavailable: ['tmdb', 'openlibrary', 'igdb'], hasMore: false })
  })

  it('lists a source that never answers as unavailable and still returns the rest', async () => {
    vi.useFakeTimers()

    stubUpstreams({ ...allSourcesAnswering, [OPEN_LIBRARY_HOST]: neverSettles })

    const pendingResponse = search('from', { env: ALL_SOURCES_ENV })

    await vi.advanceTimersByTimeAsync(SOURCE_DEADLINE_MS)

    const response = await pendingResponse
    const body = await response.json()

    expect(body).toEqual({
      results: [
        { source: 'tmdb', sourceId: 'movie/1', title: 'From TMDB', type: 'movie' },
        { source: 'igdb', sourceId: '1', title: 'From IGDB', type: 'game' },
      ],
      unavailable: ['openlibrary'],
      hasMore: false,
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
    const requests = stubUpstreams({ [OPEN_LIBRARY_HOST]: emptyOpenLibraryReply })

    const response = await callWorker(path, { headers: ALLOWED_ORIGIN_HEADERS })

    expect(response.status).toBe(400)
    expect(requests).toEqual([])
  })

  it.each([
    ['2 characters', 'ab'],
    ['100 characters', 'a'.repeat(100)],
    ['Hebrew', 'שלום'],
  ])('accepts %s', async (_description, query) => {
    stubUpstreams({ [OPEN_LIBRARY_HOST]: emptyOpenLibraryReply })

    const response = await search(query)

    expect(response.status).toBe(200)
  })

  it('measures and forwards the trimmed query', async () => {
    const paddedHundred = `  ${'a'.repeat(100)}  `
    const requests = stubUpstreams({ [OPEN_LIBRARY_HOST]: emptyOpenLibraryReply })

    const response = await search(paddedHundred)

    expect(response.status).toBe(200)
    expect(requestTo(requests, OPEN_LIBRARY_HOST).url.searchParams.get('q')).toBe('a'.repeat(100))
  })
})

describe('page validation', () => {
  it.each([
    ['zero', '0'],
    ['past the last page', '501'],
    ['not a number', 'abc'],
    ['a fraction', '1.5'],
    ['negative', '-1'],
    ['empty', ''],
  ])('answers 400 without calling out when page is %s', async (_description, page) => {
    const requests = stubUpstreams({ [OPEN_LIBRARY_HOST]: emptyOpenLibraryReply })

    const response = await callWorker(`/search?q=dune&page=${page}`, { headers: ALLOWED_ORIGIN_HEADERS })

    expect(response.status).toBe(400)
    expect(requests).toEqual([])
  })

  it.each(['1', '500'])('accepts page %s', async (page) => {
    stubUpstreams({ [OPEN_LIBRARY_HOST]: emptyOpenLibraryReply })

    const response = await callWorker(`/search?q=dune&page=${page}`, { headers: ALLOWED_ORIGIN_HEADERS })

    expect(response.status).toBe(200)
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
    const requests = stubUpstreams({ [OPEN_LIBRARY_HOST]: emptyOpenLibraryReply })

    await callWorker('/search?q=dune&apiurl=https://attacker.example/', { headers: ALLOWED_ORIGIN_HEADERS })

    expect(requests.map(({ url }) => url.hostname)).toEqual([OPEN_LIBRARY_HOST])
  })
})
