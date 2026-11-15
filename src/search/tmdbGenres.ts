import { GENRES, type Genre } from '../domain/types'

const TMDB_GENRES: Partial<Record<number, readonly Genre[]>> = {
  28: ['action'],
  12: ['adventure'],
  16: ['animation'],
  35: ['comedy'],
  80: ['crime'],
  99: ['documentary'],
  18: ['drama'],
  10751: ['family'],
  14: ['fantasy'],
  36: ['history'],
  27: ['horror'],
  10402: ['music'],
  9648: ['mystery'],
  10749: ['romance'],
  878: ['scifi'],
  53: ['thriller'],
  10752: ['war'],
  37: ['western'],
  10759: ['action', 'adventure'],
  10765: ['scifi', 'fantasy'],
  10768: ['war', 'politics'],
  10762: ['kids'],
  10764: ['reality'],
}

export function genresFromTmdb(genreIds: number[]): Genre[] {
  const mapped = new Set(genreIds.flatMap((genreId) => TMDB_GENRES[genreId]))

  return GENRES.filter((genre) => mapped.has(genre))
}
