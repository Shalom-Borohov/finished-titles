import { describe, expect, it } from 'vitest'
import { PAGE_SIZE } from '../src/upstream'
import { OPEN_LIBRARY_HOST, searchBody, stubUpstreams } from './helpers/worker'

function stubOpenLibraryDocs(docs: object[], numFound = docs.length) {
  return stubUpstreams({ [OPEN_LIBRARY_HOST]: () => Response.json({ docs, numFound }) })
}

describe('Open Library search', () => {
  it('maps a book to a search result with its year and cover', async () => {
    stubOpenLibraryDocs([{ key: '/works/OL893415W', title: 'Dune', first_publish_year: 1965, cover_i: 11481354 }])

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
    stubOpenLibraryDocs([{ key: '/works/OL1W', title: 'Untitled draft' }])

    const body = await searchBody('draft')

    expect(body.results).toStrictEqual([
      { source: 'openlibrary', sourceId: '/works/OL1W', title: 'Untitled draft', type: 'book' },
    ])
  })

  it('drops books with a missing, empty or blank title', async () => {
    stubOpenLibraryDocs([
      { key: '/works/OL1W' },
      { key: '/works/OL2W', title: '' },
      { key: '/works/OL3W', title: '   ' },
      { key: '/works/OL4W', title: null },
      { key: '/works/OL5W', title: 'Kept' },
    ])

    const body = await searchBody('anything')

    expect(body.results.map((result) => result.sourceId)).toEqual(['/works/OL5W'])
  })

  it('keeps every book on the page', async () => {
    const docs = [1, 2, 3, 4, 5, 6].map((bookNumber) => ({
      key: `/works/OL${bookNumber}W`,
      title: `Book ${bookNumber}`,
    }))

    stubOpenLibraryDocs(docs)

    const body = await searchBody('book')

    expect(body.results.map((result) => result.title)).toEqual([
      'Book 1',
      'Book 2',
      'Book 3',
      'Book 4',
      'Book 5',
      'Book 6',
    ])
  })

  it('asks for only the needed fields, identifies itself, and keeps the query as one parameter', async () => {
    const requests = stubOpenLibraryDocs([])

    await searchBody('tom & jerry&limit=500')

    const [request] = requests

    expect(request.url.pathname).toBe('/search.json')
    expect(request.url.searchParams.get('q')).toBe('tom & jerry&limit=500')
    expect(request.url.searchParams.get('fields')).toBe('key,title,first_publish_year,cover_i')
    expect(request.url.searchParams.getAll('limit')).toEqual([String(PAGE_SIZE)])
    expect(request.url.searchParams.getAll('page')).toEqual(['1'])
    expect(request.headers.get('User-Agent')).toBe('finished-titles (personal project)')
  })

  it('asks for the requested page, one page size of books', async () => {
    const requests = stubOpenLibraryDocs([])

    await searchBody('dune', { page: 3 })

    const [request] = requests

    expect(request.url.searchParams.get('page')).toBe('3')
    expect(request.url.searchParams.get('limit')).toBe(String(PAGE_SIZE))
  })

  it.each([
    ['more books remain after the first page', 1, PAGE_SIZE + 1, true],
    ['the first page holds every book', 1, PAGE_SIZE, false],
    ['more books remain after a later page', 2, 2 * PAGE_SIZE + 1, true],
    ['a later page is the last', 2, 2 * PAGE_SIZE, false],
    ['nothing was found', 1, 0, false],
  ])('says whether Open Library has another page when %s', async (_description, page, numFound, hasMore) => {
    stubOpenLibraryDocs([{ key: '/works/OL1W', title: 'Dune' }], numFound)

    const body = await searchBody('dune', { page })

    expect(body.hasMore).toBe(hasMore)
  })

  it.each([
    ['an error status', () => new Response('down', { status: 503 })],
    ['a body that is not JSON', () => new Response('<html></html>')],
    ['JSON of the wrong shape', () => Response.json({ documents: [], numFound: 0 })],
    ['JSON with no result count', () => Response.json({ docs: [] })],
    ['a book with a malformed field', () => Response.json({ docs: [{ key: 42, title: 'Dune' }], numFound: 1 })],
  ])('is unavailable when the source returns %s', async (_description, reply) => {
    stubUpstreams({ [OPEN_LIBRARY_HOST]: reply })

    const response = await searchBody('dune')

    expect(response).toEqual({ results: [], unavailable: ['tmdb', 'openlibrary', 'igdb'], hasMore: false })
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
