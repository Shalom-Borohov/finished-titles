import {
  check,
  type InferOutput,
  integer,
  minLength,
  minValue,
  number,
  object,
  optional,
  picklist,
  pipe,
  string,
  trim,
  url,
} from 'valibot'
import { isFinishDate } from './finishDate'

const MINIMUM_TITLE_LENGTH = 1

const MINIMUM_SEASON = 1

export const MEDIA_TYPES = ['anime', 'series', 'movie', 'book', 'game', 'comic', 'other'] as const

export type MediaType = (typeof MEDIA_TYPES)[number]

const SHOW_TYPES: readonly MediaType[] = ['anime', 'series']

export const SEARCHABLE_TYPES = ['anime', 'series', 'movie', 'book', 'game'] as const

export const STATUSES = ['finished', 'stopped'] as const

export type Status = (typeof STATUSES)[number]

export const RATINGS = ['favorite', 'loved', 'liked', 'okay', 'disliked'] as const

export type Rating = (typeof RATINGS)[number]

export const SEARCH_SOURCES = ['tmdb', 'openlibrary', 'igdb'] as const

const seasonSchema = pipe(number(), integer(), minValue(MINIMUM_SEASON))

export const posterUrlSchema = pipe(string(), url())

export const entrySchema = object({
  id: string(),
  title: pipe(string(), trim(), minLength(MINIMUM_TITLE_LENGTH)),
  type: picklist(MEDIA_TYPES),
  status: picklist(STATUSES),
  createdAt: number(),
  releaseYear: optional(number()),
  endYear: optional(pipe(number(), integer())),
  posterUrl: optional(posterUrlSchema),
  source: optional(picklist(SEARCH_SOURCES)),
  sourceId: optional(string()),
  rating: optional(picklist(RATINGS)),
  note: optional(string()),
  finishedOn: optional(pipe(string(), check(isFinishDate))),
  seasons: optional(seasonSchema),
  stoppedSeason: optional(seasonSchema),
  stopReason: optional(string()),
})

export type Entry = InferOutput<typeof entrySchema>

export const isMediaType = (text: string | undefined): text is MediaType => MEDIA_TYPES.some((type) => type === text)

export const isShowType = (type: MediaType) => SHOW_TYPES.includes(type)

export const isSearchableType = (type: MediaType) => SEARCHABLE_TYPES.some((searchable) => searchable === type)
