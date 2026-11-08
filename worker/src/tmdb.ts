import { array, type InferOutput, nullish, number, object, string } from 'valibot'
import type { Env, SearchResult } from './types'
import { isUsableTitle, parseUpstreamJson } from './upstream'

const SEARCH_URL = 'https://api.themoviedb.org/3/search/multi'
const POSTER_URL = 'https://image.tmdb.org/t/p/w342'
const MAX_RESULTS = 8
const MOVIE_MEDIA_TYPE = 'movie'
const TV_MEDIA_TYPE = 'tv'
const ANIMATION_GENRE_ID = 16
const JAPAN_COUNTRY_CODE = 'JP'
const LEADING_YEAR = /^\d{4}/
const FIXED_SEARCH_PARAMS = { include_adult: 'false', language: 'en-US', page: '1' }

const entrySchema = object({
  id: number(),
  media_type: string(),
  title: nullish(string()),
  name: nullish(string()),
  release_date: nullish(string()),
  first_air_date: nullish(string()),
  poster_path: nullish(string()),
  genre_ids: nullish(array(number())),
  origin_country: nullish(array(string())),
})

const responseSchema = object({ results: array(entrySchema) })

type TmdbEntry = InferOutput<typeof entrySchema>

function isMovieOrTv(entry: TmdbEntry) {
  return entry.media_type === MOVIE_MEDIA_TYPE || entry.media_type === TV_MEDIA_TYPE
}

function tvType(entry: TmdbEntry): SearchResult['type'] {
  const isAnimation = entry.genre_ids?.includes(ANIMATION_GENRE_ID)
  const isFromJapan = entry.origin_country?.includes(JAPAN_COUNTRY_CODE)

  return isAnimation && isFromJapan ? 'anime' : 'series'
}

function yearOf(date: string | null | undefined) {
  const leadingYear = date?.match(LEADING_YEAR)

  return leadingYear ? Number(leadingYear[0]) : undefined
}

function toSearchResults(entry: TmdbEntry): SearchResult[] {
  const isMovie = entry.media_type === MOVIE_MEDIA_TYPE
  const title = isMovie ? entry.title : entry.name
  const date = isMovie ? entry.release_date : entry.first_air_date

  if (!isUsableTitle(title)) {
    return []
  }

  return [
    {
      source: 'tmdb',
      sourceId: `${entry.media_type}/${entry.id}`,
      title,
      type: isMovie ? 'movie' : tvType(entry),
      year: yearOf(date),
      posterUrl: entry.poster_path ? `${POSTER_URL}${entry.poster_path}` : undefined,
    },
  ]
}

export async function searchTmdb(query: string, env: Env): Promise<SearchResult[]> {
  if (!env.TMDB_TOKEN) {
    throw new Error('TMDB_TOKEN is not set')
  }

  const url = new URL(SEARCH_URL)

  url.search = new URLSearchParams({ query, ...FIXED_SEARCH_PARAMS }).toString()

  const response = await fetch(url, { headers: { Authorization: `Bearer ${env.TMDB_TOKEN}` } })
  const { results } = await parseUpstreamJson(response, responseSchema)

  return results.filter(isMovieOrTv).flatMap(toSearchResults).slice(0, MAX_RESULTS)
}
