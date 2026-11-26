import { useState } from 'react'
import { CHANGELOG } from './changelog'
import { unseenReleases } from './releases'
import { readSeenVersion, saveSeenVersion } from './seenVersion'

export function useWhatsNew() {
  const [releases] = useState(() => unseenReleases(CHANGELOG, readSeenVersion(), __APP_VERSION__))
  const [closed, setClosed] = useState(false)

  function onClose() {
    saveSeenVersion(__APP_VERSION__)
    setClosed(true)
  }

  return { releases, isOpen: releases.length > 0 && !closed, onClose }
}
