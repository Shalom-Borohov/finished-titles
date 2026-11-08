import type { Backup } from '../../data/backup'
import { toIsoDate } from '../../domain/finishDate'

const BACKUP_FILE_PREFIX = 'finished-titles-backup-'

const BACKUP_EXTENSION = '.json'

const BACKUP_MIME_TYPE = 'application/json'

const SHARE_CANCELLED_ERROR = 'AbortError'

const DOWNLOAD_URL_LIFETIME_MS = 60_000

export const BACKUP_FILE_ACCEPT = [BACKUP_MIME_TYPE, BACKUP_EXTENSION].join(',')

async function shareFile(file: File) {
  try {
    await navigator.share({ files: [file] })
  } catch (error) {
    if (!(error instanceof DOMException && error.name === SHARE_CANCELLED_ERROR)) {
      throw error
    }
  }
}

export async function shareBackup(backup: Backup) {
  const fileName = `${BACKUP_FILE_PREFIX}${toIsoDate(new Date(backup.exportedAt))}${BACKUP_EXTENSION}`
  const file = new File([JSON.stringify(backup)], fileName, { type: BACKUP_MIME_TYPE })

  if (navigator.canShare?.({ files: [file] })) {
    await shareFile(file)

    return
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')

  link.href = url
  link.download = file.name
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS)
}
