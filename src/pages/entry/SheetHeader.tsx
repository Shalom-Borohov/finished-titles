import { IonButton, IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/react'
import type { ReactNode } from 'react'
import { COMMON_COPY } from '../../copy/common'

type SheetHeaderProps = {
  title: string
  onClose: () => void
  children?: ReactNode
}

export function SheetHeader({ title, onClose, children }: SheetHeaderProps) {
  return (
    <IonHeader className="ion-no-border">
      <IonToolbar>
        <IonButtons slot="start">
          <IonButton onClick={onClose}>{COMMON_COPY.cancel}</IonButton>
        </IonButtons>
        <IonTitle>{title}</IonTitle>
        {children && <IonButtons slot="end">{children}</IonButtons>}
      </IonToolbar>
    </IonHeader>
  )
}
