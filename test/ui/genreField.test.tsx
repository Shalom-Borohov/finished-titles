import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { openAdd, pickResult, pressButton, save, savedEntries, searchFor } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'
import { SEVERANCE, stubSearchResults } from '../helpers/searchService'
import { MORE_DETAILS } from '../helpers/titleDetails'

const openGenres = async () => fireEvent.click(await screen.findByRole('button', { name: /ז׳אנרים/ }))

async function startManualComic(title: string) {
  renderAt('/tabs/home/comic')
  await openAdd()
  fireEvent.change(await screen.findByLabelText('שם'), { target: { value: title } })
}

describe('choosing genres on the form', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 15, 21, 30).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('saves the ticked genres in the app order', async () => {
    await startManualComic('Saga')
    await openGenres()
    await pressButton('פנטזיה')
    await pressButton('דרמה')
    await save()

    const [saved] = await savedEntries()

    expect(saved.genres).toEqual(['drama', 'fantasy'])
  })

  it('saves an empty list when every genre is unticked while editing', async () => {
    await db.entries.add(entry({ id: 'gone', title: 'Gone', type: 'movie', genres: ['drama', 'comedy'] }))
    renderAt('/tabs/home/movie')

    fireEvent.click(await screen.findByRole('button', { name: /Gone/ }))
    await openGenres()
    await pressButton('דרמה')
    await pressButton('קומדיה')
    await save()

    await waitFor(async () => expect((await db.entries.get('gone'))?.genres).toEqual([]))
  })

  it('saves no genres when they were never touched', async () => {
    await startManualComic('Saga')
    await save()

    const [saved] = await savedEntries()

    expect(saved.genres).toBeUndefined()
  })

  it('fills the genres from a TMDB pick and shows them on the row', async () => {
    stubSearchResults([{ ...SEVERANCE, genreIds: [10759, 18] }])
    renderAt('/tabs/home')
    await searchFor('severance')
    await pickResult(/Severance/)

    const genreRow = await screen.findByRole('button', { name: /ז׳אנרים/ })

    expect(genreRow).toHaveTextContent('אקשן · דרמה · הרפתקאות')
    expect(screen.getByRole('button', { name: MORE_DETAILS }).compareDocumentPosition(genreRow)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )

    await save()

    const [saved] = await savedEntries()

    expect(saved.genres).toEqual(['action', 'drama', 'adventure'])
  })

  it('says none are chosen, and opens and folds the pills', async () => {
    await startManualComic('Saga')

    const genreRow = await screen.findByRole('button', { name: /ז׳אנרים/ })

    expect(genreRow).toHaveTextContent('לא נבחרו')
    expect(genreRow).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('group', { name: 'ז׳אנרים' })).not.toBeInTheDocument()

    fireEvent.click(genreRow)

    expect(genreRow).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('group', { name: 'ז׳אנרים' }).querySelectorAll('.pill')).toHaveLength(21)

    fireEvent.click(genreRow)

    expect(genreRow).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('group', { name: 'ז׳אנרים' })).not.toBeInTheDocument()
  })
})
