import { useIonToast } from '@ionic/react'

const TOAST_DURATION_MS = 2500

export function useMessageToast() {
  const [presentToast] = useIonToast()

  return (message: string) => presentToast({ message, duration: TOAST_DURATION_MS, position: 'top' })
}
