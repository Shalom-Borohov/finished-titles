import { IonButton, IonContent, IonModal } from '@ionic/react'
import { useState } from 'react'
import { Segmented, TextAreaField } from '../../components/formFields'
import { ChatIcon } from '../../components/icons'
import { SheetHeader } from '../../components/SheetHeader'
import { COMMON_COPY } from '../../copy/common'
import { SETTINGS_COPY } from './copy'
import { FEEDBACK_KINDS, type FeedbackKind, feedbackLink } from './feedbackUrl'

const KIND_LABELS: Record<FeedbackKind, string> = { bug: SETTINGS_COPY.bug, idea: SETTINGS_COPY.idea }

const PLACEHOLDERS: Record<FeedbackKind, string> = {
  bug: SETTINGS_COPY.bugPlaceholder,
  idea: SETTINGS_COPY.ideaPlaceholder,
}

function FeedbackForm({ onClose }: { onClose: () => void }) {
  const [kind, setKind] = useState<FeedbackKind>('bug')
  const [text, setText] = useState('')
  const [hasOpened, setHasOpened] = useState(false)
  const { url, isCut } = feedbackLink(kind, text)

  function openInGitHub() {
    window.open(url, '_blank', 'noopener')
    setHasOpened(true)
  }

  return (
    <>
      <SheetHeader
        title={SETTINGS_COPY.report}
        onClose={onClose}
        closeLabel={hasOpened ? COMMON_COPY.close : COMMON_COPY.cancel}
      />
      <IonContent>
        <div className="sheet-body">
          <Segmented
            label={SETTINGS_COPY.report}
            options={FEEDBACK_KINDS}
            labels={KIND_LABELS}
            selected={kind}
            onSelect={setKind}
          />
          <TextAreaField label={SETTINGS_COPY.description} text={text} placeholder={PLACEHOLDERS[kind]} onChange={setText} />
          <div className="feedback-notes" role="status">
            <p>{SETTINGS_COPY.feedbackFooter}</p>
            {isCut && <p>{SETTINGS_COPY.feedbackTooLong}</p>}
            {hasOpened && <p>{SETTINGS_COPY.feedbackOpened}</p>}
          </div>
          <IonButton expand="block" shape="round" fill="solid" disabled={text.trim() === ''} onClick={openInGitHub}>
            {SETTINGS_COPY.openInGitHub}
          </IonButton>
        </div>
      </IonContent>
    </>
  )
}

export function FeedbackSettings() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section className="card">
      <h2>{SETTINGS_COPY.feedback}</h2>
      <button type="button" className="settings-action" onClick={() => setIsOpen(true)}>
        <ChatIcon />
        {SETTINGS_COPY.reportBugOrIdea}
      </button>
      <IonModal isOpen={isOpen} backdropDismiss={false} onDidDismiss={() => setIsOpen(false)}>
        <FeedbackForm onClose={() => setIsOpen(false)} />
      </IonModal>
    </section>
  )
}
