import { PlusIcon } from '../../components/icons'
import { COMMON_COPY } from '../../copy/common'

export function AddTitleButton({ onPress }: { onPress: () => void }) {
  return (
    <button type="button" className="icon-button icon-button-primary" aria-label={COMMON_COPY.addTitle} onClick={onPress}>
      <PlusIcon />
    </button>
  )
}
