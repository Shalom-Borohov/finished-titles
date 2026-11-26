import { IonContent, IonPage, useIonAlert } from '@ionic/react'
import { type ChangeEvent, useRef } from 'react'
import { BACKUP_FILE_ACCEPT, backupReadFailure, readChosenBackup, shareStoredBackup } from '../../components/backupFile'
import { ImportIcon, ShareIcon } from '../../components/icons'
import { useMessageToast } from '../../components/useMessageToast'
import { COMMON_COPY } from '../../copy/common'
import { type Backup, restoreBackup } from '../../data/backup'
import { SETTINGS_COPY } from './copy'
import { FeedbackSettings } from './FeedbackSettings'
import { GenreFillSettings } from './GenreFillSettings'
import { VersionSettings } from './VersionSettings'
import './settings.css'

const TMDB_LOGO_PATH = `${import.meta.env.BASE_URL}tmdb-logo.svg`

export function SettingsPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [presentAlert] = useIonAlert()
  const toast = useMessageToast()

  async function exportData() {
    try {
      await shareStoredBackup()
    } catch {
      void toast(COMMON_COPY.actionFailed)
    }
  }

  async function restore(backup: Backup) {
    try {
      await restoreBackup(backup)
      void toast(SETTINGS_COPY.backupRestored)
    } catch {
      void toast(COMMON_COPY.actionFailed)
    }
  }

  function confirmRestore(backup: Backup) {
    presentAlert({
      header: COMMON_COPY.importBackup,
      message: COMMON_COPY.importWarning,
      buttons: [
        { text: COMMON_COPY.cancel, role: 'cancel' },
        { text: COMMON_COPY.confirmImport, role: 'destructive', handler: () => void restore(backup) },
      ],
    })
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    try {
      const backup = await readChosenBackup(event.currentTarget)

      if (backup) {
        confirmRestore(backup)
      }
    } catch (error) {
      void toast(backupReadFailure(error))
    }
  }

  return (
    <IonPage>
      <IonContent>
        <div className="page-body page-stack">
          <h1 className="page-title">{COMMON_COPY.settings}</h1>

          <section className="card">
            <h2>{SETTINGS_COPY.backup}</h2>
            <button type="button" className="settings-action" onClick={() => void exportData()}>
              <ShareIcon />
              {COMMON_COPY.exportBackup}
            </button>
            <button type="button" className="settings-action" onClick={() => fileInput.current?.click()}>
              <ImportIcon />
              {COMMON_COPY.importBackup}
            </button>
            <p className="settings-note">{SETTINGS_COPY.storageNote}</p>
          </section>

          <GenreFillSettings />

          <FeedbackSettings />

          <section className="card">
            <h2>{SETTINGS_COPY.dataSources}</h2>
            <img className="tmdb-logo" src={TMDB_LOGO_PATH} alt={SETTINGS_COPY.tmdbLogoAlt} />
            <p className="settings-note" dir="ltr">
              {SETTINGS_COPY.tmdbNotice}
            </p>
          </section>

          <VersionSettings />

          <input
            ref={fileInput}
            type="file"
            accept={BACKUP_FILE_ACCEPT}
            hidden
            aria-label={COMMON_COPY.backupFile}
            onChange={(event) => void importFile(event)}
          />
        </div>
      </IonContent>
    </IonPage>
  )
}
