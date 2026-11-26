const SEEN_VERSION_KEY = 'finished-titles:seen-version'

export const readSeenVersion = () => localStorage.getItem(SEEN_VERSION_KEY)

export function saveSeenVersion(version: string) {
  localStorage.setItem(SEEN_VERSION_KEY, version)
}
