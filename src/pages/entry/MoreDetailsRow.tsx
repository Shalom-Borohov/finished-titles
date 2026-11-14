import type { Ref } from 'react'
import { ForwardChevronIcon } from '../../components/icons'
import { ENTRY_COPY } from './copy'

type MoreDetailsRowProps = {
  ref: Ref<HTMLButtonElement>
  onOpen: () => void
}

export function MoreDetailsRow({ ref, onOpen }: MoreDetailsRowProps) {
  return (
    <button ref={ref} type="button" className="more-details-row" onClick={onOpen}>
      <span>{ENTRY_COPY.moreDetails}</span>
      <ForwardChevronIcon />
    </button>
  )
}
