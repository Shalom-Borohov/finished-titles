import { describe, expect, it, vi } from 'vitest'
import type { Env } from '../src/types'
import {
  ALLOWED_ORIGIN_HEADERS,
  APP_ORIGIN,
  BASE_ENV,
  callWorker,
  requestTo,
  stubUpstreams,
  TMDB_ENV,
  TMDB_HOST,
} from './helpers/worker'

const TODAY = '2026-11-12'

function freezeToday() {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(`${TODAY}T12:00:00Z`)
}

function stubTmdb(reply: () => Response) {
  return stubUpstreams({ [TMDB_HOST]: reply })
}

function stubTmdbSeasons(seasons: object[]) {
  return stubTmdb(() => Response.json({ id: 1396, seasons }))
}

function seasonsOf(tvId: string, env: Env = TMDB_ENV) {
  return callWorker(`/seasons?tv=${tvId}`, { headers: ALLOWED_ORIGIN_HEADERS }, env)
}

async function airedSeasonCount(seasons: object[]) {
  freezeToday()
  stubTmdbSeasons(seasons)

  const response = await seasonsOf('1396')
  const body = await response.json<{ seasons: number }>()

  return body.seasons
}

describe('aired seasons', () => {
  it('answers 200 JSON with the season count and the CORS headers', async () => {
    freezeToday()
    stubTmdbSeasons([
      { season_number: 1, air_date: '2008-01-20' },
      { season_number: 2, air_date: '2009-03-08' },
    ])

    const response = await seasonsOf('1396')

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('application/json')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
    expect(await response.json()).toEqual({ seasons: 2 })
  })

  it('asks TMDB for the show by id with the bearer token', async () => {
    const requests = stubTmdbSeasons([])

    await seasonsOf('1396')

    const request = requestTo(requests, TMDB_HOST)

    expect(request.method).toBe('GET')
    expect(request.url.pathname).toBe('/3/tv/1396')
    expect(request.headers.get('Authorization')).toBe('Bearer tmdb-test-token')
  })

  it.each([
    ['skips the specials season', [{ season_number: 0, air_date: '2009-02-17' }], 0],
    ['skips a season that airs after today', [{ season_number: 6, air_date: '2026-11-13' }], 0],
    ['counts a season that airs today', [{ season_number: 1, air_date: TODAY }], 1],
    ['skips a season with a null air date', [{ season_number: 1, air_date: null }], 0],
    ['skips a season with an empty air date', [{ season_number: 1, air_date: '' }], 0],
    ['skips a season with no air date', [{ season_number: 1 }], 0],
    ['skips a season with only a year', [{ season_number: 1, air_date: '2008' }], 0],
  ])('%s', async (_description, seasons, expectedCount) => {
    expect(await airedSeasonCount(seasons)).toBe(expectedCount)
  })

  it('counts only the aired regular seasons of a mixed list', async () => {
    const seasons = [
      { season_number: 0, air_date: '2009-02-17' },
      { season_number: 1, air_date: '2008-01-20' },
      { season_number: 2, air_date: '2009-03-08' },
      { season_number: 3, air_date: null },
      { season_number: 4, air_date: '2027-01-01' },
    ]

    expect(await airedSeasonCount(seasons)).toBe(2)
  })

  it.each([
    ['absent', {}],
    ['null', { seasons: null }],
    ['empty', { seasons: [] }],
  ])('answers 0 when the seasons list is %s', async (_description, details) => {
    stubTmdb(() => Response.json({ id: 1396, ...details }))

    const response = await seasonsOf('1396')

    expect(await response.json()).toEqual({ seasons: 0 })
  })
})

describe('series end year', () => {
  async function seasonFactsOf(details: object) {
    freezeToday()
    stubTmdb(() => Response.json({ id: 1396, seasons: [{ season_number: 1, air_date: '2008-01-20' }], ...details }))

    const response = await seasonsOf('1396')

    return response.json()
  }

  it.each([
    ['Ended', { status: 'Ended', last_air_date: '2013-09-29' }, { seasons: 1, endYear: 2013 }],
    ['Canceled', { status: 'Canceled', last_air_date: '2011-05-04' }, { seasons: 1, endYear: 2011 }],
  ])('answers the year of the last air date when the show is %s', async (_description, details, expected) => {
    expect(await seasonFactsOf(details)).toEqual(expected)
  })

  it.each([
    ['still returning', { status: 'Returning Series', last_air_date: '2026-10-01' }],
    ['in production', { status: 'In Production', last_air_date: '2026-10-01' }],
    ['without a status', { last_air_date: '2013-09-29' }],
    ['with a null status', { status: null, last_air_date: '2013-09-29' }],
    ['ended with a null last air date', { status: 'Ended', last_air_date: null }],
    ['ended without a last air date', { status: 'Ended' }],
    ['ended with an empty last air date', { status: 'Ended', last_air_date: '' }],
    ['ended with a last air date that has no year', { status: 'Ended', last_air_date: 'soon' }],
  ])('leaves the end year out when the show is %s', async (_description, details) => {
    expect(await seasonFactsOf(details)).toEqual({ seasons: 1 })
  })
})

describe('TMDB failures', () => {
  it.each([
    ['an unauthorized status', () => new Response('nope', { status: 401 })],
    ['a not found status', () => new Response('nope', { status: 404 })],
    ['a body that is not JSON', () => new Response('<html></html>')],
    ['JSON of the wrong shape', () => Response.json({ seasons: 'none' })],
    ['a season with a malformed number', () => Response.json({ seasons: [{ season_number: 'one' }] })],
  ])('answers 502 with the CORS headers when TMDB returns %s', async (_description, reply) => {
    stubTmdb(reply)

    const response = await seasonsOf('1396')

    expect(response.status).toBe(502)
    expect(response.body).toBeNull()
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
  })

  it.each([
    ['absent', BASE_ENV],
    ['empty', { ...BASE_ENV, TMDB_TOKEN: '' }],
  ])('answers 502 without calling TMDB when the token is %s', async (_description, env) => {
    const requests = stubTmdbSeasons([])

    const response = await seasonsOf('1396', env)

    expect(response.status).toBe(502)
    expect(requests).toEqual([])
  })
})

describe('tv id validation', () => {
  it.each([
    ['absent', '/seasons'],
    ['empty', '/seasons?tv='],
    ['letters', '/seasons?tv=abc'],
    ['a TMDB source id', '/seasons?tv=tv/1396'],
    ['digits then a letter', '/seasons?tv=12a'],
    ['negative', '/seasons?tv=-1'],
    ['padded with a space', '/seasons?tv=%201396'],
    ['a path escape', '/seasons?tv=..%2F1396'],
  ])('answers 400 with the CORS headers without calling out when tv is %s', async (_description, path) => {
    const requests = stubTmdbSeasons([])

    const response = await callWorker(path, { headers: ALLOWED_ORIGIN_HEADERS }, TMDB_ENV)

    expect(response.status).toBe(400)
    expect(response.body).toBeNull()
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
    expect(requests).toEqual([])
  })
})
