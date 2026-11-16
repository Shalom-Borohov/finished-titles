import { describe, expect, it } from 'vitest'
import { ALL_TYPES } from '../../src/domain/entries'
import type { SearchResult } from '../../src/search/client'
import { orderSearchPage } from '../../src/search/order'

const result = (source: SearchResult['source'], type: SearchResult['type'], title: string): SearchResult => ({
  source,
  sourceId: title,
  title,
  type,
})

const titlesOf = (results: SearchResult[]) => results.map(({ title }) => title)

describe('orderSearchPage', () => {
  it('puts results of the list type first, in the order they came', () => {
    const page = [
      result('tmdb', 'movie', 'Halo: Nightfall'),
      result('igdb', 'game', 'Halo'),
      result('igdb', 'game', 'Halo 2'),
    ]

    expect(titlesOf(orderSearchPage(page, 'game'))).toEqual(['Halo', 'Halo 2', 'Halo: Nightfall'])
  })

  it('mixes the rest by rank: the best of each source, then the second of each', () => {
    const page = [
      result('tmdb', 'movie', 'Dune'),
      result('tmdb', 'movie', 'Dune: Part Two'),
      result('openlibrary', 'book', 'Dune Messiah'),
      result('openlibrary', 'book', 'Children of Dune'),
      result('igdb', 'game', 'Dune: Spice Wars'),
      result('igdb', 'game', 'Dune: Awakening'),
    ]

    expect(titlesOf(orderSearchPage(page, 'series'))).toEqual([
      'Dune',
      'Dune Messiah',
      'Dune: Spice Wars',
      'Dune: Part Two',
      'Children of Dune',
      'Dune: Awakening',
    ])
  })

  it('only mixes when opened from home, with every type', () => {
    const page = [
      result('tmdb', 'movie', 'Dune'),
      result('tmdb', 'series', 'Dune: Prophecy'),
      result('igdb', 'game', 'Dune: Spice Wars'),
    ]

    expect(titlesOf(orderSearchPage(page, ALL_TYPES))).toEqual(['Dune', 'Dune: Spice Wars', 'Dune: Prophecy'])
  })

  it('mixes the sources that answered when one is missing from the page', () => {
    const page = [
      result('tmdb', 'movie', 'Dune'),
      result('tmdb', 'movie', 'Dune: Part Two'),
      result('igdb', 'game', 'Dune: Spice Wars'),
    ]

    expect(titlesOf(orderSearchPage(page, ALL_TYPES))).toEqual(['Dune', 'Dune: Spice Wars', 'Dune: Part Two'])
  })

  it('lets a source with fewer results drop out of the later rounds', () => {
    const page = [
      result('tmdb', 'movie', 'Dune'),
      result('openlibrary', 'book', 'Dune Messiah'),
      result('openlibrary', 'book', 'Children of Dune'),
      result('openlibrary', 'book', 'God Emperor of Dune'),
      result('igdb', 'game', 'Dune: Spice Wars'),
      result('igdb', 'game', 'Dune: Awakening'),
    ]

    expect(titlesOf(orderSearchPage(page, ALL_TYPES))).toEqual([
      'Dune',
      'Dune Messiah',
      'Dune: Spice Wars',
      'Children of Dune',
      'Dune: Awakening',
      'God Emperor of Dune',
    ])
  })

  it('lifts only the exact list type, so anime stays mixed in the series list', () => {
    const page = [
      result('tmdb', 'anime', 'Attack on Titan'),
      result('tmdb', 'series', 'Attack on Titan: Junior High'),
      result('openlibrary', 'book', 'Attack on Titan, Vol. 1'),
    ]

    expect(titlesOf(orderSearchPage(page, 'series'))).toEqual([
      'Attack on Titan: Junior High',
      'Attack on Titan',
      'Attack on Titan, Vol. 1',
    ])
  })

  it('returns nothing for an empty page', () => {
    expect(orderSearchPage([], 'game')).toEqual([])
  })
})
