import { IonContent, IonModal } from '@ionic/react'
import { SheetHeader } from '../components/SheetHeader'
import { COMMON_COPY } from '../copy/common'
import { APP_UPDATE_COPY } from './copy'
import type { Release } from './releases'
import './whatsNew.css'

type WhatsNewSheetProps = {
  isOpen: boolean
  releases: Release[]
  onClose: () => void
}

function ChangeList({ title, changes }: { title: string; changes: string[] }) {
  if (changes.length === 0) {
    return null
  }

  return (
    <div className="release-changes">
      <h3>{title}</h3>
      <ul>
        {changes.map((change) => (
          <li key={change}>{change}</li>
        ))}
      </ul>
    </div>
  )
}

export function WhatsNewSheet({ isOpen, releases, onClose }: WhatsNewSheetProps) {
  return (
    <IonModal isOpen={isOpen} backdropDismiss={false} onDidDismiss={onClose}>
      <SheetHeader title={APP_UPDATE_COPY.whatsNew} onClose={onClose} closeLabel={COMMON_COPY.close} />
      <IonContent>
        <div className="sheet-body">
          {releases.map((release) => (
            <section key={release.version} className="card">
              <h2>{APP_UPDATE_COPY.releaseTitle(release.version)}</h2>
              <ChangeList title={APP_UPDATE_COPY.features} changes={release.features} />
              <ChangeList title={APP_UPDATE_COPY.fixes} changes={release.fixes} />
            </section>
          ))}
        </div>
      </IonContent>
    </IonModal>
  )
}
