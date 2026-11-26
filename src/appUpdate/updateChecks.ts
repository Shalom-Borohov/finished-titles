export const UPDATE_CHECK_MS = 60 * 60_000

const HTTP_OK = 200

interface UpdatableRegistration {
  readonly installing: object | null
  update(): Promise<object>
}

async function checkNow(swUrl: string, registration: UpdatableRegistration) {
  if (registration.installing || !navigator.onLine) {
    return
  }

  const response = await fetch(swUrl, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } })

  if (response.status === HTTP_OK) {
    await registration.update()
  }
}

export function checkForUpdates(swUrl: string, registration: UpdatableRegistration): () => void {
  const check = () => void checkNow(swUrl, registration).catch(() => {})

  function checkWhenVisible() {
    if (document.visibilityState === 'visible') {
      check()
    }
  }

  check()
  const timer = setInterval(check, UPDATE_CHECK_MS)
  document.addEventListener('visibilitychange', checkWhenVisible)

  return () => {
    clearInterval(timer)
    document.removeEventListener('visibilitychange', checkWhenVisible)
  }
}
