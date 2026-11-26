import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchLength, searchTitles } from '../../src/search/client'
import {
  DUNE,
  jsonReply,
  lengthCalls,
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

describe('fetchLength', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('asks for the length of a movie', async () => {
    const fetchStub = stubSearchResults([], { lengthReply: jsonReply({ minutes: 155 }) })

    expect(await fetchLength(DUNE.sourceId, undefined, new AbortController().signal)).toEqual({ minutes: 155 })
    expect(lengthCalls(fetchStub)).toEqual([`${SEARCH_URL}/length?title=movie%2F438631`])
  })

  it('asks for the length of one season of a show, which may be zero', async () => {
    const fetchStub = stubSearchResults([], { lengthReply: jsonReply({ minutes: 0 }) })

    expect(await fetchLength(SEVERANCE.sourceId, 2, new AbortController().signal)).toEqual({ minutes: 0 })
    expect(lengthCalls(fetchStub)).toEqual([`${SEARCH_URL}/length?title=tv%2F95396&season=2`])
  })

  it('accepts a reply without minutes, when TMDB has no length', async () => {
    stubSearchResults([], { lengthReply: jsonReply({}) })

    expect(await fetchLength(DUNE.sourceId, undefined, new AbortController().signal)).toEqual({})
  })

  it.each([
    ['negative minutes', { minutes: -1 }],
    ['part of a minute', { minutes: 90.5 }],
    ['minutes written as text', { minutes: '90' }],
  ])('rejects %s', async (_name, reply) => {
    stubSearchResults([], { lengthReply: jsonReply(reply) })

    await expect(fetchLength(DUNE.sourceId, undefined, new AbortController().signal)).rejects.toThrow()
  })

  it('rejects a failed lookup', async () => {
    stubSearchResults([])

    await expect(fetchLength(DUNE.sourceId, undefined, new AbortController().signal)).rejects.toThrow()
  })
})
