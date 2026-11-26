import { COMMON_COPY } from '../copy/common'
import { RATING_LABELS, VERDICT_COPY } from '../copy/labels'
import { finishYear, isYearOnly } from './finishDate'
import {
  type Entry,
  fittingStatus,
  GENRES,
  type Genre,
  isGameType,
  isShowType,
  MEDIA_TYPES,
  type MediaType,
  RATINGS,
  type Rating,
  type Status,
} from './types'

const HOME_TILE_POSTERS = 3

export const ALL_TYPES = 'all'

export const ALL_STATUSES = 'all'

export type TypeFilter = MediaType | typeof ALL_TYPES

export type StatusFilter = Status | typeof ALL_STATUSES

type EntryFilter = {
  type: TypeFilter
  status: StatusFilter
  query: string
  rating?: Rating
  genre?: Genre
}

type ExistingCandidate = Pick<Entry, 'title' | 'type' | 'source' | 'sourceId' | 'releaseYear'>

export type HomeTile = {
  type: MediaType
  count: number
  posters: Pick<Entry, 'title' | 'posterUrl'>[]
}

const normalizedTitle = (title: string) => title.trim().toLowerCase()

const COMBINING_MARKS = /\p{M}/gu

const PUNCTUATION_SYMBOLS_AND_SPACES = /[\p{P}\p{S}\s]/gu

const searchFolded = (text: string) =>
  text.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase().replace(PUNCTUATION_SYMBOLS_AND_SPACES, '')

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

  if (entry.status === 'ongoing') {
    return VERDICT_COPY.ongoing
  }

  const parts = [
    ...(entry.rating ? [RATING_LABELS[entry.rating]] : []),
    ...(entry.seasons && entry.seasons > 1 ? [VERDICT_COPY.seasons(entry.seasons)] : []),
  ]

  return parts.join(COMMON_COPY.separator)
}

export function filterEntries(entries: Entry[], { type, status, query, rating, genre }: EntryFilter) {
  const searchedTitle = searchFolded(query)

  return entries.filter(
    (entry) =>
      (type === ALL_TYPES || entry.type === type) &&
      (status === ALL_STATUSES || entry.status === status) &&
      (!rating || entry.rating === rating) &&
      (!genre || entry.genres?.includes(genre)) &&
      (!searchedTitle || searchFolded(entry.title).includes(searchedTitle)),
  )
}

export function offeredRatings(entries: Entry[]): Rating[] {
  const rated = new Set(entries.map(({ rating }) => rating))

  return RATINGS.filter((rating) => rated.has(rating))
}

export function offeredGenres(entries: Entry[]): Genre[] {
  const tagged = new Set(entries.flatMap(({ genres }) => genres))

  return GENRES.filter((genre) => tagged.has(genre))
}

export function awaitingGenres(entries: Entry[]) {
  return entries.filter(({ source, genres }) => source === 'tmdb' && genres === undefined)
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
      entries.find(
        (entry) =>
          !entry.source &&
          entry.releaseYear !== undefined &&
          entry.releaseYear === candidate.releaseYear &&
          hasSameTitle(entry),
      )
    )
  }

  return entries.find(hasSameTitle)
}

const withoutBlankText = (text: string | undefined) => text?.trim() || undefined

export function normalizeEntry(entry: Entry): Entry {
  const isStopped = entry.status === 'stopped'
  const isShow = isShowType(entry.type)
  const isGame = isGameType(entry.type)

  return {
    ...entry,
    status: fittingStatus(entry.type, entry.status),
    title: entry.title.trim(),
    note: withoutBlankText(entry.note),
    endYear: isShow ? entry.endYear : undefined,
    seasons: isShow && !isStopped ? entry.seasons : undefined,
    stoppedSeason: isShow && isStopped ? entry.stoppedSeason : undefined,
    stopReason: isStopped ? withoutBlankText(entry.stopReason) : undefined,
    hours: isGame ? entry.hours : undefined,
  }
}
