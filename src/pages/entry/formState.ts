import type { EntryDraft } from '../../data/repo'
import { finishYear, isFinishDate, isFutureFinishDate, isYearOnly } from '../../domain/finishDate'
import type { Entry } from '../../domain/types'
import { ENTRY_COPY } from './copy'

export const DATE_KINDS = ['exact', 'year', 'none'] as const

type DateKind = (typeof DATE_KINDS)[number]

type DateFields = {
  dateKind: DateKind
  exactDate: string
  yearText: string
}

export type EntryFormState = EntryDraft & DateFields

function dateKindOf(finishedOn: string | undefined): DateKind {
  if (!finishedOn) {
    return 'none'
  }

  return isYearOnly(finishedOn) ? 'year' : 'exact'
}

export function formFromDraft(draft: EntryDraft, today: string): EntryFormState {
  return { ...draft, dateKind: 'exact', exactDate: today, yearText: String(finishYear(today)) }
}

export function formFromEntry(entry: Entry, today: string): EntryFormState {
  const { finishedOn } = entry

  return {
    ...entry,
    dateKind: dateKindOf(finishedOn),
    exactDate: finishedOn && !isYearOnly(finishedOn) ? finishedOn : today,
    yearText: String(finishYear(finishedOn ?? today)),
  }
}

function finishedOnOf({ dateKind, exactDate, yearText }: DateFields) {
  if (dateKind === 'none') {
    return undefined
  }

  return dateKind === 'year' ? yearText : exactDate
}

export function dateProblem(form: EntryFormState, today: string) {
  const finishedOn = finishedOnOf(form)

  if (finishedOn === undefined) {
    return undefined
  }

  if (!isFinishDate(finishedOn)) {
    return form.dateKind === 'year' ? ENTRY_COPY.invalidYear : ENTRY_COPY.invalidDate
  }

  return isFutureFinishDate(finishedOn, today) ? ENTRY_COPY.futureDate : undefined
}

export function draftFromForm({ dateKind, exactDate, yearText, ...draft }: EntryFormState): EntryDraft {
  return { ...draft, finishedOn: finishedOnOf({ dateKind, exactDate, yearText }) }
}
