import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchTitles } from '../../src/search/client'
import { DUNE, SEVERANCE, stubSearchResults } from '../helpers/searchService'

describe('searchTitles', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('keeps the TMDB genre numbers of a result', async () => {
    stubSearchResults([{ ...DUNE, genreIds: [878, 12] }])

    const { results } = await searchTitles('dune', new AbortController().signal)

    expect(results[0].genreIds).toEqual([878, 12])
  })

  it('accepts a result without genre numbers, from an older search service', async () => {
    stubSearchResults([SEVERANCE])

    const { results } = await searchTitles('severance', new AbortController().signal)

    expect(results[0]).toEqual(SEVERANCE)
  })
})
