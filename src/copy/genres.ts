import { GENRE_LABELS } from './labels'

const TMDB_GENRE_LABELS: Record<number, string> = {
  28: GENRE_LABELS.action,
  12: GENRE_LABELS.adventure,
  16: GENRE_LABELS.animation,
  35: GENRE_LABELS.comedy,
  80: GENRE_LABELS.crime,
  99: GENRE_LABELS.documentary,
  18: GENRE_LABELS.drama,
  10751: GENRE_LABELS.family,
  14: GENRE_LABELS.fantasy,
  36: GENRE_LABELS.history,
  27: GENRE_LABELS.horror,
  10402: GENRE_LABELS.music,
  9648: GENRE_LABELS.mystery,
  10749: GENRE_LABELS.romance,
  878: GENRE_LABELS.scifi,
  10770: 'סרט טלוויזיה',
  53: GENRE_LABELS.thriller,
  10752: GENRE_LABELS.war,
  37: GENRE_LABELS.western,
  10759: 'אקשן והרפתקאות',
  10762: GENRE_LABELS.kids,
  10763: 'חדשות',
  10764: GENRE_LABELS.reality,
  10765: 'מדע בדיוני ופנטזיה',
  10766: 'אופרת סבון',
  10767: 'אירוח',
  10768: 'מלחמה ופוליטיקה',
}

export const genreLabel = ({ id, name }: { id: number; name: string }) => TMDB_GENRE_LABELS[id] ?? name
