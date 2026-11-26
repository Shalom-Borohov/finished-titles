import type { EntryDraft } from '../../data/repo'
import { finishYear, isFinishDate, isFutureFinishDate, isYearOnly } from '../../domain/finishDate'
import { type Entry, fittingStatus } from '../../domain/types'
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

const todaysDate = (today: string): DateFields => ({ dateKind: 'exact', exactDate: today, yearText: String(finishYear(today)) })

export function formFromDraft(draft: EntryDraft, today: string): EntryFormState {
  return { ...draft, ...todaysDate(today) }
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

export function dateProblem(form: EntryFormState, today: string, savedOn?: string) {
  const finishedOn = finishedOnOf(form)

  if (finishedOn === undefined) {
    return undefined
  }

  if (!isFinishDate(finishedOn)) {
    return form.dateKind === 'year' ? ENTRY_COPY.invalidYear : ENTRY_COPY.invalidDate
  }

  const isChangedToFuture = finishedOn !== savedOn && isFutureFinishDate(finishedOn, today)

  return isChangedToFuture ? ENTRY_COPY.futureDate : undefined
}

const isOngoing = ({ status }: EntryFormState) => status === 'ongoing'

export function withChanges(current: EntryFormState, changes: Partial<EntryFormState>, today: string): EntryFormState {
  const changed = { ...current, ...changes }
  const next = { ...changed, status: fittingStatus(changed.type, changed.status) }

  return isOngoing(current) === isOngoing(next) ? next : { ...next, ...todaysDate(today) }
}

export function draftFromForm({ dateKind, exactDate, yearText, ...draft }: EntryFormState): EntryDraft {
  return { ...draft, finishedOn: finishedOnOf({ dateKind, exactDate, yearText }) }
}
