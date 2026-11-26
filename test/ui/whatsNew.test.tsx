import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { saveSeenVersion } from '../../src/appUpdate/seenVersion'
import { resetDb } from '../helpers/db'
import { renderAt } from '../helpers/renderAt'

vi.mock('../../src/appUpdate/changelog', () => ({
  CHANGELOG: [
    { version: '0.1.0', features: ['רשימה ראשונה'], fixes: [] },
    { version: __APP_VERSION__, features: ['פס עדכון'], fixes: ['פוסטר שלא נטען'] },
    { version: '0.2.0', features: ['סינון לפי ז׳אנר'], fixes: [] },
  ],
}))

const OLDEST_SEEN = '0.1.0'
const SEEN_VERSION_KEY = 'finished-titles:seen-version'

const releaseCards = () =>
  Array.from(document.querySelectorAll<HTMLElement>('ion-modal section'), (card) =>
    within(card)
      .getAllByRole('heading')
      .map((heading) => heading.textContent),
  )

beforeEach(async () => {
  await resetDb()
})

describe('what’s new after an update', () => {
  it('lists the releases since the last one seen, newest first', async () => {
    saveSeenVersion(OLDEST_SEEN)
    renderAt('/tabs/home')

    expect(await screen.findByText('מה חדש')).toBeInTheDocument()
    expect(screen.getByText('פס עדכון')).toBeInTheDocument()
    expect(screen.getByText('פוסטר שלא נטען')).toBeInTheDocument()
    expect(screen.getByText('סינון לפי ז׳אנר')).toBeInTheDocument()
    expect(screen.queryByText('רשימה ראשונה')).not.toBeInTheDocument()
    expect(releaseCards()).toEqual([
      [`גרסה ${__APP_VERSION__}`, 'חדש', 'תיקונים'],
      ['גרסה 0.2.0', 'חדש'],
    ])
  })

  it('shows only once', async () => {
    saveSeenVersion(OLDEST_SEEN)
    renderAt('/tabs/home')

    fireEvent.click(await screen.findByText('סגירה'))
    await waitFor(() => expect(screen.queryByText('פס עדכון')).not.toBeInTheDocument())

    cleanup()
    renderAt('/tabs/home')

    expect(await screen.findByRole('heading', { name: 'כותרים' })).toBeInTheDocument()
    expect(screen.queryByText('מה חדש')).not.toBeInTheDocument()
    expect(localStorage.getItem(SEEN_VERSION_KEY)).toBe(__APP_VERSION__)
  })

  it('shows only the running release when no version was seen before', async () => {
    localStorage.clear()
    renderAt('/tabs/home')

    expect(await screen.findByText(`גרסה ${__APP_VERSION__}`)).toBeInTheDocument()
    expect(screen.queryByText('גרסה 0.2.0')).not.toBeInTheDocument()
    expect(screen.queryByText('גרסה 0.1.0')).not.toBeInTheDocument()
  })

  it('opens every release from the version row in settings, and leaves the seen version alone', async () => {
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: new RegExp(`^גרסה ${__APP_VERSION__.replaceAll('.', '\\.')} · עודכנה`) }))

    expect(await screen.findByText('מה חדש')).toBeInTheDocument()
    expect(releaseCards().map(([versionHeading]) => versionHeading)).toEqual([
      `גרסה ${__APP_VERSION__}`,
      'גרסה 0.2.0',
      'גרסה 0.1.0',
    ])

    localStorage.removeItem(SEEN_VERSION_KEY)
    fireEvent.click(screen.getByText('סגירה'))

    await waitFor(() => expect(screen.queryByText('פס עדכון')).not.toBeInTheDocument())
    expect(localStorage.getItem(SEEN_VERSION_KEY)).toBeNull()
  })
})
