import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pwa } from '../helpers/pwaStub'
import { openRecoveryScreen, prepareRecoveryScreen } from '../helpers/recovery'

vi.mock('virtual:pwa-register/react', () => import('../helpers/pwaStub'))

describe('the recovery screen with a new version', () => {
  prepareRecoveryScreen()

  beforeEach(() => {
    pwa.needRefresh = true
    pwa.updateServiceWorker.mockClear()
  })

  it('offers the update in place of a reload while one is waiting', async () => {
    await openRecoveryScreen()

    expect(screen.getByText('גרסה חדשה זמינה').closest('[role="status"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'עדכון' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'טעינה מחדש' })).not.toBeInTheDocument()
  })

  it('applies the update and opens it at the start', async () => {
    await openRecoveryScreen()
    fireEvent.click(screen.getByRole('button', { name: 'עדכון' }))

    await waitFor(() => expect(pwa.updateServiceWorker).toHaveBeenCalledOnce())
    expect(window.location.hash).toBe('')
  })

  it('offers only a reload while nothing is waiting', async () => {
    pwa.needRefresh = false
    await openRecoveryScreen()

    expect(screen.getByRole('button', { name: 'טעינה מחדש' })).toBeVisible()
    expect(screen.queryByText('גרסה חדשה זמינה')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'עדכון' })).not.toBeInTheDocument()
  })
})
