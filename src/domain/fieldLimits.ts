import { type Entry, isShowType } from './types'

export type YearLimit ={ year: number; reason: 'release' | 'end' }

type TitleYears = Pick<Entry, 'type' | 'status' | 'releaseYear' | 'endYear' | 'seasons'>

type FinishContext = { thisYear: number; lastSeason?: number }

const hasWatchedEverySeason = ({ seasons }: TitleYears, lastSeason?: number) =>
  seasons === undefined || (lastSeason !== undefined && seasons >= lastSeason)

const endsWithTheShow = (title: TitleYears, lastSeason?: number) =>
  isShowType(title.type) && title.status === 'finished' && hasWatchedEverySeason(title, lastSeason)

export function earliestFinishYear(title: TitleYears, { thisYear, lastSeason }: FinishContext): YearLimit | undefined {
  const { endYear } = title
  const releaseYear = title.releaseYear !== undefined && title.releaseYear <= thisYear ? title.releaseYear : undefined

  if (endYear !== undefined && endsWithTheShow(title, lastSeason) && (releaseYear === undefined || endYear >= releaseYear)) {
    return { year: endYear, reason: 'end' }
  }

  return releaseYear === undefined ? undefined : { year: releaseYear, reason: 'release' }
}

export function knownSeasonCount({ endYear, lengthMinutes }: Pick<Entry, 'endYear' | 'lengthMinutes'>, airedSeasons?: number) {
  if (airedSeasons !== undefined) {
    return airedSeasons
  }

  return endYear !== undefined && lengthMinutes?.length ? lengthMinutes.length : undefined
}
