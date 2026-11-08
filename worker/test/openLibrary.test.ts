import { describe, expect, it } from 'vitest'
import { searchBody, stubUpstreams } from './helpers/worker'

const OPEN_LIBRARY_HOST = 'openlibrary.org'

describe('Open Library search', () => {
  it('maps a book to a search result with its year and cover', async () => {
    stubUpstreams({
      [OPEN_LIBRARY_HOST]: () =>
        Response.json({
          docs: [{ key: '/works/OL893415W', title: 'Dune', first_publish_year: 1965, cover_i: 11481354 }],
        }),
    })

    const body = await searchBody('dune')

    expect(body.results).toEqual([
      {
        source: 'openlibrary',
        sourceId: '/works/OL893415W',
        title: 'Dune',
        type: 'book',
        year: 1965,
        posterUrl: 'https://covers.openlibrary.org/b/id/11481354-M.jpg',
      },
    ])
  })

  it('omits the year and poster when the book has neither', async () => {
    stubUpstreams({
      [OPEN_LIBRARY_HOST]: () => Response.json({ docs: [{ key: '/works/OL1W', title: 'Untitled draft' }] }),
    })

    const body = await searchBody('draft')

    expect(body.results).toStrictEqual([
      { source: 'openlibrary', sourceId: '/works/OL1W', title: 'Untitled draft', type: 'book' },
    ])
  })

  it('drops books with a missing, empty or blank title', async () => {
    stubUpstreams({
      [OPEN_LIBRARY_HOST]: () =>
        Response.json({
          docs: [
            { key: '/works/OL1W' },
            { key: '/works/OL2W', title: '' },
            { key: '/works/OL3W', title: '   ' },
            { key: '/works/OL4W', title: null },
            { key: '/works/OL5W', title: 'Kept' },
          ],
        }),
    })

    const body = await searchBody('anything')

    expect(body.results.map((result) => result.sourceId)).toEqual(['/works/OL5W'])
  })

  it('keeps at most 5 books', async () => {
    const docs = [1, 2, 3, 4, 5, 6].map((bookNumber) => ({
      key: `/works/OL${bookNumber}W`,
      title: `Book ${bookNumber}`,
    }))

    stubUpstreams({ [OPEN_LIBRARY_HOST]: () => Response.json({ docs }) })

    const body = await searchBody('book')

    expect(body.results.map((result) => result.title)).toEqual(['Book 1', 'Book 2', 'Book 3', 'Book 4', 'Book 5'])
  })

  it('asks for only the needed fields, identifies itself, and keeps the query as one parameter', async () => {
    const requests = stubUpstreams({ [OPEN_LIBRARY_HOST]: () => Response.json({ docs: [] }) })

    await searchBody('tom & jerry&limit=500')

    const [request] = requests

    expect(request.url.pathname).toBe('/search.json')
    expect(request.url.searchParams.get('q')).toBe('tom & jerry&limit=500')
    expect(request.url.searchParams.get('fields')).toBe('key,title,first_publish_year,cover_i')
    expect(request.url.searchParams.getAll('limit')).toEqual(['5'])
    expect(request.headers.get('User-Agent')).toBe('finished-titles (personal project)')
  })

  it.each([
    ['an error status', () => new Response('down', { status: 503 })],
    ['a body that is not JSON', () => new Response('<html></html>')],
    ['JSON of the wrong shape', () => Response.json({ documents: [] })],
    ['a book with a malformed field', () => Response.json({ docs: [{ key: 42, title: 'Dune' }] })],
  ])('is unavailable when the source returns %s', async (_description, reply) => {
    stubUpstreams({ [OPEN_LIBRARY_HOST]: reply })

    const response = await searchBody('dune')

    expect(response).toEqual({ results: [], unavailable: ['tmdb', 'openlibrary'] })
  })

  it('is unavailable when the network call fails', async () => {
    stubUpstreams({
      [OPEN_LIBRARY_HOST]: () => {
        throw new TypeError('network down')
      },
    })

    const response = await searchBody('dune')

    expect(response.unavailable).toContain('openlibrary')
  })
})
