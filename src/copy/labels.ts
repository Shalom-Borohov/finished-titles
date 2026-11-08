import type { MediaType, Rating, Status } from '../domain/types'

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  anime: 'אנימה',
  series: 'סדרות',
  movie: 'סרטים',
  book: 'ספרים',
  game: 'משחקים',
  comic: 'קומיקס',
  other: 'אחר',
}

export const MEDIA_TYPE_SINGULAR_LABELS: Record<MediaType, string> = {
  anime: 'אנימה',
  series: 'סדרה',
  movie: 'סרט',
  book: 'ספר',
  game: 'משחק',
  comic: 'קומיקס',
  other: 'אחר',
}

export const RATING_LABELS: Record<Rating, string> = {
  favorite: 'אהוב במיוחד',
  loved: 'אהבתי מאוד',
  liked: 'אהבתי',
  okay: 'היה בסדר',
  disliked: 'לא אהבתי',
}

export const STATUS_LABELS: Record<Status, string> = {
  finished: 'סיימתי',
  stopped: 'עצרתי באמצע',
}

export const VERDICT_COPY = {
  stopped: 'נעצר',
  stoppedAtSeason: (season: number) => `נעצר בעונה ${season}`,
  seasons: (count: number) => `${count} עונות`,
} as const
