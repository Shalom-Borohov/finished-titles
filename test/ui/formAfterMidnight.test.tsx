import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pickResult, pressButton, saveButton, searchFor } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { renderAt } from '../helpers/renderAt'
import { stubSearchResults } from '../helpers/searchService'
import { setVisibility } from '../helpers/visibility'

const DUNE = { source: 'tmdb', sourceId: '438631', title: 'Dune', type: 'movie', year: 2021 } as const

async function openDuneForm() {
  stubSearchResults([DUNE])
  renderAt('/tabs/home')
  await searchFor('dune')
  await pickResult(/Dune/)
}

function returnToTheAppAt(time: Date) {
  act(() => {
    setVisibility('hidden')
    vi.setSystemTime(time)
    setVisibility('visible')
  })
}

describe('a form left open past midnight', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 25, 23, 55).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('accepts the new day as today', async () => {
    await openDuneForm()
    returnToTheAppAt(new Date(2026, 10, 26, 0, 5))

    fireEvent.change(await screen.findByLabelText('תאריך'), { target: { value: '2026-11-26' } })

    expect(screen.queryByText('התאריך לא יכול להיות בעתיד')).not.toBeInTheDocument()
    expect(screen.getByLabelText('תאריך')).toHaveAttribute('max', '2026-11-26')
    await waitFor(async () => expect(await saveButton()).toHaveProperty('disabled', false))
  })

  it('keeps the date it opened with when that date was not touched', async () => {
    await openDuneForm()
    returnToTheAppAt(new Date(2026, 10, 26, 0, 5))

    expect(await screen.findByLabelText('תאריך')).toHaveValue('2026-11-25')
  })

  it('lets the year go up to the new year after New Year’s midnight', async () => {
    vi.setSystemTime(new Date(2026, 11, 31, 23, 55))
    await openDuneForm()
    await pressButton('רק שנה')

    expect(screen.getByRole('button', { name: 'שנה אחת יותר' })).toBeDisabled()

    returnToTheAppAt(new Date(2027, 0, 1, 0, 5))

    expect(screen.getByRole('button', { name: 'שנה אחת יותר' })).toBeEnabled()
  })
})
