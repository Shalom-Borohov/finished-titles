import { IonButton, IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/react'
import type { ReactNode } from 'react'
import { COMMON_COPY } from '../copy/common'
import './sheet.css'

type SheetHeaderProps = {
  title: string
  onClose: () => void
  closeLabel?: string
  children?: ReactNode
}

export function SheetHeader({ title, onClose, closeLabel = COMMON_COPY.cancel, children }: SheetHeaderProps) {
  return (
    <IonHeader className="ion-no-border">
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
