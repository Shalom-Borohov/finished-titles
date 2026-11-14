import { describe, expect, it } from 'vitest'
import type { Env } from '../src/types'
import {
  ALLOWED_ORIGIN_HEADERS,
  APP_ORIGIN,
  BASE_ENV,
  callWorker,
  stubUpstreams,
  TMDB_ENV,
  TMDB_HOST,
} from './helpers/worker'
import {
  MOVIE_CREDITS,
  MOVIE_DETAILS,
  MOVIE_PROVIDERS,
  TV_AGGREGATE_CREDITS,
  TV_DETAILS,
  TV_PROVIDERS,
} from './helpers/tmdbDetailsFixtures'

type TmdbReplies = Record<string, object>

const TV_REPLIES: TmdbReplies = {
  '/3/tv/1396': TV_DETAILS,
  '/3/tv/1396/aggregate_credits': TV_AGGREGATE_CREDITS,
  '/3/tv/1396/watch/providers': TV_PROVIDERS,
}

const MOVIE_REPLIES: TmdbReplies = {
  '/3/movie/603': MOVIE_DETAILS,
  '/3/movie/603/credits': MOVIE_CREDITS,
  '/3/movie/603/watch/providers': MOVIE_PROVIDERS,
}

function stubTmdbReplies(replies: TmdbReplies) {
  return stubUpstreams({
    [TMDB_HOST]: ({ url }) =>
      Object.hasOwn(replies, url.pathname) ? Response.json(replies[url.pathname]) : new Response('nope', { status: 404 }),
  })
}

function detailsOf(title: string, env: Env = TMDB_ENV) {
  return callWorker(`/details?title=${title}`, { headers: ALLOWED_ORIGIN_HEADERS }, env)
}

async function detailsBody(title: string, replies: TmdbReplies) {
  stubTmdbReplies(replies)

  const response = await detailsOf(title)

  return response.json()
}

describe('tv details', () => {
  it('answers 200 JSON with every detail of the show and the CORS headers', async () => {
    stubTmdbReplies(TV_REPLIES)

    const response = await detailsOf('tv/1396')

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
    expect(await response.json()).toEqual({
      originalTitle: 'Breaking Bad',
      genres: [
        { id: 18, name: 'Drama' },
        { id: 80, name: 'Crime' },
      ],
      creators: ['Vince Gilligan', 'Peter Gould'],
      cast: ['Bryan Cranston', 'Aaron Paul', 'Anna Gunn'],
      networks: ['AMC', 'Netflix'],
      episodes: 62,
      episodeMinutes: 45,
      nextEpisodeDate: '2026-12-01',
      watchInIsrael: ['Netflix', 'Disney Plus'],
    })
  })
})

describe('movie details', () => {
  it('answers every detail of the movie with its directors once each and no networks', async () => {
    expect(await detailsBody('movie/603', MOVIE_REPLIES)).toEqual({
      originalTitle: 'The Matrix',
      genres: [
        { id: 28, name: 'Action' },
        { id: 878, name: 'Science Fiction' },
      ],
      creators: ['Lana Wachowski', 'Lilly Wachowski'],
      cast: ['Keanu Reeves', 'Laurence Fishburne'],
      networks: [],
      runtimeMinutes: 136,
      watchInIsrael: ['HBO Max'],
    })
  })
})

describe('requests to TMDB', () => {
  it.each([
    ['tv/1396', TV_REPLIES],
    ['movie/603', MOVIE_REPLIES],
  ])('asks TMDB for the details, credits and providers of %s with the bearer token', async (title, replies) => {
    const requests = stubTmdbReplies(replies)

    await detailsOf(title)

    expect(requests.map(({ url }) => url.pathname).toSorted()).toEqual(Object.keys(replies).toSorted())
    expect(requests.map(({ method }) => method)).toEqual(['GET', 'GET', 'GET'])
    expect(requests.map(({ url }) => url.search)).toEqual(['', '', ''])
    expect(requests.map(({ headers }) => headers.get('Authorization'))).toEqual(Array(3).fill('Bearer tmdb-test-token'))
  })
})

describe('detail edges', () => {
  function tvBodyWith(path: string, reply: object) {
    return detailsBody('tv/1396', { ...TV_REPLIES, [path]: reply })
  }

  it.each([
    ['Israel is missing', { id: 1396, results: { US: TV_PROVIDERS.results.US } }],
    ['Israel has no streaming', { id: 1396, results: { IL: { link: 'https://www.themoviedb.org' } } }],
    ['the results are missing', { id: 1396 }],
  ])('answers no Israeli streamers when %s', async (_description, providers) => {
    expect(await tvBodyWith('/3/tv/1396/watch/providers', providers)).toMatchObject({ watchInIsrael: [] })
  })

  it('answers the first five cast members by their billing order', async () => {
    const cast = [
      { name: 'Fay', order: 5 },
      { name: 'Bea', order: 1 },
      { name: 'Gil', order: 6 },
      { name: 'Ada', order: 0 },
      { name: 'Eli', order: 4 },
      { name: 'Cal', order: 2 },
      { name: 'Dov', order: 3 },
    ]

    expect(await tvBodyWith('/3/tv/1396/aggregate_credits', { cast })).toMatchObject({
      cast: ['Ada', 'Bea', 'Cal', 'Dov', 'Eli'],
    })
  })

  it.each([
    ['the episode run times are empty', { episode_run_time: [] }, 'episodeMinutes'],
    ['the next episode is null', { next_episode_to_air: null }, 'nextEpisodeDate'],
    ['the next episode has only a year', { next_episode_to_air: { air_date: '2026' } }, 'nextEpisodeDate'],
    ['the original title is blank', { original_name: '  ' }, 'originalTitle'],
    ['the episode count is zero', { number_of_episodes: 0 }, 'episodes'],
  ])('leaves the detail out when %s', async (_description, override, key) => {
    expect(await tvBodyWith('/3/tv/1396', { ...TV_DETAILS, ...override })).not.toHaveProperty(key)
  })

  it('answers empty lists when TMDB leaves the lists out', async () => {
    const body = await detailsBody('tv/1396', {
      '/3/tv/1396': { id: 1396 },
      '/3/tv/1396/aggregate_credits': { id: 1396 },
      '/3/tv/1396/watch/providers': { id: 1396 },
    })

    expect(body).toEqual({ genres: [], creators: [], cast: [], networks: [], watchInIsrael: [] })
  })
})

describe('title validation', () => {
  it.each([
    ['absent', '/details'],
    ['empty', '/details?title='],
    ['a person', '/details?title=person/1'],
    ['a show with letters', '/details?title=tv/abc'],
    ['a show with a trailing segment', '/details?title=tv/1/x'],
    ['a bare id', '/details?title=1396'],
  ])('answers 400 with the CORS headers without calling out when the title is %s', async (_description, path) => {
    const requests = stubTmdbReplies(TV_REPLIES)

    const response = await callWorker(path, { headers: ALLOWED_ORIGIN_HEADERS }, TMDB_ENV)

    expect(response.status).toBe(400)
    expect(response.body).toBeNull()
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(requests).toEqual([])
  })
})

describe('TMDB failures', () => {
  it.each(Object.keys(TV_REPLIES))('answers 502 with the CORS headers when %s fails', async (failingPath) => {
    stubUpstreams({
      [TMDB_HOST]: ({ url }) =>
        url.pathname === failingPath ? new Response('nope', { status: 500 }) : Response.json(TV_REPLIES[url.pathname]),
    })

    const response = await detailsOf('tv/1396')

    expect(response.status).toBe(502)
    expect(response.body).toBeNull()
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
  })

  it('answers 502 when TMDB returns JSON of the wrong shape', async () => {
    stubTmdbReplies({ ...MOVIE_REPLIES, '/3/movie/603': { genres: 'none' } })

    expect((await detailsOf('movie/603')).status).toBe(502)
  })

  it.each([
    ['absent', BASE_ENV],
    ['empty', { ...BASE_ENV, TMDB_TOKEN: '' }],
  ])('answers 502 without calling TMDB when the token is %s', async (_description, env) => {
    const requests = stubTmdbReplies(TV_REPLIES)

    const response = await detailsOf('tv/1396', env)

    expect(response.status).toBe(502)
    expect(requests).toEqual([])
  })
})
