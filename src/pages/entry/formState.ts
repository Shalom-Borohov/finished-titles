import type { EntryDraft } from '../../data/repo'
import { earliestFinishYear, knownSeasonCount, type YearLimit } from '../../domain/fieldLimits'
import { finishYear, isFinishDate, isFutureFinishDate, isYearOnly } from '../../domain/finishDate'
import { type Entry, fittingStatus, isShowType } from '../../domain/types'
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

export const lastSeasonOf = (form: EntryFormState, airedSeasons?: number) =>
  isShowType(form.type) ? knownSeasonCount(form, airedSeasons) : undefined

export const earliestYearOf = (form: EntryFormState, today: string, airedSeasons?: number) =>
  earliestFinishYear(form, { thisYear: finishYear(today), lastSeason: lastSeasonOf(form, airedSeasons) })

export function dateProblem(form: EntryFormState, today: string, savedOn?: string, earliest?: YearLimit) {
  const finishedOn = finishedOnOf(form)

  if (finishedOn === undefined) {
    return undefined
  }

  if (!isFinishDate(finishedOn)) {
    return form.dateKind === 'year' ? ENTRY_COPY.invalidYear : ENTRY_COPY.invalidDate
  }

  if (finishedOn === savedOn) {
    return undefined
  }

  if (isFutureFinishDate(finishedOn, today)) {
    return ENTRY_COPY.futureDate
  }

  if (earliest && finishYear(finishedOn) < earliest.year) {
    return earliest.reason === 'end' ? ENTRY_COPY.beforeEnd(earliest.year) : ENTRY_COPY.beforeRelease(earliest.year)
  }

  return undefined
}

export function seasonProblem(form: EntryFormState, airedSeasons?: number, saved?: Entry) {
  const field = form.status === 'stopped' ? 'stoppedSeason' : 'seasons'
  const season = form[field]
  const lastSeason = lastSeasonOf(form, airedSeasons)

  if (season === undefined || lastSeason === undefined || season === saved?.[field] || season <= lastSeason) {
    return undefined
  }

  return ENTRY_COPY.onlySeasons(lastSeason)
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
