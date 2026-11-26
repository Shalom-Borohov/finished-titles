import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useToday } from '../../src/pages/entry/useToday'
import { setVisibility } from '../helpers/visibility'

const HALF_MINUTE_BEFORE_MIDNIGHT = new Date(2026, 10, 25, 23, 59, 30).getTime()

const ONE_MINUTE = 60_000

const ONE_DAY = 24 * 60 * ONE_MINUTE

describe('useToday', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] })
    vi.setSystemTime(HALF_MINUTE_BEFORE_MIDNIGHT)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('moves to the new day at midnight, and again the next midnight', () => {
    const { result } = renderHook(() => useToday())

    expect(result.current).toBe('2026-11-25')

    act(() => vi.advanceTimersByTime(ONE_MINUTE))

    expect(result.current).toBe('2026-11-26')

    act(() => vi.advanceTimersByTime(ONE_DAY))

    expect(result.current).toBe('2026-11-27')
  })

  it('still moves to the new day when the clock was set back while waiting for midnight', () => {
    const { result } = renderHook(() => useToday())

    act(() => vi.advanceTimersByTime(10_000))
    vi.setSystemTime(new Date(2026, 10, 25, 23, 59, 35))
    act(() => vi.advanceTimersByTime(21_000))

    expect(result.current).toBe('2026-11-25')

    act(() => vi.advanceTimersByTime(10_000))

    expect(result.current).toBe('2026-11-26')
  })

  it('never moves back to an earlier day', () => {
    vi.setSystemTime(new Date(2026, 10, 26, 0, 30))
    const { result } = renderHook(() => useToday())

    act(() => {
      setVisibility('hidden')
      vi.setSystemTime(new Date(2026, 10, 25, 22, 30))
      setVisibility('visible')
    })

    expect(result.current).toBe('2026-11-26')
  })

  it('reads the day again when the app returns to the foreground', () => {
    const { result } = renderHook(() => useToday())

    act(() => {
      setVisibility('hidden')
      vi.setSystemTime(new Date(2026, 10, 26, 8, 0))
      setVisibility('visible')
    })

    expect(result.current).toBe('2026-11-26')
  })
})
