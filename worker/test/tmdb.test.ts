import { describe, expect, it } from 'vitest'
import { BASE_ENV, requestTo, searchBody, stubUpstreams } from './helpers/worker'

const TMDB_HOST = 'api.themoviedb.org'
const OPEN_LIBRARY_HOST = 'openlibrary.org'
const TMDB_ENV = { ...BASE_ENV, TMDB_TOKEN: 'tmdb-test-token' }
const ANIMATION_GENRE = 16
const DRAMA_GENRE = 18

function stubTmdb(reply: () => Response) {
  return stubUpstreams({
    [TMDB_HOST]: reply,
    [OPEN_LIBRARY_HOST]: () => Response.json({ docs: [] }),
  })
}

function stubTmdbResults(results: object[]) {
  return stubTmdb(() => Response.json({ results }))
}

describe('TMDB search', () => {
  it('maps a movie using its title, release date and poster', async () => {
    stubTmdbResults([
      {
        id: 603,
        media_type: 'movie',
        title: 'The Matrix',
        release_date: '1999-03-31',
        poster_path: '/matrix.jpg',
      },
    ])

    const body = await searchBody('matrix', TMDB_ENV)

    expect(body.results).toStrictEqual([
      {
        source: 'tmdb',
        sourceId: 'movie/603',
        title: 'The Matrix',
        type: 'movie',
        year: 1999,
        posterUrl: 'https://image.tmdb.org/t/p/w342/matrix.jpg',
      },
    ])
  })

  it('maps a series using its name and first air date', async () => {
    stubTmdbResults([
      {
        id: 1396,
        media_type: 'tv',
        name: 'Breaking Bad',
        first_air_date: '2008-01-20',
        poster_path: '/bb.jpg',
        genre_ids: [DRAMA_GENRE],
        origin_country: ['US'],
      },
    ])

    const body = await searchBody('breaking', TMDB_ENV)

    expect(body.results).toStrictEqual([
      {
        source: 'tmdb',
        sourceId: 'tv/1396',
        title: 'Breaking Bad',
        type: 'series',
        year: 2008,
        posterUrl: 'https://image.tmdb.org/t/p/w342/bb.jpg',
      },
    ])
  })

  it('gives a movie and a series with the same TMDB id different source ids', async () => {
    stubTmdbResults([
      { id: 1396, media_type: 'movie', title: 'Mirror' },
      { id: 1396, media_type: 'tv', name: 'Breaking Bad' },
    ])

    const body = await searchBody('anything', TMDB_ENV)
    const [movie, series] = body.results

    expect(movie.sourceId).not.toBe(series.sourceId)
  })

  it.each([
    ['Japanese TV animation', 'tv', [ANIMATION_GENRE, DRAMA_GENRE], ['JP'], 'anime'],
    ['animation co-produced with Japan', 'tv', [ANIMATION_GENRE], ['US', 'JP'], 'anime'],
    ['American TV animation', 'tv', [ANIMATION_GENRE], ['US'], 'series'],
    ['Japanese live action', 'tv', [DRAMA_GENRE], ['JP'], 'series'],
    ['a Japanese animated movie', 'movie', [ANIMATION_GENRE], ['JP'], 'movie'],
  ])('types %s correctly', async (_description, mediaType, genreIds, originCountry, expectedType) => {
    stubTmdbResults([
      { id: 1, media_type: mediaType, name: 'Show', title: 'Show', genre_ids: genreIds, origin_country: originCountry },
    ])

    const body = await searchBody('show', TMDB_ENV)

    expect(body.results[0].type).toBe(expectedType)
  })

  it('treats TV with no genre or country data as a series', async () => {
    stubTmdbResults([{ id: 1, media_type: 'tv', name: 'Show' }])

    const body = await searchBody('show', TMDB_ENV)

    expect(body.results[0].type).toBe('series')
  })

  it('keeps only movies and TV, which drops people', async () => {
    stubTmdbResults([
      { id: 1, media_type: 'person', name: 'Keanu Reeves' },
      { id: 2, media_type: 'movie', title: 'John Wick' },
    ])

    const body = await searchBody('keanu', TMDB_ENV)

    expect(body.results.map((result) => result.title)).toEqual(['John Wick'])
  })

  it.each([
    ['null poster and empty date', { poster_path: null, release_date: '' }],
    ['absent poster and date', {}],
    ['null date', { release_date: null }],
  ])('omits the year and poster with %s', async (_description, fields) => {
    stubTmdbResults([{ id: 7, media_type: 'movie', title: 'Obscure', ...fields }])

    const body = await searchBody('obscure', TMDB_ENV)

    expect(body.results).toStrictEqual([{ source: 'tmdb', sourceId: 'movie/7', title: 'Obscure', type: 'movie' }])
  })

  it('drops titles that are missing or blank', async () => {
    stubTmdbResults([
      { id: 1, media_type: 'movie' },
      { id: 2, media_type: 'tv', name: '' },
      { id: 3, media_type: 'movie', title: '  ' },
      { id: 4, media_type: 'movie', title: 'Kept' },
    ])

    const body = await searchBody('anything', TMDB_ENV)

    expect(body.results.map((result) => result.sourceId)).toEqual(['movie/4'])
  })

  it('keeps at most 8, counted after filtering', async () => {
    const people = [{ id: 100, media_type: 'person', name: 'Someone' }]

    const movies = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((id) => ({
      id,
      media_type: 'movie',
      title: `Movie ${id}`,
    }))

    stubTmdbResults([...people, ...movies])

    const body = await searchBody('movie', TMDB_ENV)

    expect(body.results.map((result) => result.title)).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((id) => `Movie ${id}`))
  })

  it('sends the agreed request with the bearer token and keeps the query as one parameter', async () => {
    const requests = stubTmdbResults([])

    await searchBody('tom & jerry&include_adult=true', TMDB_ENV)

    const request = requestTo(requests, TMDB_HOST)

    expect(request.url.pathname).toBe('/3/search/multi')
    expect(Object.fromEntries(request.url.searchParams)).toEqual({
      query: 'tom & jerry&include_adult=true',
      include_adult: 'false',
      language: 'en-US',
      page: '1',
    })
    expect(request.headers.get('Authorization')).toBe('Bearer tmdb-test-token')
  })

  it.each([
    ['absent', BASE_ENV],
    ['empty', { ...BASE_ENV, TMDB_TOKEN: '' }],
  ])('is unavailable without calling TMDB when the token is %s', async (_description, env) => {
    const requests = stubTmdbResults([])

    const body = await searchBody('matrix', env)

    expect(body.unavailable).toContain('tmdb')
    expect(requests.map(({ url }) => url.hostname)).not.toContain(TMDB_HOST)
  })

  it.each([
    ['an error status', () => new Response('nope', { status: 401 })],
    ['a body that is not JSON', () => new Response('<html></html>')],
    ['JSON of the wrong shape', () => Response.json({ results: 'none' })],
    ['a result with a malformed field', () => Response.json({ results: [{ id: 'one', media_type: 'movie' }] })],
  ])('is unavailable when TMDB returns %s', async (_description, reply) => {
    stubTmdb(reply)

    const body = await searchBody('matrix', TMDB_ENV)

    expect(body.results).toEqual([])
    expect(body.unavailable).toContain('tmdb')
    expect(body.unavailable).not.toContain('openlibrary')
  })
})
