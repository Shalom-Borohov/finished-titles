import { describe, expect, it } from 'vitest'
import { earliestFinishYear, knownSeasonCount } from '../../src/domain/fieldLimits'
import type { MediaType, Status } from '../../src/domain/types'

type YearsCase = { type: MediaType; status: Status; releaseYear?: number; endYear?: number; seasons?: number }

const THIS_YEAR = 2026

describe('earliestFinishYear', () => {
  it.each<[string, YearsCase, ReturnType<typeof earliestFinishYear>]>([
    ['a movie from its release year', { type: 'movie', status: 'finished', releaseYear: 2021 }, { year: 2021, reason: 'release' }],
    ['a stopped book from its release year', { type: 'book', status: 'stopped', releaseYear: 1965 }, { year: 1965, reason: 'release' }],
    [
      'a finished series from the year it ended',
      { type: 'series', status: 'finished', releaseYear: 2008, endYear: 2013 },
      { year: 2013, reason: 'end' },
    ],
    [
      'a finished anime from the year it ended, with no release year',
      { type: 'anime', status: 'finished', endYear: 2024 },
      { year: 2024, reason: 'end' },
    ],
    [
      'a stopped series from its release year, not its end',
      { type: 'series', status: 'stopped', releaseYear: 2008, endYear: 2013 },
      { year: 2008, reason: 'release' },
    ],
    [
      'a movie that kept an end year from a type switch, from its release year',
      { type: 'movie', status: 'finished', releaseYear: 2008, endYear: 2013 },
      { year: 2008, reason: 'release' },
    ],
    ['a title with no years, from no year', { type: 'series', status: 'finished' }, undefined],
    ['a movie released after this year, from no year', { type: 'movie', status: 'finished', releaseYear: 2027 }, undefined],
  ])('limits %s', (_case, years, limit) => {
    expect(earliestFinishYear(years, { thisYear: THIS_YEAR })).toEqual(limit)
  })

  const ranUntil2020 = { type: 'series', status: 'finished', releaseYear: 2016, endYear: 2020 } as const

  it.each<[string, number | undefined, number | undefined, ReturnType<typeof earliestFinishYear>]>([
    ['every aired season was watched', 5, 5, { year: 2020, reason: 'end' }],
    ['seasons watched is empty', undefined, 5, { year: 2020, reason: 'end' }],
    ['fewer seasons than aired were watched', 3, 5, { year: 2016, reason: 'release' }],
    ['seasons were watched but the count is unknown', 3, undefined, { year: 2016, reason: 'release' }],
  ])('limits a finished show by its end only when %s', (_case, seasons, lastSeason, limit) => {
    expect(earliestFinishYear({ ...ranUntil2020, seasons }, { thisYear: THIS_YEAR, lastSeason })).toEqual(limit)
  })
})

describe('knownSeasonCount', () => {
  it('is the aired count from a new pick, even for a show still airing', () => {
    expect(knownSeasonCount({}, 3)).toBe(3)
  })

  it('is the number of saved season lengths for a show that has ended', () => {
    expect(knownSeasonCount({ endYear: 2013, lengthMinutes: [400, 420] })).toBe(2)
  })

  it.each<[string, Parameters<typeof knownSeasonCount>[0]]>([
    ['a show still airing, whose saved lengths go out of date', { lengthMinutes: [400, 420] }],
    ['an ended show with no saved lengths', { endYear: 2013 }],
    ['an ended show whose lengths came back empty', { endYear: 2013, lengthMinutes: [] }],
  ])('is unknown for %s', (_case, title) => {
    expect(knownSeasonCount(title)).toBeUndefined()
  })
})
