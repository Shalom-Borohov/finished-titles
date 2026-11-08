import { afterEach, beforeEach, vi } from 'vitest'

export function freezeDate(time: number) {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(time)
  })

  afterEach(() => {
    vi.useRealTimers()
  })
}
