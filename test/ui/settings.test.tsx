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
})
