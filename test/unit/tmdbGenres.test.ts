import { describe, expect, it } from 'vitest'
import { genresFromTmdb } from '../../src/search/tmdbGenres'

describe('genresFromTmdb', () => {
  it('maps plain TMDB genres to the app genres', () => {
    expect(genresFromTmdb([18])).toEqual(['drama'])
    expect(genresFromTmdb([878])).toEqual(['scifi'])
    expect(genresFromTmdb([10402])).toEqual(['music'])
  })

  it.each([
    [10759, ['action', 'adventure']],
    [10765, ['scifi', 'fantasy']],
    [10768, ['war', 'politics']],
  ])('splits the combined TV genre %i', (genreId, genres) => {
    expect(genresFromTmdb([genreId])).toEqual(genres)
  })

  it('maps the TV kids and reality genres', () => {
    expect(genresFromTmdb([10762, 10764])).toEqual(['kids', 'reality'])
  })

  it('lists each genre once', () => {
    expect(genresFromTmdb([10759, 28])).toEqual(['action', 'adventure'])
  })

  it('drops TV Movie, News, Soap, Talk and unknown genres', () => {
    expect(genresFromTmdb([10770, 10763, 10766, 10767, 999999])).toEqual([])
  })

  it('keeps the app genre order, whatever order TMDB gives', () => {
    expect(genresFromTmdb([99, 35, 27, 18])).toEqual(['horror', 'drama', 'comedy', 'documentary'])
  })

  it('gives nothing for no genres', () => {
    expect(genresFromTmdb([])).toEqual([])
  })
})
