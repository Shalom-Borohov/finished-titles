import { type Entry, isGameType, isShowType, type MediaType } from './types'

const TIMED_TYPES: readonly MediaType[] = ['movie', 'series', 'anime']

export const MINUTES_PER_HOUR = 60

const sum = (parts: number[]) => parts.reduce((total, part) => total + part, 0)

function firstParts(parts: number[], count: number) {
  const missingCount = Math.max(count - parts.length, 0)
  const average = sum(parts) / parts.length

  return sum(parts.slice(0, count)) + missingCount * average
}

export function minutesSpent({ type, status, seasons, stoppedSeason, hours, lengthMinutes }: Entry): number {
  if (isGameType(type)) {
    return (hours ?? 0) * MINUTES_PER_HOUR
  }

  if (!TIMED_TYPES.includes(type) || !lengthMinutes?.length) {
    return 0
  }

  if (status === 'stopped') {
    return isShowType(type) && stoppedSeason ? firstParts(lengthMinutes, stoppedSeason - 1) : 0
  }

  return isShowType(type) && seasons ? firstParts(lengthMinutes, seasons) : sum(lengthMinutes)
}
