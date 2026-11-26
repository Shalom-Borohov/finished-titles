import { fireEvent, screen } from '@testing-library/react'
import { type Mock, vi } from 'vitest'

type ShareStub = Mock<(data: ShareData) => Promise<void>>

export function chooseBackupFile(text: string) {
  fireEvent.change(screen.getByLabelText('קובץ גיבוי'), {
    target: { files: [new File([text], 'backup.json', { type: 'application/json' })] },
  })
}

export function stubShare(): ShareStub {
  const share = vi.fn<(data: ShareData) => Promise<void>>().mockResolvedValue()

  Object.assign(navigator, { share, canShare: () => true })

  return share
}

export async function readSharedBackup(share: ShareStub) {
  const file = share.mock.calls[0][0].files?.[0]

  if (!file) {
    throw new Error('nothing was shared')
  }

  return JSON.parse(await file.text())
}
