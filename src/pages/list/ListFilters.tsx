import { DownChevronIcon } from '../../components/icons'
import { GENRE_LABELS, RATING_LABELS } from '../../copy/labels'
import type { Genre, Rating } from '../../domain/types'
import { LIST_COPY } from './copy'

const ALL_OPTION = ''

type MenuPillProps<Option extends string> = {
  label: string
  allText: string
  offered: Option[]
  labels: Record<Option, string>
  chosen: Option | undefined
  onChoose: (chosen: Option | undefined) => void
}

function MenuPill<Option extends string>({ label, allText, offered, labels, chosen, onChoose }: MenuPillProps<Option>) {
  if (offered.length === 0) {
    return null
  }

  return (
    <div className={chosen ? 'pill pill-chosen menu-pill' : 'pill menu-pill'}>
      <span aria-hidden="true">{chosen ? labels[chosen] : allText}</span>
      <DownChevronIcon className="menu-pill-chevron" />
      <select
        className="menu-pill-select"
        aria-label={label}
        value={chosen ?? ALL_OPTION}
        onChange={(event) => onChoose(offered.find((option) => option === event.target.value))}
      >
        <option value={ALL_OPTION}>{allText}</option>
        {offered.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
    </div>
  )
}

type ListFiltersProps = {
  ratings: Rating[]
  rating: Rating | undefined
  onRating: (rating: Rating | undefined) => void
  genres: Genre[]
  genre: Genre | undefined
  onGenre: (genre: Genre | undefined) => void
}

export function ListFilters({ ratings, rating, onRating, genres, genre, onGenre }: ListFiltersProps) {
  if (ratings.length === 0 && genres.length === 0) {
    return null
  }

  return (
    <div className="menu-pills">
      <MenuPill
        label={LIST_COPY.ratingFilter}
        allText={LIST_COPY.allRatings}
        offered={ratings}
        labels={RATING_LABELS}
        chosen={rating}
        onChoose={onRating}
      />
      <MenuPill
        label={LIST_COPY.genreFilter}
        allText={LIST_COPY.allGenres}
        offered={genres}
        labels={GENRE_LABELS}
        chosen={genre}
        onChoose={onGenre}
      />
    </div>
  )
}
