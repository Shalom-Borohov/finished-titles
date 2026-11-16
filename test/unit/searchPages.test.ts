import { describe, expect, it } from 'vitest'
import { ALL_TYPES } from '../../src/domain/entries'
import type { SearchResponse, SearchResult } from '../../src/search/client'
import { appendPage, NO_PAGES } from '../../src/search/pages'

const result = (source: SearchResult['source'], type: SearchResult['type'], title: string): SearchResult => ({
  source,
  sourceId: title,
  title,
  type,
})

const response = (results: SearchResult[], unavailable: string[] = [], hasMore = false): SearchResponse => ({
  results,
  unavailable,
  hasMore,
})

const titlesOf = ({ results }: SearchResponse) => results.map(({ title }) => title)

const DUNE = result('tmdb', 'movie', 'Dune')

const DUNE_PART_TWO = result('tmdb', 'movie', 'Dune: Part Two')

const DUNE_MESSIAH = result('openlibrary', 'book', 'Dune Messiah')

const SPICE_WARS = result('igdb', 'game', 'Dune: Spice Wars')

describe('appendPage', () => {
  it('adds the new page below the pages already shown', () => {
    const firstPage = appendPage(NO_PAGES, response([DUNE], [], true), 1, ALL_TYPES)
    const secondPage = appendPage(firstPage, response([DUNE_PART_TWO]), 2, ALL_TYPES)

    expect(titlesOf(secondPage)).toEqual(['Dune', 'Dune: Part Two'])
    expect(secondPage).toMatchObject({ page: 2, hasMore: false, more: 'idle' })
  })

  it('leaves out a result an earlier page already showed', () => {
    const firstPage = appendPage(NO_PAGES, response([DUNE]), 1, ALL_TYPES)
    const secondPage = appendPage(firstPage, response([DUNE, DUNE_PART_TWO]), 2, ALL_TYPES)

    expect(titlesOf(secondPage)).toEqual(['Dune', 'Dune: Part Two'])
  })

  it('marks a later page failed when a source that answered before is missing, keeping its results to retry that page', () => {
    const firstPage = appendPage(NO_PAGES, response([DUNE], [], true), 1, ALL_TYPES)
    const secondPage = appendPage(firstPage, response([DUNE_MESSIAH], ['tmdb']), 2, ALL_TYPES)

    expect(titlesOf(secondPage)).toEqual(['Dune', 'Dune Messiah'])
    expect(secondPage).toMatchObject({ page: 1, hasMore: true, more: 'failed', unavailable: ['tmdb'] })
  })

  it('keeps paging when a source missing since the first page is still missing', () => {
    const firstPage = appendPage(NO_PAGES, response([DUNE], ['igdb'], true), 1, ALL_TYPES)
    const secondPage = appendPage(firstPage, response([DUNE_PART_TWO], ['igdb']), 2, ALL_TYPES)

    expect(secondPage).toMatchObject({ page: 2, hasMore: false, more: 'idle' })
  })

  it('marks a page failed when a source that came back drops out again', () => {
    const firstPage = appendPage(NO_PAGES, response([DUNE], [], true), 1, ALL_TYPES)
    const lostTmdb = appendPage(firstPage, response([DUNE_MESSIAH], ['tmdb'], true), 2, ALL_TYPES)
    const tmdbBack = appendPage(lostTmdb, response([DUNE_PART_TWO], [], true), 2, ALL_TYPES)
    const lostTmdbAgain = appendPage(tmdbBack, response([SPICE_WARS], ['tmdb']), 3, ALL_TYPES)

    expect(lostTmdbAgain).toMatchObject({ page: 2, hasMore: true, more: 'failed' })
  })

  it('keeps paging when a retried page still lacks the missing source', () => {
    const firstPage = appendPage(NO_PAGES, response([DUNE], [], true), 1, ALL_TYPES)
    const lostTmdb = appendPage(firstPage, response([DUNE_MESSIAH], ['tmdb'], true), 2, ALL_TYPES)
    const retried = appendPage(lostTmdb, response([DUNE_MESSIAH], ['tmdb'], true), 2, ALL_TYPES)

    expect(retried).toMatchObject({ page: 2, hasMore: true, more: 'idle' })
  })

  it('leaves out a result repeated within one page', () => {
    expect(titlesOf(appendPage(NO_PAGES, response([DUNE, DUNE]), 1, ALL_TYPES))).toEqual(['Dune'])
  })

  it('merges the missing sources of every page, without repeats', () => {
    const firstPage = appendPage(NO_PAGES, response([DUNE], ['igdb']), 1, ALL_TYPES)
    const secondPage = appendPage(firstPage, response([DUNE_PART_TWO], ['igdb', 'openlibrary']), 2, ALL_TYPES)

    expect(secondPage.unavailable).toEqual(['igdb', 'openlibrary'])
  })

  it('orders each new page on its own, keeping the earlier pages where they were', () => {
    const firstPage = appendPage(NO_PAGES, response([DUNE]), 1, 'game')
    const secondPage = appendPage(firstPage, response([DUNE_PART_TWO, DUNE_MESSIAH, SPICE_WARS]), 2, 'game')

    expect(titlesOf(secondPage)).toEqual(['Dune', 'Dune: Spice Wars', 'Dune: Part Two', 'Dune Messiah'])
  })
})
