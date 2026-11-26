import { fireEvent, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { chooseBackupFile } from '../helpers/backupFile'
import { entry } from '../helpers/entries'
import { openRecoveryScreen, prepareRecoveryScreen, soundEntry, untitledEntry } from '../helpers/recovery'

const WARNING = 'הגיבוי יחליף את כל הרשימה הנוכחית. אי אפשר לבטל את זה.'

const BACKUP_EXPORTED_AT = new Date(2026, 9, 30, 8, 0).getTime()

const restoredEntry = entry({ title: 'Arrival', finishedOn: '2023' })

const validBackup = JSON.stringify({ version: 1, exportedAt: BACKUP_EXPORTED_AT, entries: [restoredEntry] })

async function confirmWithFailingWrite() {
  await openRecoveryScreen()
  chooseBackupFile(validBackup)

  const confirm = await screen.findByRole('button', { name: 'החלפת הרשימה' })

  vi.spyOn(db.entries, 'bulkPut').mockRejectedValue(new Error('Connection lost'))
  fireEvent.click(confirm)

  return confirm
}

describe('importing a backup from the recovery screen', () => {
  prepareRecoveryScreen()

  it('says so when the file is not a valid backup, and keeps the list', async () => {
    await openRecoveryScreen()
    chooseBackupFile('{"version":1}')

    expect((await screen.findByText('קובץ הגיבוי לא תקין')).closest('[role="status"]')).not.toBeNull()
    expect(await db.entries.toArray()).toEqual([soundEntry, untitledEntry])
  })

  it('says a backup from a newer version needs an update, and keeps the list', async () => {
    await openRecoveryScreen()
    chooseBackupFile(JSON.stringify({ version: 4, exportedAt: BACKUP_EXPORTED_AT, entries: [] }))

    const newerLine = await screen.findByText('הגיבוי מגרסה חדשה יותר של האפליקציה. צריך לעדכן אותה ולנסות שוב.')

    expect(newerLine.closest('[role="status"]')).not.toBeNull()
    expect(await db.entries.toArray()).toEqual([soundEntry, untitledEntry])
  })

  it('drops the invalid file line once a valid file is picked', async () => {
    await openRecoveryScreen()
    chooseBackupFile('{"version":1}')
    await screen.findByText('קובץ הגיבוי לא תקין')
    chooseBackupFile(validBackup)

    expect(await screen.findByText(WARNING)).toBeVisible()
    expect(screen.queryByText('קובץ הגיבוי לא תקין')).not.toBeInTheDocument()
  })

  it('warns about a valid file, moves focus to cancel and changes nothing yet', async () => {
    await openRecoveryScreen()
    chooseBackupFile(validBackup)

    expect((await screen.findByText(WARNING)).closest('[role="status"]')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'החלפת הרשימה' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'ביטול' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'ייבוא גיבוי' })).not.toBeInTheDocument()
    expect(await db.entries.toArray()).toEqual([soundEntry, untitledEntry])
  })

  it('replaces the list and opens at the start once confirmed', async () => {
    await openRecoveryScreen()
    chooseBackupFile(validBackup)
    fireEvent.click(await screen.findByRole('button', { name: 'החלפת הרשימה' }))

    await waitFor(() => expect(window.location.hash).toBe(''))
    expect(await db.entries.toArray()).toEqual([restoredEntry])
  })

  it('disables both buttons while the list is replaced, so it is written once', async () => {
    await openRecoveryScreen()
    chooseBackupFile(validBackup)

    const confirm = await screen.findByRole('button', { name: 'החלפת הרשימה' })
    const cancel = screen.getByRole('button', { name: 'ביטול' })
    const write = vi.spyOn(db.entries, 'bulkPut')

    fireEvent.click(confirm)

    expect(confirm).toBeDisabled()
    expect(cancel).toBeDisabled()

    fireEvent.click(confirm)
    await waitFor(() => expect(window.location.hash).toBe(''))

    expect(write).toHaveBeenCalledOnce()
  })

  it('keeps the list, says so and offers both buttons again when the write fails', async () => {
    const confirm = await confirmWithFailingWrite()

    expect((await screen.findByText('הפעולה לא הצליחה')).closest('[role="status"]')).not.toBeNull()
    expect(confirm).toBeEnabled()
    expect(screen.getByRole('button', { name: 'ביטול' })).toBeEnabled()
    expect(await db.entries.toArray()).toEqual([soundEntry, untitledEntry])
    expect(window.location.hash).not.toBe('')
  })

  it('goes back to the import button and drops the failure line when cancelled', async () => {
    await confirmWithFailingWrite()
    await screen.findByText('הפעולה לא הצליחה')
    fireEvent.click(screen.getByRole('button', { name: 'ביטול' }))

    expect(await screen.findByRole('button', { name: 'ייבוא גיבוי' })).toHaveFocus()
    expect(screen.queryByText(WARNING)).not.toBeInTheDocument()
    expect(screen.queryByText('הפעולה לא הצליחה')).not.toBeInTheDocument()
    expect(await db.entries.toArray()).toEqual([soundEntry, untitledEntry])
  })
})
