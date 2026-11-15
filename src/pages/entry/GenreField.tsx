import { useState } from 'react'
import { DownChevronIcon } from '../../components/icons'
import { COMMON_COPY } from '../../copy/common'
import { GENRE_LABELS } from '../../copy/labels'
import { type Genre, GENRES } from '../../domain/types'
import { ENTRY_COPY } from './copy'

type GenreFieldProps = {
  genres?: Genre[]
  onChange: (genres: Genre[]) => void
}

function summary(chosen: Genre[]) {
  if (chosen.length === 0) {
    return ENTRY_COPY.noGenres
  }

  return chosen.map((genre) => GENRE_LABELS[genre]).join(COMMON_COPY.separator)
}

export function GenreField({ genres = [], onChange }: GenreFieldProps) {
  const [isOpen, setIsOpen] = useState(false)

  function toggle(genre: Genre) {
    const isChosen = (candidate: Genre) => (candidate === genre ? !genres.includes(genre) : genres.includes(candidate))

    onChange(GENRES.filter(isChosen))
  }

  return (
    <div className="genre-card">
      <button type="button" className="more-details-row genre-row" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <span>{ENTRY_COPY.genres}</span>
        <span className="genre-summary">{summary(genres)}</span>
        <DownChevronIcon className="genre-chevron" />
      </button>
      {isOpen && (
        <div className="genre-pills" role="group" aria-label={ENTRY_COPY.genres}>
          {GENRES.map((genre) => (
            <button
              key={genre}
              type="button"
              className="pill"
              aria-pressed={genres.includes(genre)}
              onClick={() => toggle(genre)}
            >
              {GENRE_LABELS[genre]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
