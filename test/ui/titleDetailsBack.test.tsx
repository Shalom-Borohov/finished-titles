import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { pickResult, pressButton } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'
import { jsonReply, SEVERANCE, stubSearchResults } from '../helpers/searchService'
import {
  backButton,
  identityMeta,
  MORE_DETAILS,
  moreDetailsRow,
  openDetailsOf,
  openFormOf,
  SEVERANCE_DETAILS,
} from '../helpers/titleDetails'

describe('leaving the details of a title', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 7, 21, 30).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('goes back to the form as it was left, labelled with the sheet it came from', async () => {
    stubSearchResults([SEVERANCE], { detailsReply: jsonReply(SEVERANCE_DETAILS) })
    await openFormOf(SEVERANCE)
    fireEvent.change(await screen.findByLabelText('הערה'), { target: { value: 'מטריד' } })
    await pressButton(MORE_DETAILS)

    expect(backButton()).toHaveTextContent('הוספת כותר')

    fireEvent.click(backButton())

    expect(await screen.findByLabelText('הערה')).toHaveValue('מטריד')
    expect(screen.queryByText('Dan Erickson')).not.toBeInTheDocument()
  })

  it('labels the way back with the edit sheet when editing', async () => {
    await db.entries.add(
      entry({ title: 'Severance', type: 'series', source: 'tmdb', sourceId: 'tv/95396', releaseYear: 2022, endYear: 2025 }),
    )
    stubSearchResults([], { detailsReply: jsonReply(SEVERANCE_DETAILS) })
    renderAt('/tabs/home/series')
    await pickResult(/Severance/)
    await pressButton(MORE_DETAILS)

    expect(backButton()).toHaveTextContent('עריכת כותר')
    expect(identityMeta()).toHaveTextContent('סדרה · 2022–2025')
  })

  it('moves focus to the way back when the details open, and back to the row that opened them', async () => {
    stubSearchResults([SEVERANCE], { detailsReply: jsonReply(SEVERANCE_DETAILS) })
    await openDetailsOf(SEVERANCE)

    expect(backButton()).toHaveFocus()

    fireEvent.click(backButton())

    expect(moreDetailsRow()).toHaveFocus()
  })
})
