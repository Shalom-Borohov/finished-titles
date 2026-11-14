import { COMMON_COPY } from '../copy/common'
import { RATING_LABELS, VERDICT_COPY } from '../copy/labels'
import { finishYear, isYearOnly } from './finishDate'
import { type Entry, isShowType, MEDIA_TYPES, type MediaType, type Status } from './types'

const HOME_TILE_POSTERS = 3

export const ALL_TYPES = 'all'

export const ALL_STATUSES = 'all'

export type TypeFilter = MediaType | typeof ALL_TYPES

export type StatusFilter = Status | typeof ALL_STATUSES

type EntryFilter = {
  type: TypeFilter
  status: StatusFilter
  query: string
}

type ExistingCandidate = Pick<Entry, 'title' | 'type' | 'source' | 'sourceId'>

export type HomeTile = {
  type: MediaType
  count: number
  posters: Pick<Entry, 'title' | 'posterUrl'>[]
}

const normalizedTitle = (title: string) => title.trim().toLowerCase()

function compareFinishDates(first: string, second: string) {
  const yearDifference = finishYear(second) - finishYear(first)

  if (yearDifference !== 0) {
    return yearDifference
  }

  if (isYearOnly(first) !== isYearOnly(second)) {
    return isYearOnly(first) ? 1 : -1
  }

  return second.localeCompare(first)
}

function compareNewestFirst(first: Entry, second: Entry) {
  if (first.finishedOn && second.finishedOn) {
    return compareFinishDates(first.finishedOn, second.finishedOn) || second.createdAt - first.createdAt
  }

  if (first.finishedOn) {
    return -1
  }

  if (second.finishedOn) {
    return 1
  }

  return second.createdAt - first.createdAt
}

export const sortNewestFirst = (entries: Entry[]) => entries.toSorted(compareNewestFirst)

export function verdictLabel(entry: Entry) {
  if (entry.status === 'stopped') {
    return entry.stoppedSeason ? VERDICT_COPY.stoppedAtSeason(entry.stoppedSeason) : VERDICT_COPY.stopped
  }

  const parts = [
    ...(entry.rating ? [RATING_LABELS[entry.rating]] : []),
    ...(entry.seasons && entry.seasons > 1 ? [VERDICT_COPY.seasons(entry.seasons)] : []),
  ]

  return parts.join(COMMON_COPY.separator)
}

export function filterEntries(entries: Entry[], { type, status, query }: EntryFilter) {
  const searchedTitle = normalizedTitle(query)

  return entries.filter(
    (entry) =>
      (type === ALL_TYPES || entry.type === type) &&
      (status === ALL_STATUSES || entry.status === status) &&
      normalizedTitle(entry.title).includes(searchedTitle),
  )
}

export function homeTiles(entries: Entry[]): HomeTile[] {
  const newestFirst = sortNewestFirst(entries)

  return MEDIA_TYPES.map((type) => {
    const ofType = newestFirst.filter((entry) => entry.type === type)

    return {
      type,
      count: ofType.length,
      posters: ofType.slice(0, HOME_TILE_POSTERS),
    }
  })
}

export function findExisting(entries: Entry[], candidate: ExistingCandidate) {
  const hasSameTitle = ({ type, title }: Entry) =>
    type === candidate.type && normalizedTitle(title) === normalizedTitle(candidate.title)

  if (candidate.source && candidate.sourceId) {
    return (
      entries.find(({ source, sourceId }) => source === candidate.source && sourceId === candidate.sourceId) ??
      entries.find((entry) => !entry.source && hasSameTitle(entry))
    )
  }

  return entries.find(hasSameTitle)
}

const withoutBlankText = (text: string | undefined) => text?.trim() || undefined

export function normalizeEntry(entry: Entry): Entry {
  const isStopped = entry.status === 'stopped'
  const isShow = isShowType(entry.type)

  return {
    ...entry,
    title: entry.title.trim(),
    note: withoutBlankText(entry.note),
    endYear: isShow ? entry.endYear : undefined,
    seasons: isShow && !isStopped ? entry.seasons : undefined,
    stoppedSeason: isShow && isStopped ? entry.stoppedSeason : undefined,
    stopReason: isStopped ? withoutBlankText(entry.stopReason) : undefined,
  }
}
