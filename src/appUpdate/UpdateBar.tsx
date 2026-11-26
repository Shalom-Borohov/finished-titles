import { CloseIcon } from '../components/icons'
import { COMMON_COPY } from '../copy/common'
import { APP_UPDATE_COPY } from './copy'
import './updateBar.css'

export const UPDATE_BAR_SHOWN_CLASS = 'update-bar-shown'

type UpdateBarProps = {
  shown: boolean
  leaving: boolean
  dismiss: () => void
  applyUpdate: () => void
}

export function UpdateBar({ shown, leaving, dismiss, applyUpdate }: UpdateBarProps) {
  return (
    <>
      <p slot="bottom" role="status" className="visually-hidden">
        {shown && !leaving && COMMON_COPY.newVersionReady}
      </p>
      {shown && (
        <div slot="bottom" className={leaving ? 'update-bar update-bar-leaving' : 'update-bar'} inert={leaving}>
          <button
            type="button"
            className="update-bar-dismiss"
            aria-label={APP_UPDATE_COPY.dismissUpdate}
            onClick={dismiss}
          >
            <CloseIcon />
          </button>
          <span className="update-bar-label">{COMMON_COPY.newVersionReady}</span>
          <button type="button" className="update-bar-update" onClick={applyUpdate}>
            {COMMON_COPY.update}
          </button>
        </div>
      )}
    </>
  )
}
