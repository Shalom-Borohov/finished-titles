import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { openAdd, pickResult, pressButton, save, savedEntries, searchFor } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'
import { SEARCH_URL, stubSearchFailure, stubSearchResults } from '../helpers/searchService'

const DUNE = {
  source: 'tmdb',
  sourceId: '438631',
  title: 'Dune',
  type: 'movie',
  year: 2021,
  posterUrl: 'https://image.test/dune.jpg',
} as const

const SEVERANCE = { source: 'tmdb', sourceId: '95396', title: 'Severance', type: 'series', year: 2022 } as const

const saveButton = async () => (await screen.findByText('שמירה')).closest('ion-button')

describe('adding a title', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 7, 21, 30).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('searches the search service and shows results with their type and year', async () => {
    const fetchStub = stubSearchResults([DUNE])

    renderAt('/tabs/home')
    await searchFor('dune')

    expect(await screen.findByRole('button', { name: /Dune.*סרט · 2021/ })).toBeVisible()
    expect(String(fetchStub.mock.calls[0][0])).toBe(`${SEARCH_URL}/search?q=dune`)
  })

  it('logs a search result as finished today, with its poster, year and source', async () => {
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)

    await pressButton('אהבתי מאוד')
    fireEvent.change(await screen.findByLabelText('הערה'), { target: { value: 'מרהיב' } })
    await save()

    const [saved] = await savedEntries()

    expect(saved).toMatchObject({
      title: 'Dune',
      type: 'movie',
      status: 'finished',
      rating: 'loved',
      note: 'מרהיב',
      finishedOn: '2026-11-07',
      releaseYear: 2021,
      posterUrl: DUNE.posterUrl,
      source: 'tmdb',
      sourceId: '438631',
    })
  })

  it('shows the new title on home after saving', async () => {
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)
    await save()

    expect(await screen.findByRole('link', { name: 'מה שראיתי, קראתי ושיחקתי · 1' })).toBeVisible()
  })

  it('lets a rating be pressed again to clear it, and saves without one', async () => {
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)
    await pressButton('אהבתי')
    await pressButton('אהבתי')
    await save()

    expect((await savedEntries())[0].rating).toBeUndefined()
  })

  it('records seasons watched for a finished show', async () => {
    stubSearchResults([SEVERANCE])
    renderAt('/tabs/home')
    await searchFor('severance')
    await pickResult(/Severance/)
    await pressButton('עונה אחת יותר')
    await pressButton('עונה אחת יותר')
    await save()

    expect((await savedEntries())[0].seasons).toBe(2)
  })

  it('does not ask for seasons on a movie', async () => {
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)

    await saveButton()

    expect(screen.queryByRole('button', { name: 'עונה אחת יותר' })).not.toBeInTheDocument()
  })

  it('records where and why a show was stopped', async () => {
    stubSearchResults([SEVERANCE])
    renderAt('/tabs/home')
    await searchFor('severance')
    await pickResult(/Severance/)
    await pressButton('עצרתי באמצע')
    await pressButton('עונה אחת יותר')
    fireEvent.change(await screen.findByLabelText('למה עצרתי?'), { target: { value: 'נמרח' } })
    await save()

    expect((await savedEntries())[0]).toMatchObject({ status: 'stopped', stoppedSeason: 1, stopReason: 'נמרח' })
  })

  it('asks a stopped book why, but not which season', async () => {
    stubSearchResults([{ source: 'openlibrary', sourceId: '/works/1', title: 'Ulysses', type: 'book' }])
    renderAt('/tabs/home')
    await searchFor('ulysses')
    await pickResult(/Ulysses/)
    await pressButton('עצרתי באמצע')

    expect(await screen.findByLabelText('למה עצרתי?')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'עונה אחת יותר' })).not.toBeInTheDocument()
  })

  it('records only a year', async () => {
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)
    await pressButton('רק שנה')
    fireEvent.change(await screen.findByLabelText('שנה'), { target: { value: '2019' } })
    await save()

    expect((await savedEntries())[0].finishedOn).toBe('2019')
  })

  it('records no date', async () => {
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)
    await pressButton('בלי תאריך')
    await save()

    expect((await savedEntries())[0].finishedOn).toBeUndefined()
  })

  it.each([
    ['a future date', 'תאריך', '2026-11-08', 'תאריך', 'התאריך לא יכול להיות בעתיד'],
    ['a future year', 'שנה', '2027', 'רק שנה', 'התאריך לא יכול להיות בעתיד'],
    ['a malformed year', 'שנה', '20', 'רק שנה', 'צריך שנה בת ארבע ספרות'],
  ])('blocks saving %s and says why', async (_name, fieldLabel, text, modeButton, message) => {
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)
    await pressButton(modeButton)
    fireEvent.change(await screen.findByLabelText(fieldLabel), { target: { value: text } })

    expect(await screen.findByText(message)).toBeVisible()
    expect(await saveButton()).toHaveProperty('disabled', true)
  })

  it('marks a result that is already in the list, and opens the existing entry', async () => {
    const existing = entry({ title: 'Dune', type: 'movie', source: 'tmdb', sourceId: '438631', rating: 'loved' })

    await db.entries.add(existing)
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune.*כבר ברשימה/)

    expect(await screen.findByRole('button', { name: 'אהבתי מאוד' })).toHaveAttribute('aria-pressed', 'true')

    await save()

    expect(await db.entries.count()).toBe(1)
  })

  it('treats a poster address that is not a URL as a failed search, so it never reaches a backup', async () => {
    stubSearchResults([{ ...DUNE, posterUrl: 'not a url' }])
    renderAt('/tabs/home')
    await searchFor('dune')

    expect(await screen.findByText('החיפוש לא זמין כרגע. אפשר להוסיף ידנית.')).toBeVisible()
  })

  it('skips results of a type or source this version does not know, and shows the rest', async () => {
    stubSearchResults([
      DUNE,
      { source: 'tmdb', sourceId: 'comic/1', title: 'Dune: House Atreides', type: 'comic' },
      { source: 'comicvine', sourceId: '42', title: 'Dune: The Graphic Novel', type: 'book' },
    ])
    renderAt('/tabs/home')
    await searchFor('dune')

    expect(await screen.findByRole('button', { name: /Dune.*סרט · 2021/ })).toBeVisible()
    expect(screen.queryByText('Dune: House Atreides')).not.toBeInTheDocument()
    expect(screen.queryByText('Dune: The Graphic Novel')).not.toBeInTheDocument()
    expect(screen.queryByText('החיפוש לא זמין כרגע. אפשר להוסיף ידנית.')).not.toBeInTheDocument()
  })

  it('treats a result with no type as a failed search, rather than skipping it', async () => {
    stubSearchResults([DUNE, { source: 'tmdb', sourceId: '1', title: 'Dune: Part Two' }])
    renderAt('/tabs/home')
    await searchFor('dune')

    expect(await screen.findByText('החיפוש לא זמין כרגע. אפשר להוסיף ידנית.')).toBeVisible()
  })

  it('disables saving as soon as save is pressed, so a double tap adds one title', async () => {
    renderAt('/tabs/home/comic')
    await openAdd()
    fireEvent.change(await screen.findByLabelText('שם'), { target: { value: 'Maus' } })
    await save()

    expect(await saveButton()).toHaveProperty('disabled', true)
  })

  it('keeps the form on screen while the sheet slides away', async () => {
    renderAt('/tabs/home/comic')
    await openAdd()

    const titleField = await screen.findByLabelText('שם')

    fireEvent.click(screen.getByText('ביטול'))

    expect(titleField).toBeInTheDocument()
  })

  it('offers manual entry, with what was typed as the title', async () => {
    stubSearchResults([])
    renderAt('/tabs/home')
    await searchFor('obscure film')
    await pressButton('לא מצאתי, הוספה ידנית')

    expect(await screen.findByLabelText('שם')).toHaveValue('obscure film')

    fireEvent.change(await screen.findByLabelText('סוג'), { target: { value: 'book' } })
    await save()

    expect((await savedEntries())[0]).toMatchObject({ title: 'obscure film', type: 'book', status: 'finished' })
  })

  it('says search failed, not that nothing was found, when no source answered', async () => {
    stubSearchResults([], { unavailable: ['tmdb', 'openlibrary'] })
    renderAt('/tabs/home')
    await searchFor('dune')

    expect(await screen.findByText('החיפוש לא זמין כרגע. אפשר להוסיף ידנית.')).toBeVisible()
    expect(screen.queryByText('לא נמצאו תוצאות')).not.toBeInTheDocument()
  })

  it('says nothing was found when every source answered', async () => {
    stubSearchResults([])
    renderAt('/tabs/home')
    await searchFor('zzzz')

    expect(await screen.findByText('לא נמצאו תוצאות')).toBeVisible()
  })

  it('limits a search to what the search service accepts', async () => {
    stubSearchResults([])
    renderAt('/tabs/home')
    await openAdd()

    expect(await screen.findByLabelText('חיפוש כותר')).toHaveAttribute('maxlength', '100')
  })

  it('shows the release year of a search result on the form', async () => {
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)

    expect(await screen.findByText('2021')).toBeVisible()
  })

  it('does not close the sheet on a tap outside it, so typed text is not lost', async () => {
    renderAt('/tabs/home/comic')
    await openAdd()
    await screen.findByLabelText('שם')

    expect(document.querySelector('ion-modal')).toHaveProperty('backdropDismiss', false)
  })

  it('needs a title to save', async () => {
    stubSearchResults([])
    renderAt('/tabs/home')
    await openAdd()
    await pressButton('לא מצאתי, הוספה ידנית')

    expect(await saveButton()).toHaveProperty('disabled', true)
  })

  it('warns about a manual duplicate but still allows it', async () => {
    await db.entries.add(entry({ title: 'Emma', type: 'book' }))
    stubSearchResults([])
    renderAt('/tabs/home/book')
    await searchFor('emma')
    await pressButton('לא מצאתי, הוספה ידנית')

    expect(await screen.findByText('כותר בשם הזה כבר ברשימה')).toBeVisible()
    expect(await saveButton()).toHaveProperty('disabled', false)
  })

  it('says when search is unavailable and still allows manual entry', async () => {
    stubSearchFailure()
    renderAt('/tabs/home')
    await searchFor('dune')

    expect(await screen.findByText('החיפוש לא זמין כרגע. אפשר להוסיף ידנית.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'הוספה ידנית' })).toBeVisible()
  })

  it('says when a source is missing from the results', async () => {
    stubSearchResults([DUNE], { unavailable: ['igdb'] })
    renderAt('/tabs/home')
    await searchFor('dune')

    expect(await screen.findByText('חלק ממקורות החיפוש לא זמינים כרגע')).toBeVisible()
  })

  it('goes straight to the form from the comics list, as that type is manual', async () => {
    renderAt('/tabs/home/comic')
    await openAdd()

    expect(await screen.findByLabelText('שם')).toBeVisible()
    expect(screen.getByLabelText('סוג')).toHaveValue('comic')
  })

  it('starts a manual entry with the type of the list it was opened from', async () => {
    stubSearchResults([])
    renderAt('/tabs/home/game')
    await openAdd()
    await pressButton('לא מצאתי, הוספה ידנית')

    expect(await screen.findByLabelText('סוג')).toHaveValue('game')
  })
})

describe('when storage fails', () => {
  const toasts = () => Array.from(document.querySelectorAll('ion-toast'), (toast) => toast.message)

  beforeEach(resetDb)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('says a save failed, keeps the form and allows another try', async () => {
    vi.spyOn(db.entries, 'add').mockRejectedValue(new Error('storage full'))
    renderAt('/tabs/home/comic')
    await openAdd()
    fireEvent.change(await screen.findByLabelText('שם'), { target: { value: 'Maus' } })
    await save()

    await waitFor(() => expect(toasts()).toContain('הפעולה לא הצליחה'))
    expect(screen.getByLabelText('שם')).toHaveValue('Maus')
    await waitFor(async () => expect(await saveButton()).toHaveProperty('disabled', false))
  })

  it('says a delete failed', async () => {
    vi.spyOn(db.entries, 'delete').mockRejectedValue(new Error('storage full'))
    await db.entries.add(entry({ title: 'Gone', type: 'movie' }))
    renderAt('/tabs/home/movie')

    fireEvent.click(await screen.findByRole('button', { name: /Gone/ }))
    await pressButton('מחיקת הכותר')
    fireEvent.click(await screen.findByRole('button', { name: 'מחיקה' }))

    await waitFor(() => expect(toasts()).toContain('הפעולה לא הצליחה'))
  })
})

describe('editing a title', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 7, 21, 30).getTime())

  it('opens from its poster and saves changes', async () => {
    await db.entries.add(entry({ id: 'lost', title: 'Lost', type: 'series', status: 'stopped', stoppedSeason: 2, stopReason: 'נמרח', finishedOn: '2019' }))
    renderAt('/tabs/home/series')

    fireEvent.click(await screen.findByRole('button', { name: /Lost/ }))

    expect(await screen.findByLabelText('למה עצרתי?')).toHaveValue('נמרח')
    expect(screen.getByLabelText('שנה')).toHaveValue(2019)

    await pressButton('סיימתי')
    await save()

    await waitFor(async () => expect((await db.entries.get('lost'))?.status).toBe('finished'))
    expect((await db.entries.get('lost'))?.stopReason).toBeUndefined()
  })

  it('deletes only after confirming', async () => {
    await db.entries.add(entry({ id: 'gone', title: 'Gone', type: 'movie' }))
    renderAt('/tabs/home/movie')

    fireEvent.click(await screen.findByRole('button', { name: /Gone/ }))
    await pressButton('מחיקת הכותר')

    expect(await db.entries.count()).toBe(1)

    fireEvent.click(await screen.findByRole('button', { name: 'מחיקה' }))

    await waitFor(async () => expect(await db.entries.count()).toBe(0))
  })

  it('has no delete button while adding', async () => {
    renderAt('/tabs/home/comic')
    await openAdd()
    await screen.findByLabelText('שם')

    expect(screen.queryByRole('button', { name: 'מחיקת הכותר' })).not.toBeInTheDocument()
  })
})
