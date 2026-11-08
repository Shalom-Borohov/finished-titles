import { IonContent, IonPage } from '@ionic/react'
import { Link } from 'react-router-dom'
import { Poster } from '../../components/Poster'
import { COMMON_COPY } from '../../copy/common'
import { MEDIA_TYPE_LABELS } from '../../copy/labels'
import { useAllEntries } from '../../data/hooks'
import { ALL_TYPES, homeTiles, type HomeTile } from '../../domain/entries'
import { listPath } from '../../navigation/paths'
import { AddTitleButton } from '../entry/AddTitleButton'
import { useEntrySheet } from '../entry/useEntrySheet'
import { HOME_COPY } from './copy'
import './home.css'

function TypeTile({ tile }: { tile: HomeTile }) {
  return (
    <Link className="type-tile" to={listPath(tile.type)}>
      <span className={`poster-fan poster-fan-${tile.posters.length}`} aria-hidden="true">
        {tile.posters.map(({ title, posterUrl }, slot) => (
          <span key={slot} className={`fan-slot fan-slot-${slot}`}>
            <Poster title={title} posterUrl={posterUrl} compact />
          </span>
        ))}
      </span>
      <span className="tile-caption">
        <span className="tile-label">{MEDIA_TYPE_LABELS[tile.type]}</span>
        <span className="tile-count">{tile.count}</span>
      </span>
    </Link>
  )
}

function OtherRow({ tile }: { tile: HomeTile }) {
  return (
    <Link className="other-row" to={listPath(tile.type)}>
      <span>{MEDIA_TYPE_LABELS[tile.type]}</span>
      <span className="tile-count">{tile.count}</span>
    </Link>
  )
}

export function HomePage() {
  const entries = useAllEntries()
  const { openAdd, sheet } = useEntrySheet(ALL_TYPES)

  return (
    <IonPage>
      <IonContent>
        <div className="page-body">
          <header className="home-header">
            <div className="home-heading">
              <h1 className="page-title">{COMMON_COPY.appName}</h1>
              {entries && (
                <Link className="home-total" to={listPath(ALL_TYPES)}>
                  {HOME_COPY.total(entries.length)}
                </Link>
              )}
            </div>
            <AddTitleButton onPress={openAdd} />
          </header>
          <Link className="home-search field" to={listPath(ALL_TYPES)}>
            {HOME_COPY.searchAll}
          </Link>
          {entries && (
            <div className="type-tiles">
              {homeTiles(entries).map((tile) =>
                tile.type === 'other' ? (
                  <OtherRow key={tile.type} tile={tile} />
                ) : (
                  <TypeTile key={tile.type} tile={tile} />
                ),
              )}
            </div>
          )}
        </div>
        {sheet}
      </IonContent>
    </IonPage>
  )
}
