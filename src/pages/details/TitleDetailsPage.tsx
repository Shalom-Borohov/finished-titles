import { IonContent } from '@ionic/react'
import { useEffect, useRef } from 'react'
import { BackChevronIcon } from '../../components/icons'
import { Poster } from '../../components/Poster'
import { YearRange } from '../../components/YearRange'
import { COMMON_COPY } from '../../copy/common'
import { genreLabel } from '../../copy/genres'
import { MEDIA_TYPE_SINGULAR_LABELS } from '../../copy/labels'
import { type Entry, isShowType } from '../../domain/types'
import { isTmdbShowId, type TitleDetails } from '../../search/client'
import { DETAILS_COPY } from './copy'
import { type DetailsPanel, detailsPanels } from './detailsPanels'
import { useTitleDetails } from './useTitleDetails'
import './titleDetails.css'

export type TitleIdentity = Pick<Entry, 'title' | 'type' | 'posterUrl' | 'releaseYear' | 'endYear'>

type TitleDetailsPageProps = {
  titleId: string
  identity: TitleIdentity
  backLabel: string
  onBack: () => void
}

function IdentityBlock({ identity, originalTitle }: { identity: TitleIdentity; originalTitle?: string }) {
  return (
    <div className="details-identity">
      <div className="details-poster">
        <Poster title={identity.title} posterUrl={identity.posterUrl} compact />
      </div>
      <div className="details-names">
        <h2 className="details-title" dir="auto">
          {identity.title}
        </h2>
        <p className="details-meta">
          {MEDIA_TYPE_SINGULAR_LABELS[identity.type]}
          {identity.releaseYear ? COMMON_COPY.separator : null}
          <YearRange
            releaseYear={identity.releaseYear}
            endYear={isShowType(identity.type) ? identity.endYear : undefined}
          />
        </p>
        {originalTitle && originalTitle !== identity.title && (
          <p className="details-original" dir="auto">
            {originalTitle}
          </p>
        )}
      </div>
    </div>
  )
}

function Panel({ title, rows, caption }: DetailsPanel) {
  return (
    <section className="card details-panel">
      <h3>{title}</h3>
      <dl>
        {rows.map(({ label, value }) => (
          <div key={label} className="details-row">
            <dt>{label}</dt>
            <dd dir="auto">{value}</dd>
          </div>
        ))}
      </dl>
      {caption && <p className="details-caption">{caption}</p>}
    </section>
  )
}

function LoadedDetails({ details, isShow }: { details: TitleDetails; isShow: boolean }) {
  const panels = detailsPanels(details, isShow)

  if (panels.length === 0 && details.genres.length === 0) {
    return <p className="details-status">{DETAILS_COPY.nothingToShow}</p>
  }

  return (
    <>
      {panels.map((panel) => (
        <Panel key={panel.title} {...panel} />
      ))}
      {details.genres.length > 0 && (
        <section className="card details-panel">
          <h3>{DETAILS_COPY.genres}</h3>
          <ul className="details-genres">
            {details.genres.map((genre) => (
              <li key={genre.id}>{genreLabel(genre)}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

export function TitleDetailsPage({ titleId, identity, backLabel, onBack }: TitleDetailsPageProps) {
  const { state, retry } = useTitleDetails(titleId)
  const backButton = useRef<HTMLButtonElement>(null)

  useEffect(() => backButton.current?.focus(), [])

  return (
    <div className="ion-page title-details">
      <header className="details-header">
        <button ref={backButton} type="button" className="details-back" onClick={onBack}>
          <BackChevronIcon />
          <span>{backLabel}</span>
        </button>
        <h1>{DETAILS_COPY.title}</h1>
      </header>
      <IonContent>
        <div className="sheet-body">
          <IdentityBlock
            identity={identity}
            originalTitle={state.kind === 'loaded' ? state.details.originalTitle : undefined}
          />
          {state.kind === 'loading' && <p className="details-status">{DETAILS_COPY.loading}</p>}
          {state.kind === 'failed' && (
            <div className="details-status">
              <p>{DETAILS_COPY.unavailable}</p>
              <button type="button" className="details-retry" onClick={retry}>
                {DETAILS_COPY.retry}
              </button>
            </div>
          )}
          {state.kind === 'loaded' && <LoadedDetails details={state.details} isShow={isTmdbShowId(titleId)} />}
        </div>
      </IonContent>
    </div>
  )
}
