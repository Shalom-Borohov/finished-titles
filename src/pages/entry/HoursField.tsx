import { MINIMUM_HOURS } from '../../domain/types'
import { ENTRY_COPY } from './copy'
import './formFields.css'

const MAX_HOURS_DIGITS = 5

const NOT_A_DIGIT = /\D/g

type HoursFieldProps = {
  hours?: number
  onChange: (hours?: number) => void
}

export function HoursField({ hours, onChange }: HoursFieldProps) {
  function changeTyped(typed: string) {
    const typedHours = Number(typed.replace(NOT_A_DIGIT, '').slice(0, MAX_HOURS_DIGITS))

    onChange(typedHours >= MINIMUM_HOURS ? typedHours : undefined)
  }

  return (
    <label className="hours-row">
      <span>{ENTRY_COPY.hoursPlayed}</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={ENTRY_COPY.noValue}
        value={hours ?? ''}
        onChange={(event) => changeTyped(event.target.value)}
      />
    </label>
  )
}
