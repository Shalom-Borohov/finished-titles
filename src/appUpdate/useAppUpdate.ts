import { useRegisterSW } from 'virtual:pwa-register/react'
import { checkForUpdates } from './updateChecks'

let stopEarlierChecks = () => {}

export function useAppUpdate() {
  const {
    needRefresh: [updateWaiting],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        stopEarlierChecks()
        stopEarlierChecks = checkForUpdates(swUrl, registration)
      }
    },
  })

  return { updateWaiting, applyUpdate: () => void updateServiceWorker() }
}
