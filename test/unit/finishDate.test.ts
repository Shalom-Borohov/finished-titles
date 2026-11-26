import { afterEach, describe, expect, it, vi } from 'vitest'
import { finishYear, isFinishDate, isFutureFinishDate, msUntilTomorrow, toIsoDate } from '../../src/domain/finishDate'

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

describe('msUntilTomorrow', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('waits until a second past the next local midnight', () => {
    expect(msUntilTomorrow(new Date(2026, 10, 25, 23, 59, 30))).toBe(31_000)
  })

  it('lands a second past local midnight on a day the clocks change', () => {
    vi.stubEnv('TZ', 'Asia/Jerusalem')
    const now = new Date(2026, 9, 25, 0, 0, 0)
    const wake = new Date(now.getTime() + msUntilTomorrow(now))

    expect([wake.getDate(), wake.getHours(), wake.getMinutes(), wake.getSeconds()]).toEqual([26, 0, 0, 1])
  })
})
