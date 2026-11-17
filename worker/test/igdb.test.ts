import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Env, SearchResponse } from '../src/types'
import { PAGE_SIZE } from '../src/upstream'
import {
  APP_ORIGIN,
  BASE_ENV,
  emptyOpenLibraryReply,
  IGDB_HOST,
  igdbGames,
  OPEN_LIBRARY_HOST,
  requestTo,
  searchPath,
  stubUpstreams,
  TWITCH_HOST,
  WORKER_URL,
} from './helpers/worker'

const FIRST_TOKEN = 'first-token'
const SECOND_TOKEN = 'second-token'
const UTC_START_OF_2010 = 1262304000

const IGDB_ENV: Env = {
  ...BASE_ENV,
  TWITCH_CLIENT_ID: 'test-client-id',
  TWITCH_CLIENT_SECRET: 'test-client-secret',
}

const unauthorized = () => new Response('expired', { status: 401 })

type Reply = () => Response

function tokenReplies() {
  const tokens = [FIRST_TOKEN, SECOND_TOKEN]

  return () => Response.json({ access_token: tokens.shift(), expires_in: 5000000, token_type: 'bearer' })
}

function stubIgdb(igdbReply: Reply, twitchReply: Reply = tokenReplies()) {
  return stubUpstreams({
    [TWITCH_HOST]: twitchReply,
    [IGDB_HOST]: igdbReply,
    [OPEN_LIBRARY_HOST]: emptyOpenLibraryReply,
  })
}

function stubIgdbGames(games: object[]) {
  return stubIgdb(() => Response.json(games))
}

function requestsTo(recorded: ReturnType<typeof stubUpstreams>, hostname: string) {
  return recorded.filter(({ url }) => url.hostname === hostname)
}

async function freshSearcher(env: Env = IGDB_ENV) {
  const { default: worker } = await import('../src/index')

  return async (query: string, page?: number) => {
    const response = await worker.fetch(
      new Request(`${WORKER_URL}${searchPath(query, page)}`, { headers: { Origin: APP_ORIGIN } }),
      env,
    )

    return response.json<SearchResponse>()
  }
}

describe('IGDB search', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('maps a game with its cover and UTC release year', async () => {
    stubIgdbGames([
      { id: 1942, name: 'The Witcher 3', cover: { id: 9, image_id: 'co1wyy' }, first_release_date: UTC_START_OF_2010 },
    ])

    const search = await freshSearcher()
    const body = await search('witcher')

    expect(body.results).toStrictEqual([
      {
        source: 'igdb',
        sourceId: '1942',
        title: 'The Witcher 3',
        type: 'game',
        year: 2010,
        posterUrl: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1wyy.jpg',
      },
    ])
  })

  it('reads the year in UTC at the very end of a year', async () => {
    stubIgdbGames([{ id: 1, name: 'Late release', first_release_date: UTC_START_OF_2010 - 1 }])

    const search = await freshSearcher()
    const body = await search('late')

    expect(body.results[0].year).toBe(2009)
  })

  it('omits the year and poster when the game has neither', async () => {
    stubIgdbGames([{ id: 2, name: 'Unreleased' }])

    const search = await freshSearcher()
    const body = await search('unreleased')

    expect(body.results).toStrictEqual([{ source: 'igdb', sourceId: '2', title: 'Unreleased', type: 'game' }])
  })

  it('drops games with no name and keeps the rest of the page', async () => {
    stubIgdbGames([{ id: 100 }, { id: 101, name: '' }, ...igdbGames(6)])

    const search = await freshSearcher()
    const body = await search('game')

    expect(body.results.map((result) => result.sourceId)).toEqual(['1', '2', '3', '4', '5', '6'])
  })

  it.each([
    ['a full page, unnamed games included', PAGE_SIZE, true],
    ['less than a full page', PAGE_SIZE - 1, false],
    ['no games', 0, false],
  ])('says whether IGDB has another page when it returns %s', async (_description, gameCount, hasMore) => {
    const games = igdbGames(gameCount).map((game, position) => (position === 0 ? { ...game, name: null } : game))

    stubIgdbGames(games)

    const search = await freshSearcher()
    const body = await search('game')

    expect(body.hasMore).toBe(hasMore)
  })

  it('asks Twitch for a client-credentials token', async () => {
    const requests = stubIgdbGames([])

    const search = await freshSearcher()
    await search('zelda')

    const tokenRequest = requestTo(requests, TWITCH_HOST)

    expect(tokenRequest.method).toBe('POST')
    expect(tokenRequest.url.pathname).toBe('/oauth2/token')
    expect(Object.fromEntries(new URLSearchParams(tokenRequest.body))).toEqual({
      client_id: 'test-client-id',
      client_secret: 'test-client-secret',
      grant_type: 'client_credentials',
    })
  })

  it('sends the agreed search request, leaving out editions of a game', async () => {
    const requests = stubIgdbGames([])

    const search = await freshSearcher()
    await search('zelda')

    const gamesRequest = requestTo(requests, IGDB_HOST)

    expect(gamesRequest.method).toBe('POST')
    expect(gamesRequest.url.pathname).toBe('/v4/games')
    expect(gamesRequest.headers.get('Client-ID')).toBe('test-client-id')
    expect(gamesRequest.headers.get('Authorization')).toBe(`Bearer ${FIRST_TOKEN}`)
    expect(gamesRequest.body).toBe(
      `search "zelda"; fields name,cover.image_id,first_release_date; where version_parent = null; limit ${PAGE_SIZE}; offset 0;`,
    )
  })

  it('skips the games before the requested page', async () => {
    const page = 3
    const requests = stubIgdbGames([])

    const search = await freshSearcher()
    await search('zelda', page)

    expect(requestTo(requests, IGDB_HOST).body).toContain(`limit ${PAGE_SIZE}; offset ${(page - 1) * PAGE_SIZE};`)
  })

  it.each([
    ['a quote', 'a"b', 'a\\"b'],
    ['a backslash', 'a\\b', 'a\\\\b'],
    ['a backslash before a quote', 'a\\"b', 'a\\\\\\"b'],
    ['an attempted clause', 'x"; fields *; limit 500; "', 'x\\"; fields *; limit 500; \\"'],
  ])('escapes %s so the query cannot add IGDB clauses', async (_description, query, escaped) => {
    const requests = stubIgdbGames([])

    const search = await freshSearcher()
    await search(query)

    expect(requestTo(requests, IGDB_HOST).body).toBe(
      `search "${escaped}"; fields name,cover.image_id,first_release_date; where version_parent = null; limit ${PAGE_SIZE}; offset 0;`,
    )
  })

  it('reuses the token across searches', async () => {
    const requests = stubIgdbGames([])

    const search = await freshSearcher()
    await search('first')
    await search('second')

    expect(requestsTo(requests, TWITCH_HOST)).toHaveLength(1)
    expect(requestsTo(requests, IGDB_HOST).map(({ headers }) => headers.get('Authorization'))).toEqual([
      `Bearer ${FIRST_TOKEN}`,
      `Bearer ${FIRST_TOKEN}`,
    ])
  })

  it('refreshes the token once on a 401, retries, and keeps the new token', async () => {
    const igdbReplies = [unauthorized, () => Response.json([{ id: 3, name: 'Retried' }]), () => Response.json([])]

    const requests = stubUpstreams({
      [TWITCH_HOST]: tokenReplies(),
      [IGDB_HOST]: () => igdbReplies.splice(0, 1)[0](),
      [OPEN_LIBRARY_HOST]: emptyOpenLibraryReply,
    })

    const search = await freshSearcher()
    const body = await search('retried')

    await search('afterwards')

    expect(body.results.map((result) => result.title)).toEqual(['Retried'])
    expect(body.unavailable).not.toContain('igdb')
    expect(requestsTo(requests, TWITCH_HOST)).toHaveLength(2)
    expect(requestsTo(requests, IGDB_HOST).map(({ headers }) => headers.get('Authorization'))).toEqual([
      `Bearer ${FIRST_TOKEN}`,
      `Bearer ${SECOND_TOKEN}`,
      `Bearer ${SECOND_TOKEN}`,
    ])
  })

  it('is unavailable after a second 401, without retrying again', async () => {
    const requests = stubIgdb(unauthorized)

    const search = await freshSearcher()
    const body = await search('zelda')

    expect(body.unavailable).toContain('igdb')
    expect(requestsTo(requests, IGDB_HOST)).toHaveLength(2)
    expect(requestsTo(requests, TWITCH_HOST)).toHaveLength(2)
  })

  it.each([
    ['client ID is absent', { TWITCH_CLIENT_SECRET: 'secret' }],
    ['client secret is absent', { TWITCH_CLIENT_ID: 'id' }],
    ['client ID is empty', { TWITCH_CLIENT_ID: '', TWITCH_CLIENT_SECRET: 'secret' }],
    ['client secret is empty', { TWITCH_CLIENT_ID: 'id', TWITCH_CLIENT_SECRET: '' }],
    ['credentials are absent', {}],
  ])('is unavailable, without calling out, when the %s', async (_description, credentials) => {
    const requests = stubIgdbGames([])

    const search = await freshSearcher({ ...BASE_ENV, ...credentials })
    const body = await search('zelda')

    expect(body.unavailable).toContain('igdb')
    expect(requestsTo(requests, TWITCH_HOST)).toHaveLength(0)
    expect(requestsTo(requests, IGDB_HOST)).toHaveLength(0)
  })

  it.each([
    ['an error status', () => new Response('nope', { status: 403 })],
    ['JSON with no token', () => Response.json({ message: 'invalid client' })],
  ])('is unavailable when Twitch returns %s', async (_description, twitchReply) => {
    const requests = stubIgdb(() => Response.json([]), twitchReply)

    const search = await freshSearcher()
    const body = await search('zelda')

    expect(body.unavailable).toContain('igdb')
    expect(requestsTo(requests, IGDB_HOST)).toHaveLength(0)
  })

  it.each([
    ['a server error', () => new Response('down', { status: 500 })],
    ['a body that is not JSON', () => new Response('<html></html>')],
    ['JSON that is not a list', () => Response.json({ games: [] })],
    ['a game with a malformed field', () => Response.json([{ id: 'one', name: 'Game' }])],
  ])('is unavailable, with no token refresh, when IGDB returns %s', async (_description, igdbReply) => {
    const requests = stubIgdb(igdbReply)

    const search = await freshSearcher()
    const body = await search('zelda')

    expect(body.unavailable).toContain('igdb')
    expect(requestsTo(requests, TWITCH_HOST)).toHaveLength(1)
  })
})
