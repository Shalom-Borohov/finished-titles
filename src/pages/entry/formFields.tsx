import { useId } from 'react'
import { Segmented } from '../../components/formFields'
import { MinusIcon, PlusIcon } from '../../components/icons'
import { RATING_LABELS } from '../../copy/labels'
import { finishYear, isYearOnly } from '../../domain/finishDate'
import { type Rating, RATINGS } from '../../domain/types'
import { ENTRY_COPY } from './copy'
import { DATE_KINDS, type EntryFormState } from './formState'
import './formFields.css'

const FIRST_SEASON = 1

const DATE_KIND_LABELS = {
  exact: ENTRY_COPY.exactDate,
  year: ENTRY_COPY.yearOnly,
  none: ENTRY_COPY.noDate,
} as const

type RatingPillsProps = {
  legend: string
  selected?: Rating
  onSelect: (rating?: Rating) => void
}

export function RatingPills({ legend, selected, onSelect }: RatingPillsProps) {
  return (
    <fieldset className="form-group">
      <legend>{legend}</legend>
      <div className="rating-pills">
        {RATINGS.map((rating) => (
          <button
            key={rating}
            type="button"
            className="pill"
            aria-pressed={rating === selected}
            onClick={() => onSelect(rating === selected ? undefined : rating)}
          >
            {RATING_LABELS[rating]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

type SeasonStepperProps = {
  label: string
  season?: number
  onChange: (season?: number) => void
}

export function SeasonStepper({ label, season, onChange }: SeasonStepperProps) {
  const lower = () => onChange(season && season > FIRST_SEASON ? season - 1 : undefined)

  return (
    <div className="stepper">
      <span className="stepper-label">{label}</span>
      <span className="stepper-controls">
        <button type="button" className="icon-button" aria-label={ENTRY_COPY.oneSeasonLess} disabled={!season} onClick={lower}>
          <MinusIcon />
        </button>
        <span className="stepper-count">{season ?? ENTRY_COPY.noSeason}</span>
        <button
          type="button"
          className="icon-button"
          aria-label={ENTRY_COPY.oneSeasonMore}
          onClick={() => onChange((season ?? 0) + 1)}
        >
          <PlusIcon />
        </button>
      </span>
    </div>
  )
}

type YearStepperProps = {
  yearText: string
  thisYear: number
  onChange: (yearText: string) => void
}

function YearStepper({ yearText, thisYear, onChange }: YearStepperProps) {
  const inputId = useId()
  const year = Number(yearText)
  const hasYear = isYearOnly(yearText)
  const canLower = hasYear && isYearOnly(String(year - 1))
  const canRaise = hasYear && year < thisYear
  const stepTo = (next: number) => onChange(String(next))

  return (
    <div className="stepper">
      <label className="stepper-label" htmlFor={inputId}>
        {ENTRY_COPY.year}
      </label>
      <span className="stepper-controls">
        <button
          type="button"
          className="icon-button"
          aria-label={ENTRY_COPY.oneYearLess}
          disabled={!canLower}
          onClick={() => stepTo(year - 1)}
        >
          <MinusIcon />
        </button>
        <input
          id={inputId}
          className="stepper-year"
          type="number"
          inputMode="numeric"
          value={yearText}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={ENTRY_COPY.oneYearMore}
          disabled={!canRaise}
          onClick={() => stepTo(year + 1)}
        >
          <PlusIcon />
        </button>
      </span>
    </div>
  )
}

type DateFieldsProps = {
  legend: string
  form: EntryFormState
  today: string
  problem?: string
  onChange: (changes: Partial<EntryFormState>) => void
}

export function DateFields({ legend, form, today, problem, onChange }: DateFieldsProps) {
  return (
    <fieldset className="form-group">
      <legend>{legend}</legend>
      <Segmented
        label={ENTRY_COPY.dateKind}
        options={DATE_KINDS}
        labels={DATE_KIND_LABELS}
        selected={form.dateKind}
        onSelect={(dateKind) => onChange({ dateKind })}
      />
      {form.dateKind === 'exact' && (
        <label className="date-row">
          <span>{ENTRY_COPY.exactDate}</span>
          <input
            type="date"
            max={today}
            value={form.exactDate}
            onChange={(event) => onChange({ exactDate: event.target.value })}
          />
        </label>
      )}
      {form.dateKind === 'year' && (
        <YearStepper yearText={form.yearText} thisYear={finishYear(today)} onChange={(yearText) => onChange({ yearText })} />
      )}
      {problem && (
        <p className="form-problem" role="alert">
          {problem}
        </p>
      )}
    </fieldset>
  )
}
