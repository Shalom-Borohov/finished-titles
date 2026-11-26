import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDb } from '../helpers/db'
import { pwa } from '../helpers/pwaStub'
import { renderAt } from '../helpers/renderAt'
import { setVisibility } from '../helpers/visibility'

vi.mock('virtual:pwa-register/react', () => import('../helpers/pwaStub'))

beforeEach(async () => {
  await resetDb()
  pwa.needRefresh = true
  pwa.updateServiceWorker.mockClear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('a new version of the app', () => {
  it.each(['/tabs/home', '/tabs/home/movie', '/tabs/stats', '/tabs/settings'])('is offered on %s', async (path) => {
    renderAt(path)

    expect(await screen.findByRole('button', { name: 'עדכון' })).toBeInTheDocument()
  })

  it('updates when עדכון is tapped', async () => {
    renderAt('/tabs/home')

    fireEvent.click(await screen.findByRole('button', { name: 'עדכון' }))

    expect(pwa.updateServiceWorker).toHaveBeenCalledTimes(1)
  })

  it('can be put off until the app comes back to the foreground', async () => {
    renderAt('/tabs/home')

    fireEvent.click(await screen.findByRole('button', { name: 'לא עכשיו' }))
    await waitFor(() => expect(screen.queryByText('גרסה חדשה זמינה')).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'עדכון' })).not.toBeInTheDocument()

    setVisibility('visible')

    expect(await screen.findByRole('button', { name: 'עדכון' })).toBeInTheDocument()
  })

  it('leaves instead of vanishing when put off, without catching taps on the way out', async () => {
    renderAt('/tabs/home')

    const update = await screen.findByRole('button', { name: 'עדכון' })

    fireEvent.click(screen.getByRole('button', { name: 'לא עכשיו' }))

    expect(update).toBeInTheDocument()
    expect(update.closest('.update-bar')).toHaveAttribute('inert')
    expect(document.querySelector('p[role="status"]')).toBeEmptyDOMElement()
    await waitFor(() => expect(update).not.toBeInTheDocument())
  })

  it('is not offered while no new version waits', async () => {
    pwa.needRefresh = false
    renderAt('/tabs/stats')

    expect(await screen.findByRole('heading', { name: 'סטטיסטיקה' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'עדכון' })).not.toBeInTheDocument()
    expect(screen.queryByText('גרסה חדשה זמינה')).not.toBeInTheDocument()
  })

  it('is announced to VoiceOver', async () => {
    renderAt('/tabs/home')

    expect(await screen.findByText('גרסה חדשה זמינה', { selector: '[role="status"]' })).toBeInTheDocument()
  })

  it('keeps an empty VoiceOver status line ready while no new version waits', async () => {
    pwa.needRefresh = false
    renderAt('/tabs/home')

    expect(await screen.findByRole('heading', { name: 'כותרים' })).toBeInTheDocument()
    expect(document.querySelector('[role="status"]')).toBeEmptyDOMElement()
  })

  it('makes room at the bottom of the pages only while it shows', async () => {
    renderAt('/tabs/home')

    await waitFor(() => expect(document.querySelector('ion-tabs')).toHaveClass('update-bar-shown'))

    fireEvent.click(await screen.findByRole('button', { name: 'לא עכשיו' }))

    await waitFor(() => expect(document.querySelector('ion-tabs')).not.toHaveClass('update-bar-shown'))
  })
})
