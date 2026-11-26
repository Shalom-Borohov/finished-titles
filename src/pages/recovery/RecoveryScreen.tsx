import { useState } from 'react'
import { useAppUpdate } from '../../appUpdate/useAppUpdate'
import { shareStoredBackup } from '../../components/backupFile'
import { COMMON_COPY } from '../../copy/common'
import { RECOVERY_COPY } from './copy'
import { RecoveryImport } from './RecoveryImport'
import { clearFailedPage, reloadAtStart } from './reloadAtStart'
import './recovery.css'

export function RecoveryScreen() {
  const [exportFailed, setExportFailed] = useState(false)
  const { updateWaiting, applyUpdate } = useAppUpdate()

  async function exportData() {
    setExportFailed(false)

    try {
      await shareStoredBackup()
    } catch {
      setExportFailed(true)
    }
  }

  function updateAtStart() {
    clearFailedPage()
    applyUpdate()
  }

  return (
    <main className="recovery">
      <h1 className="page-title">{RECOVERY_COPY.title}</h1>
      <p>{RECOVERY_COPY.explanation}</p>
      <button type="button" className="recovery-primary" onClick={() => void exportData()}>
        {COMMON_COPY.exportBackup}
      </button>
      <div role="status">{exportFailed && <p>{COMMON_COPY.actionFailed}</p>}</div>
      <RecoveryImport />
      <div role="status">{updateWaiting && <p>{COMMON_COPY.newVersionReady}</p>}</div>
      <button type="button" onClick={updateWaiting ? updateAtStart : reloadAtStart}>
        {updateWaiting ? COMMON_COPY.update : RECOVERY_COPY.reload}
      </button>
    </main>
  )
}
