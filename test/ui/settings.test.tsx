import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { alertShown, clickAlertButton } from '../helpers/overlays'
import { renderAt } from '../helpers/renderAt'

const NOW = new Date(2026, 10, 7, 9, 30).getTime()

const dune = entry({ title: 'Dune', type: 'movie', finishedOn: '2024' })

const toasts = () => Array.from(document.querySelectorAll('ion-toast'), (toast) => toast.message)

function chooseFile(text: string) {
  fireEvent.change(screen.getByLabelText('קובץ גיבוי'), {
    target: { files: [new File([text], 'backup.json', { type: 'application/json' })] },
  })
}

async function openFeedback() {
  fireEvent.click(await screen.findByRole('button', { name: 'דיווח על באג / הצעה' }))
  await screen.findByText('פתיחה ב-GitHub')
}

function describeReport(text: string) {
  fireEvent.change(screen.getByLabelText('תיאור'), { target: { value: text } })
}

async function readJson(file: Blob | undefined) {
  if (!file) {
    throw new Error('no file')
  }

  return JSON.parse(await file.text())
}

describe('settings', () => {
  beforeEach(resetDb)
  freezeDate(NOW)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('exports a backup through the share sheet', async () => {
    await db.entries.add(dune)

    const share = vi.fn<(data: ShareData) => Promise<void>>().mockResolvedValue()

    Object.assign(navigator, { share, canShare: () => true })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: 'ייצוא גיבוי' }))

    await waitFor(() => expect(share).toHaveBeenCalledOnce())

    const files = share.mock.calls[0][0].files

    expect(files?.map((file) => file.name)).toEqual(['finished-titles-backup-2026-11-07.json'])
    expect(await readJson(files?.[0])).toEqual({ version: 1, exportedAt: NOW, entries: [dune] })
  })

  it('restores a backup only after confirming', async () => {
    await db.entries.add(entry({ title: 'Old' }))
    renderAt('/tabs/settings')
    await screen.findByRole('button', { name: 'ייבוא גיבוי' })

    const shown = alertShown()

    chooseFile(JSON.stringify({ version: 1, exportedAt: NOW, entries: [dune] }))
    await shown

    expect((await db.entries.toArray()).map(({ title }) => title)).toEqual(['Old'])

    clickAlertButton('החלפת הרשימה')

    await waitFor(async () => expect((await db.entries.toArray()).map(({ title }) => title)).toEqual(['Dune']))
  })

  it('rejects an invalid backup file and keeps the list', async () => {
    await db.entries.add(dune)
    renderAt('/tabs/settings')
    await screen.findByRole('button', { name: 'ייבוא גיבוי' })

    chooseFile('{"version":1}')

    await waitFor(() => expect(toasts()).toContain('קובץ הגיבוי לא תקין'))
    expect(await db.entries.toArray()).toEqual([dune])
  })

  it('shows the notice TMDB requires', async () => {
    renderAt('/tabs/settings')

    expect(
      await screen.findByText('This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.'),
    ).toBeVisible()
    expect(screen.getByRole('img', { name: 'TMDB' })).toBeVisible()
  })

  it('shows the running version', async () => {
    renderAt('/tabs/settings')

    expect(await screen.findByText(/^גרסה \d+\.\d+\.\d+$/)).toBeVisible()
  })

  it('opens a GitHub bug report on finished-titles with the text and device details', async () => {
    const openWindow = vi.spyOn(window, 'open').mockReturnValue(null)

    renderAt('/tabs/settings')
    await openFeedback()
    describeReport('הכותר לא נשמר\nבחרתי סרט מהחיפוש')
    fireEvent.click(screen.getByText('פתיחה ב-GitHub'))

    expect(openWindow).toHaveBeenCalledOnce()

    const [url, target, features] = openWindow.mock.calls[0]
    const { origin, pathname, searchParams } = new URL(String(url))

    expect(target).toBe('_blank')
    expect(features).toBe('noopener')
    expect(`${origin}${pathname}`).toBe('https://github.com/Shalom-Borohov/finished-titles/issues/new')
    expect(searchParams.get('title')).toBe('הכותר לא נשמר')
    expect(searchParams.get('labels')).toBe('bug')
    expect(searchParams.get('body')).toBe(
      `הכותר לא נשמר\nבחרתי סרט מהחיפוש\n\n### מכשיר\n${navigator.userAgent}\nגרסה: ${__APP_VERSION__} (${__APP_BUILT_AT__})`,
    )
  })

  it('opens a suggestion with a shortened title, only once there is text', async () => {
    const openWindow = vi.spyOn(window, 'open').mockReturnValue(null)
    const idea = 'כדאי להוסיף אפשרות לסמן כותר כמתוכנן, כדי לראות ברשימה גם סדרות וספרים שעוד לא התחלתי ושכדאי לזכור'

    renderAt('/tabs/settings')
    await openFeedback()
    fireEvent.click(screen.getByRole('button', { name: 'הצעה' }))

    expect(screen.getByText('פתיחה ב-GitHub').closest('ion-button')).toHaveProperty('disabled', true)

    describeReport(idea)
    fireEvent.click(screen.getByText('פתיחה ב-GitHub'))

    const { searchParams } = new URL(String(openWindow.mock.calls[0][0]))

    expect(searchParams.get('labels')).toBe('feature')
    expect(searchParams.get('title')).toBe(`${Array.from(idea).slice(0, 79).join('')}…`)
  })

  it('after opening, offers to close and says to try again if GitHub did not open', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)

    renderAt('/tabs/settings')
    await openFeedback()

    expect(screen.getByText('ביטול')).toBeVisible()

    describeReport('הגיבוי לא נפתח')
    fireEvent.click(screen.getByText('פתיחה ב-GitHub'))

    expect(await screen.findByText('סגירה')).toBeVisible()
    expect(screen.getByText('אם GitHub לא נפתח, אפשר ללחוץ שוב או להעתיק את הטקסט.')).toBeVisible()
  })

  it('warns that a report too long for the link will be cut', async () => {
    renderAt('/tabs/settings')
    await openFeedback()

    expect(screen.queryByText(/הדיווח ארוך מדי לקישור/)).not.toBeInTheDocument()

    describeReport('כתבתי דיווח ארוך מאוד '.repeat(200))

    expect(await screen.findByText(/הדיווח ארוך מדי לקישור/)).toBeVisible()
  })
})
