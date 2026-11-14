import { COMMON_COPY } from '../../copy/common'
import type { TitleDetails } from '../../search/client'
import { DETAILS_COPY } from './copy'

type DetailsRow = { label: string; value: string }

export type DetailsPanel = { title: string; rows: DetailsRow[]; caption?: string }

const nextEpisodeFormat = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })

function localDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)

  return new Date(year, month - 1, day)
}

const NO_BREAK_SPACE = ' '

const unbroken = (name: string) => name.replaceAll(' ', NO_BREAK_SPACE)

const joined = (names: string[]) => names.map(unbroken).join(COMMON_COPY.separator)

const row = (label: string, value: string | undefined): DetailsRow[] => (value ? [{ label, value }] : [])

const namesRow = (label: string, names: string[]) => row(label, names.length > 0 ? joined(names) : undefined)

function watchingPanel(details: TitleDetails): DetailsPanel {
  const nextEpisode = details.nextEpisodeDate && nextEpisodeFormat.format(localDate(details.nextEpisodeDate))
  const showsWhereToWatch = details.watchInIsrael.length > 0

  return {
    title: DETAILS_COPY.watching,
    rows: [
      ...namesRow(DETAILS_COPY.whereToWatch, details.watchInIsrael),
      ...namesRow(DETAILS_COPY.network, details.networks),
      ...row(DETAILS_COPY.nextEpisode, nextEpisode),
    ],
    caption: showsWhereToWatch ? DETAILS_COPY.watchCredit : undefined,
  }
}

const numberRow = (label: string, count: number | undefined, format: (count: number) => string) =>
  row(label, count === undefined ? undefined : format(count))

function lengthPanel(details: TitleDetails, isShow: boolean): DetailsPanel {
  if (!isShow) {
    return {
      title: DETAILS_COPY.lengthPanel,
      rows: numberRow(DETAILS_COPY.movieLength, details.runtimeMinutes, DETAILS_COPY.minutes),
    }
  }

  return {
    title: DETAILS_COPY.episodesPanel,
    rows: [
      ...numberRow(DETAILS_COPY.episodeCount, details.episodes, String),
      ...numberRow(DETAILS_COPY.episodeLength, details.episodeMinutes, DETAILS_COPY.aboutMinutes),
    ],
  }
}

function peoplePanel(details: TitleDetails, isShow: boolean): DetailsPanel {
  return {
    title: DETAILS_COPY.people,
    rows: [
      ...namesRow(isShow ? DETAILS_COPY.createdBy : DETAILS_COPY.directedBy, details.creators),
      ...namesRow(DETAILS_COPY.cast, details.cast),
    ],
  }
}

export function detailsPanels(details: TitleDetails, isShow: boolean) {
  return [watchingPanel(details), lengthPanel(details, isShow), peoplePanel(details, isShow)].filter(
    (panel) => panel.rows.length > 0,
  )
}
