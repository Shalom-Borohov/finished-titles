const YEAR_ONLY = /^\d{4}$/

const EXACT_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

const YEAR_LENGTH = 4

const PAD_LENGTH = 2

const pad = (part: number) => String(part).padStart(PAD_LENGTH, '0')

export const toIsoDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

export const todayIso = () => toIsoDate(new Date())

export const isYearOnly =(finishedOn: string) => YEAR_ONLY.test(finishedOn)

function isRealDate(text: string) {
  const match = EXACT_DATE.exec(text)

  if (!match) {
    return false
  }

  const [, year, month, day] = match.map(Number)
  const date = new Date(year, month - 1, day)

  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

export const isFinishDate = (text: string) => isYearOnly(text) || isRealDate(text)

export const finishYear = (finishedOn: string) => Number(finishedOn.slice(0, YEAR_LENGTH))

export const isFutureFinishDate = (finishedOn: string, today: string) =>
  isYearOnly(finishedOn) ? finishYear(finishedOn) > finishYear(today) : finishedOn > today
