import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchTitles } from '../../src/search/client'
import {
  DUNE,
  jsonReply,
  SEARCH_URL,
  searchPageReply,
  SEVERANCE,
  stubSearchPages,
  stubSearchResults,
} from '../helpers/searchService'

describe('searchTitles', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('keeps the TMDB genre numbers of a result', async () => {
    stubSearchResults([{ ...DUNE, genreIds: [878, 12] }])

    const { results } = await searchTitles('dune', 1, new AbortController().signal)

    expect(results[0].genreIds).toEqual([878, 12])
  })

  it('accepts a result without genre numbers, from an older search service', async () => {
    stubSearchResults([SEVERANCE])

    const { results } = await searchTitles('severance', 1, new AbortController().signal)

    expect(results[0]).toEqual(SEVERANCE)
  })

  it('asks for the given page of results', async () => {
    const fetchStub = stubSearchResults([DUNE])

    await searchTitles('dune part', 3, new AbortController().signal)

    expect(String(fetchStub.mock.calls[0][0])).toBe(`${SEARCH_URL}/search?q=dune%20part&page=3`)
  })

  it('says whether another page of results exists', async () => {
    stubSearchPages(() => searchPageReply({ results: [DUNE], hasMore: true }))

    const { hasMore } = await searchTitles('dune', 1, new AbortController().signal)

    expect(hasMore).toBe(true)
  })

  it('assumes no more pages when an older search service does not say', async () => {
    stubSearchPages(jsonReply({ results: [DUNE], unavailable: [] }))

    const { hasMore } = await searchTitles('dune', 1, new AbortController().signal)

    expect(hasMore).toBe(false)
  })
})
