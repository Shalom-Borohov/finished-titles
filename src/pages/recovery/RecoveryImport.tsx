import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import { BACKUP_FILE_ACCEPT, backupReadFailure, readChosenBackup } from '../../components/backupFile'
import { COMMON_COPY } from '../../copy/common'
import { type Backup, restoreBackup } from '../../data/backup'
import { reloadAtStart } from './reloadAtStart'

export function RecoveryImport() {
  const fileInput = useRef<HTMLInputElement>(null)
  const importButton = useRef<HTMLButtonElement>(null)
  const cancelButton = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)
  const [pending, setPending] = useState<Backup | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    if (pending) {
      cancelButton.current?.focus()
    } else if (wasConfirming.current) {
      importButton.current?.focus()
    }

    wasConfirming.current = pending !== null
  }, [pending])

  async function replaceList(backup: Backup) {
    setFailure(null)
    setRestoring(true)

    try {
      await restoreBackup(backup)
    } catch {
      setFailure(COMMON_COPY.actionFailed)
      setRestoring(false)

      return
    }

    reloadAtStart()
  }

  function cancelImport() {
    setFailure(null)
    setPending(null)
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    try {
      const backup = await readChosenBackup(event.currentTarget)

      if (backup) {
        setFailure(null)
        setPending(backup)
      }
    } catch (error) {
      setFailure(backupReadFailure(error))
    }
  }

  return (
    <>
      {!pending && (
        <button ref={importButton} type="button" onClick={() => fileInput.current?.click()}>
          {COMMON_COPY.importBackup}
        </button>
      )}
      <div role="status">
        {pending && <p>{COMMON_COPY.importWarning}</p>}
        {failure && <p>{failure}</p>}
      </div>
      {pending && (
        <>
          <button
            type="button"
            className="recovery-destructive"
            disabled={restoring}
            onClick={() => void replaceList(pending)}
          >
            {COMMON_COPY.confirmImport}
          </button>
          <button ref={cancelButton} type="button" disabled={restoring} onClick={cancelImport}>
            {COMMON_COPY.cancel}
          </button>
        </>
      )}
      <input
        ref={fileInput}
        type="file"
        accept={BACKUP_FILE_ACCEPT}
        hidden
        aria-label={COMMON_COPY.backupFile}
        onChange={(event) => void readFile(event)}
      />
    </>
  )
}
