import { IonContent, IonPage, useIonAlert } from '@ionic/react'
import { type ChangeEvent, useRef } from 'react'
import { ImportIcon, ShareIcon } from '../../components/icons'
import { useMessageToast } from '../../components/useMessageToast'
import { COMMON_COPY } from '../../copy/common'
import { type Backup, exportBackup, parseBackup, restoreBackup } from '../../data/backup'
import { BACKUP_FILE_ACCEPT, shareBackup } from './backupFile'
import { SETTINGS_COPY } from './copy'
import { FeedbackSettings } from './FeedbackSettings'
import './settings.css'

const TMDB_LOGO_PATH = `${import.meta.env.BASE_URL}tmdb-logo.svg`

export function SettingsPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [presentAlert] = useIonAlert()
  const toast = useMessageToast()

  async function exportData() {
    try {
      await shareBackup(await exportBackup(Date.now()))
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
      header: SETTINGS_COPY.importBackup,
      message: SETTINGS_COPY.importWarning,
      buttons: [
        { text: COMMON_COPY.cancel, role: 'cancel' },
        { text: SETTINGS_COPY.confirmImport, role: 'destructive', handler: () => void restore(backup) },
      ],
    })
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]

    input.value = ''

    if (!file) {
      return
    }

    try {
      confirmRestore(parseBackup(await file.text()))
    } catch {
      void toast(SETTINGS_COPY.invalidBackup)
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
              {SETTINGS_COPY.exportBackup}
            </button>
            <button type="button" className="settings-action" onClick={() => fileInput.current?.click()}>
              <ImportIcon />
              {SETTINGS_COPY.importBackup}
            </button>
            <p className="settings-note">{SETTINGS_COPY.storageNote}</p>
          </section>

          <FeedbackSettings />

          <section className="card">
            <h2>{SETTINGS_COPY.dataSources}</h2>
            <img className="tmdb-logo" src={TMDB_LOGO_PATH} alt={SETTINGS_COPY.tmdbLogoAlt} />
            <p className="settings-note" dir="ltr">
              {SETTINGS_COPY.tmdbNotice}
            </p>
          </section>

          <p className="settings-version">{SETTINGS_COPY.version(__APP_VERSION__)}</p>

          <input
            ref={fileInput}
            type="file"
            accept={BACKUP_FILE_ACCEPT}
            hidden
            aria-label={SETTINGS_COPY.backupFile}
            onChange={(event) => void importFile(event)}
          />
        </div>
      </IonContent>
    </IonPage>
  )
}
