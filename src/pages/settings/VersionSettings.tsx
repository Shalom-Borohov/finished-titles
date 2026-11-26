import { useState } from 'react'
import { CHANGELOG } from '../../appUpdate/changelog'
import { newestFirst } from '../../appUpdate/releases'
import { WhatsNewSheet } from '../../appUpdate/WhatsNewSheet'
import { ForwardChevronIcon } from '../../components/icons'
import { SETTINGS_COPY } from './copy'

const ALL_RELEASES = newestFirst(CHANGELOG)

export function VersionSettings() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button type="button" className="version-row" onClick={() => setIsOpen(true)}>
        <span>{SETTINGS_COPY.version(__APP_VERSION__, __APP_BUILT_AT__)}</span>
        <ForwardChevronIcon />
      </button>
      <WhatsNewSheet isOpen={isOpen} releases={ALL_RELEASES} onClose={() => setIsOpen(false)} />
    </>
  )
}
