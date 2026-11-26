import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { readSharedBackup, stubShare } from '../helpers/backupFile'
import {
  findRecoveryHeading,
  openRecoveryScreen,
  prepareRecoveryScreen,
  renderAppAtHome,
  soundEntry,
  untitledEntry,
} from '../helpers/recovery'

describe('a stored title that breaks a page', () => {
  prepareRecoveryScreen()

  it('shows the recovery screen instead of a blank page', async () => {
    expect(await openRecoveryScreen()).toBeVisible()
  })

  it('explains that the list can still be exported', async () => {
    await openRecoveryScreen()

    expect(screen.getByText('אי אפשר להציג את המסך. אפשר לייצא גיבוי של מה ששמור במכשיר.')).toBeVisible()
  })

  it('exports every stored title, the broken one included', async () => {
    const share = stubShare()

    await openRecoveryScreen()
    fireEvent.click(screen.getByRole('button', { name: 'ייצוא גיבוי' }))
    await waitFor(() => expect(share).toHaveBeenCalledOnce())

    expect((await readSharedBackup(share)).entries).toEqual([soundEntry, untitledEntry])
  })

  it('says so when the export fails', async () => {
    stubShare().mockRejectedValue(new Error('share failed'))

    await openRecoveryScreen()
    fireEvent.click(screen.getByRole('button', { name: 'ייצוא גיבוי' }))

    expect((await screen.findByText('הפעולה לא הצליחה')).closest('[role="status"]')).not.toBeNull()
  })

  it('never changes what is stored', async () => {
    await openRecoveryScreen()

    expect(await db.entries.toArray()).toEqual([soundEntry, untitledEntry])
  })

  it('reloads at the start, so the page that broke does not open again', async () => {
    await openRecoveryScreen()
    fireEvent.click(screen.getByRole('button', { name: 'טעינה מחדש' }))

    expect(window.location.hash).toBe('')
  })
})

describe('a list that cannot be read', () => {
  prepareRecoveryScreen()

  it('shows the recovery screen instead of a blank page', async () => {
    vi.spyOn(db.entries, 'toArray').mockRejectedValue(new Error('The database could not open'))
    renderAppAtHome()

    expect(await findRecoveryHeading()).toBeVisible()
  })
})

describe('a sound list', () => {
  prepareRecoveryScreen()

  it('does not show the recovery screen', async () => {
    await db.entries.put(soundEntry)
    renderAppAtHome()

    expect(await screen.findByRole('link', { name: /^סרטים/ })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'משהו השתבש' })).not.toBeInTheDocument()
  })
})
