import { IonButton, IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/react'
import { type ReactNode, useEffect, useRef } from 'react'
import { COMMON_COPY } from '../copy/common'
import './sheet.css'

const IONIC_INNER_DIALOG = '[role="dialog"]'

type SheetHeaderProps = {
  title: string
  onClose: () => void
  closeLabel?: string
  children?: ReactNode
}

export function SheetHeader({ title, onClose, closeLabel = COMMON_COPY.cancel, children }: SheetHeaderProps) {
  const header = useRef<HTMLIonHeaderElement>(null)

  useEffect(() => {
    header.current?.closest('ion-modal')?.shadowRoot?.querySelector(IONIC_INNER_DIALOG)?.setAttribute('aria-label', title)
  }, [title])

  return (
    <IonHeader ref={header} className="ion-no-border">
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton onClick={onClose}>{closeLabel}</IonButton>
        </IonButtons>
        <IonTitle>{title}</IonTitle>
        {children && <IonButtons slot="end">{children}</IonButtons>}
      </IonToolbar>
    </IonHeader>
  )
}
