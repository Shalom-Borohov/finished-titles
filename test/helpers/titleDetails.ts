import { screen } from '@testing-library/react'
import { pickResult, pressButton, searchFor } from './addFlow'
import { renderAt } from './renderAt'

export const MORE_DETAILS = 'פרטים נוספים'

export const SEVERANCE_DETAILS = {
  originalTitle: 'Severance',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 9648, name: 'Mystery' },
    { id: 999999, name: 'Workplace' },
  ],
  creators: ['Dan Erickson'],
  cast: ['Adam Scott', 'Britt Lower'],
  networks: ['Apple TV+'],
  episodes: 19,
  episodeMinutes: 50,
  nextEpisodeDate: '2027-03-12',
  watchInIsrael: ['Apple TV+', 'Netflix'],
}

export const DUNE_DETAILS = {
  originalTitle: 'Dune: Part One',
  genres: [{ id: 878, name: 'Science Fiction' }],
  creators: ['Denis Villeneuve'],
  cast: ['Timothée Chalamet', 'Zendaya'],
  networks: [],
  runtimeMinutes: 135,
  watchInIsrael: [],
}

export function backButton() {
  const button = document.querySelector('.details-back')

  if (!button) {
    throw new Error('no back button')
  }

  return button
}

export const moreDetailsRow = () => screen.queryByRole('button', { name: MORE_DETAILS })

export const identityMeta = () => document.querySelector('.details-meta')

export const rowValue = (label: string) => screen.getByText(label, { selector: 'dt' }).nextElementSibling

export async function openFormOf(result: { title: string }) {
  renderAt('/tabs/home')
  await searchFor(result.title)
  await pickResult(new RegExp(result.title))
  await screen.findByText('שמירה')
}

export async function openDetailsOf(result: { title: string }) {
  await openFormOf(result)
  await pressButton(MORE_DETAILS)
}
