import { describe, expect, it } from 'vitest'
import type { Env } from '../src/types'
import {
  ALLOWED_ORIGIN_HEADERS,
  APP_ORIGIN,
  BASE_ENV,
  callWorker,
  freezeToday,
  requestTo,
  stubUpstreams,
  TMDB_ENV,
  TMDB_HOST,
  TODAY,
} from './helpers/worker'

function stubTmdb(reply: () => Response) {
  return stubUpstreams({ [TMDB_HOST]: reply })
}

function stubTmdbEpisodes(episodes: object[]) {
  return stubTmdb(() => Response.json({ id: 3572, season_number: 2, episodes }))
}

function lengthOf(query: string, env: Env = TMDB_ENV) {
  return callWorker(`/length?${query}`, { headers: ALLOWED_ORIGIN_HEADERS }, env)
}

describe('movie length', () => {
  it('answers 200 JSON with the runtime in minutes and the CORS headers', async () => {
    stubTmdb(() => Response.json({ id: 603, runtime: 136 }))

    const response = await lengthOf('title=movie/603')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
    expect(await response.json()).toEqual({ minutes: 136 })
  })

  it('asks TMDB for the movie by id with the bearer token', async () => {
    const requests = stubTmdb(() => Response.json({ id: 603, runtime: 136 }))

    await lengthOf('title=movie/603')

    const request = requestTo(requests, TMDB_HOST)

    expect(requests).toHaveLength(1)
    expect(request.method).toBe('GET')
    expect(request.url.pathname).toBe('/3/movie/603')
    expect(request.url.search).toBe('')
    expect(request.headers.get('Authorization')).toBe('Bearer tmdb-test-token')
  })

  it.each([
    ['zero', { runtime: 0 }],
    ['null', { runtime: null }],
    ['absent', {}],
    ['a fraction', { runtime: 136.5 }],
    ['negative', { runtime: -136 }],
  ])('answers no minutes when the runtime is %s', async (_description, movie) => {
    stubTmdb(() => Response.json({ id: 603, ...movie }))

    const response = await lengthOf('title=movie/603')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({})
  })
})

describe('season length', () => {
  it('answers 200 JSON with the summed runtimes of the episodes aired by today and the CORS headers', async () => {
    freezeToday()
    stubTmdbEpisodes([
      { air_date: '2009-03-08', runtime: 47 },
      { air_date: '2009-03-15', runtime: 46 },
      { air_date: TODAY, runtime: 48 },
      { air_date: '2026-11-13', runtime: 50 },
      { runtime: 45 },
      { air_date: null, runtime: 45 },
      { air_date: '2024', runtime: 44 },
      { air_date: '2009-03-22', runtime: null },
      { air_date: '2009-03-29', runtime: 0 },
      { air_date: '2009-04-05' },
    ])

    const response = await lengthOf('title=tv/1396&season=2')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
    expect(await response.json()).toEqual({ minutes: 141 })
  })

  it('asks TMDB for the season of the show with the bearer token', async () => {
    const requests = stubTmdbEpisodes([])

    await lengthOf('title=tv/1396&season=2')

    const request = requestTo(requests, TMDB_HOST)

    expect(requests).toHaveLength(1)
    expect(request.method).toBe('GET')
    expect(request.url.pathname).toBe('/3/tv/1396/season/2')
    expect(request.url.search).toBe('')
    expect(request.headers.get('Authorization')).toBe('Bearer tmdb-test-token')
  })

  it.each([
    ['airs only after today', { episodes: [{ air_date: '2026-11-13', runtime: 50 }] }],
    ['has an empty episode list', { episodes: [] }],
    ['has a null episode list', { episodes: null }],
    ['has no episode list', {}],
  ])('answers 0 minutes when the season %s', async (_description, season) => {
    freezeToday()
    stubTmdb(() => Response.json({ id: 3572, season_number: 2, ...season }))

    const response = await lengthOf('title=tv/1396&season=2')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ minutes: 0 })
  })
})

describe('length request validation', () => {
  it.each([
    ['the title is absent', ''],
    ['the title is empty', 'title='],
    ['the title is a person', 'title=person/1'],
    ['the title is a bare id', 'title=1396&season=2'],
    ['the show id has letters', 'title=tv/abc&season=2'],
    ['the show id is missing', 'title=tv/&season=2'],
    ['the title has a trailing segment', 'title=tv/1396/x&season=2'],
    ['the title is padded with a space', 'title=%20tv/1396&season=2'],
    ['a show has no season', 'title=tv/1396'],
    ['a show has an empty season', 'title=tv/1396&season='],
    ['a show has season 0', 'title=tv/1396&season=0'],
    ['a show has a negative season', 'title=tv/1396&season=-1'],
    ['a show has a season with letters', 'title=tv/1396&season=2a'],
    ['a show has a fractional season', 'title=tv/1396&season=1.5'],
    ['a show has a season above 1000', 'title=tv/1396&season=1001'],
    ['a show has a season too large to be a number', `title=tv/1396&season=${'9'.repeat(400)}`],
    ['a movie has a season', 'title=movie/603&season=1'],
    ['a movie has an empty season', 'title=movie/603&season='],
  ])('answers 400 with the CORS headers without calling out when %s', async (_description, query) => {
    const requests = stubTmdbEpisodes([])

    const response = await lengthOf(query)

    expect(response.status).toBe(400)
    expect(response.body).toBeNull()
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
    expect(requests).toEqual([])
  })
})

describe('TMDB failures', () => {
  it.each([
    ['a movie', 'a server error', 'title=movie/603', () => new Response('nope', { status: 500 })],
    ['a movie', 'a not found status', 'title=movie/603', () => new Response('nope', { status: 404 })],
    ['a movie', 'a runtime of the wrong shape', 'title=movie/603', () => Response.json({ runtime: 'long' })],
    ['a season', 'a server error', 'title=tv/1396&season=2', () => new Response('nope', { status: 500 })],
    ['a season', 'a not found status', 'title=tv/1396&season=99', () => new Response('nope', { status: 404 })],
    ['a season', 'a body that is not JSON', 'title=tv/1396&season=2', () => new Response('<html></html>')],
    ['a season', 'an episode list of the wrong shape', 'title=tv/1396&season=2', () => Response.json({ episodes: 'none' })],
    [
      'a season',
      'an episode runtime of the wrong shape',
      'title=tv/1396&season=2',
      () => Response.json({ episodes: [{ air_date: '2009-03-08', runtime: '47' }] }),
    ],
  ])('answers 502 with the CORS headers when TMDB answers %s with %s', async (_title, _failure, query, reply) => {
    stubTmdb(reply)

    const response = await lengthOf(query)

    expect(response.status).toBe(502)
    expect(response.body).toBeNull()
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
  })

  it.each([
    ['a movie', 'absent', 'title=movie/603', BASE_ENV],
    ['a movie', 'empty', 'title=movie/603', { ...BASE_ENV, TMDB_TOKEN: '' }],
    ['a season', 'absent', 'title=tv/1396&season=2', BASE_ENV],
    ['a season', 'empty', 'title=tv/1396&season=2', { ...BASE_ENV, TMDB_TOKEN: '' }],
  ])('answers 502 for %s without calling TMDB when the token is %s', async (_title, _token, query, env) => {
    const requests = stubTmdbEpisodes([])

    const response = await lengthOf(query, env)

    expect(response.status).toBe(502)
    expect(requests).toEqual([])
  })
})
