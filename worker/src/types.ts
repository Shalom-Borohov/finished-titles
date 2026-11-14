type SourceName ='tmdb' | 'openlibrary' | 'igdb'

export type SearchResult = {
  source: SourceName
  sourceId: string
  title: string
  type: 'anime' | 'series' | 'movie' | 'book' | 'game'
  year?: number
  posterUrl?: string
}

export type SearchResponse = {
  results: SearchResult[]
  unavailable: SourceName[]
}

export type TitleDetails = {
  originalTitle?: string
  genres: { id: number; name: string }[]
  creators: string[]
  cast: string[]
  networks: string[]
  episodes?: number
  episodeMinutes?: number
  runtimeMinutes?: number
  nextEpisodeDate?: string
  watchInIsrael: string[]
}

export type Env = {
  ALLOWED_ORIGINS: string
  TMDB_TOKEN?: string
  TWITCH_CLIENT_ID?: string
  TWITCH_CLIENT_SECRET?: string
}
