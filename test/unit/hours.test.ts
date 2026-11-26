import { describe, expect, it } from 'vitest'
import { minutesSpent } from '../../src/domain/hours'
import { entry } from '../helpers/entries'

describe('minutesSpent', () => {
  it('counts a finished movie at its runtime', () => {
    expect(minutesSpent(entry({ type: 'movie', lengthMinutes: [142] }))).toBe(142)
  })

  it('counts a finished show up to the seasons watched', () => {
    expect(minutesSpent(entry({ type: 'series', seasons: 2, lengthMinutes: [500, 600, 700] }))).toBe(1100)
  })

  it('counts every stored season of a finished show with seasons watched left blank', () => {
    expect(minutesSpent(entry({ type: 'anime', lengthMinutes: [300, 280] }))).toBe(580)
  })

  it('counts seasons watched beyond the stored ones at the average stored season', () => {
    expect(minutesSpent(entry({ type: 'series', seasons: 4, lengthMinutes: [500, 700] }))).toBe(2400)
  })

  it('counts a stopped show up to the season before the one it stopped at', () => {
    const stoppedShow = entry({ type: 'anime', status: 'stopped', stoppedSeason: 3, lengthMinutes: [300, 280, 320, 310] })

    expect(minutesSpent(stoppedShow)).toBe(580)
  })

  it('counts nothing for a stopped show with no stopped-at season', () => {
    expect(minutesSpent(entry({ type: 'series', status: 'stopped', lengthMinutes: [500, 600] }))).toBe(0)
  })

  it('counts nothing for a stopped movie', () => {
    expect(minutesSpent(entry({ type: 'movie', status: 'stopped', lengthMinutes: [142] }))).toBe(0)
  })

  it('counts the whole stored length of a TMDB show whose type was changed to movie', () => {
    expect(minutesSpent(entry({ type: 'movie', lengthMinutes: [500, 600] }))).toBe(1100)
  })

  it.each(['book', 'comic', 'other'] as const)('counts nothing for a TMDB title changed to %s', (type) => {
    expect(minutesSpent(entry({ type, lengthMinutes: [500, 600] }))).toBe(0)
  })

  it('counts nothing for a title TMDB had no length for', () => {
    expect(minutesSpent(entry({ type: 'series', seasons: 2, lengthMinutes: [] }))).toBe(0)
  })

  it('counts nothing for a title that did not come from TMDB', () => {
    expect(minutesSpent(entry({ type: 'book' }))).toBe(0)
  })

  it('counts a game at its hours played and ignores any stored length', () => {
    expect(minutesSpent(entry({ type: 'game', status: 'ongoing', hours: 3, lengthMinutes: [500] }))).toBe(180)
  })

  it('counts nothing for a game with no hours played', () => {
    expect(minutesSpent(entry({ type: 'game' }))).toBe(0)
  })
})
