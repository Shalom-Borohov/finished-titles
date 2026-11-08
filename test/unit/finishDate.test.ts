import { describe, expect, it } from 'vitest'
import { finishYear, isFinishDate, isFutureFinishDate, toIsoDate } from '../../src/domain/finishDate'

describe('isFinishDate', () => {
  it.each(['2026', '2026-11-07', '1999-01-31'])('accepts %s', (text) => {
    expect(isFinishDate(text)).toBe(true)
  })

  it.each(['', '26', '2026-13-01', '2026-02-30', '2026-11', 'soon'])('rejects %s', (text) => {
    expect(isFinishDate(text)).toBe(false)
  })
})

describe('finishYear', () => {
  it('reads the year of a date or a year-only value', () => {
    expect(finishYear('2024-03-10')).toBe(2024)
    expect(finishYear('2024')).toBe(2024)
  })
})

describe('isFutureFinishDate', () => {
  const today = '2026-11-07'

  it.each(['2026-11-08', '2027', '2027-01-01'])('treats %s as future', (finishedOn) => {
    expect(isFutureFinishDate(finishedOn, today)).toBe(true)
  })

  it.each(['2026-11-07', '2026', '2020-05-05'])('treats %s as allowed', (finishedOn) => {
    expect(isFutureFinishDate(finishedOn, today)).toBe(false)
  })
})

describe('toIsoDate', () => {
  it('uses the local calendar date', () => {
    expect(toIsoDate(new Date(2026, 10, 7, 23, 30))).toBe('2026-11-07')
  })
})
