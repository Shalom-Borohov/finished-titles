import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { openAdd, pickResult, pressButton, searchFor } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'
import { DUNE, stubSearchResults } from '../helpers/searchService'

function dialogName(element: HTMLElement) {
  const sheet = element.closest('ion-modal')

  if (!sheet) {
    throw new Error('no sheet')
  }

  return sheet.shadowRoot?.querySelector('[role="dialog"]')?.getAttribute('aria-label')
}

async function expectSheetName(element: HTMLElement, name: string) {
  await waitFor(() => expect(dialogName(element)).toBe(name))
}

describe('sheet names', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 7, 21, 30).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('names the add sheet by its title on the search step', async () => {
    renderAt('/tabs/home')
    await openAdd()

    await expectSheetName(await screen.findByLabelText('חיפוש כותר'), 'הוספת כותר')
  })

  it('names the sheet for editing when a poster opens it, though the page mounted it for adding', async () => {
    await db.entries.add(entry({ id: 'gone', title: 'Gone', type: 'movie' }))
    renderAt('/tabs/home/movie')
    fireEvent.click(await screen.findByRole('button', { name: /Gone/ }))

    await expectSheetName(await screen.findByText('שמירה'), 'עריכת כותר')
  })

  it('renames the open sheet when search opens a listed title, and names it for adding when reopened', async () => {
    await db.entries.add(entry({ title: 'Dune', type: 'movie', source: 'tmdb', sourceId: 'movie/438631' }))
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune.*כבר ברשימה/)

    await expectSheetName(await screen.findByText('שמירה'), 'עריכת כותר')

    fireEvent.click(screen.getByText('ביטול'))
    await waitFor(() => expect(screen.queryByText('שמירה')).not.toBeInTheDocument())
    await openAdd()

    await expectSheetName(await screen.findByLabelText('חיפוש כותר'), 'הוספת כותר')
  })

  it('names the add form of a type added by hand for adding', async () => {
    renderAt('/tabs/home/comic')
    await openAdd()

    await expectSheetName(await screen.findByLabelText('שם'), 'הוספת כותר')
  })

  it('names the feedback sheet by its title', async () => {
    renderAt('/tabs/settings')
    await pressButton('דיווח על באג / הצעה')

    await expectSheetName(await screen.findByText('פתיחה ב-GitHub'), 'דיווח')
  })
})
