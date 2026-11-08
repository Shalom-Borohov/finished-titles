import { IonContent, IonPage, useIonRouter } from '@ionic/react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BackChevronIcon } from '../../components/icons'
import { Poster } from '../../components/Poster'
import { COMMON_COPY } from '../../copy/common'
import { MEDIA_TYPE_LABELS } from '../../copy/labels'
import { useAllEntries } from '../../data/hooks'
import {
  ALL_STATUSES,
  ALL_TYPES,
  filterEntries,
  sortNewestFirst,
  type StatusFilter,
  type TypeFilter,
  verdictLabel,
} from '../../domain/entries'
import { type Entry, isMediaType, type Status } from '../../domain/types'
import { HOME_PATH } from '../../navigation/paths'
import { AddTitleButton } from '../entry/AddTitleButton'
import { useEntrySheet } from '../entry/useEntrySheet'
import { LIST_COPY } from './copy'
import './list.css'

function TitleCard({ entry, onOpen }: { entry: Entry; onOpen: () => void }) {
  const verdict = verdictLabel(entry)

  return (
    <button type="button" className="title-card" onClick={onOpen}>
      <Poster title={entry.title} posterUrl={entry.posterUrl} dimmed={entry.status === 'stopped'} />
      <span className="title-card-title" dir="ltr">
        {entry.title}
      </span>
      {verdict && <span className="title-card-verdict">{verdict}</span>}
    </button>
  )
}

function TitleList({ type, label }: { type: TypeFilter; label: string }) {
  const [status, setStatus] = useState<StatusFilter>(ALL_STATUSES)
  const [query, setQuery] = useState('')
  const entries = useAllEntries()
  const { openAdd, openEdit, sheet } = useEntrySheet(type)
  const router = useIonRouter()
  const ofType = filterEntries(entries ?? [], { type, status: ALL_STATUSES, query: '' })
  const shown = sortNewestFirst(filterEntries(ofType, { type, status, query }))
  const countOf = (counted: Status) => ofType.filter((entry) => entry.status === counted).length

  const statusPills: { filter: StatusFilter; text: string }[] = [
    { filter: ALL_STATUSES, text: LIST_COPY.all },
    { filter: 'finished', text: LIST_COPY.finished(countOf('finished')) },
    { filter: 'stopped', text: LIST_COPY.stopped(countOf('stopped')) },
  ]

  return (
    <IonPage>
      <IonContent>
        <div className="page-body">
          <header className="list-nav">
            <Link
              className="icon-button"
              to={HOME_PATH}
              aria-label={LIST_COPY.backHome}
              onClick={(event) => {
                event.preventDefault()
                router.push(HOME_PATH, 'back', 'pop')
              }}
            >
              <BackChevronIcon />
            </Link>
            <AddTitleButton onPress={openAdd} />
          </header>
          <div className="list-heading">
            <h1 className="page-title">{label}</h1>
            <span>{COMMON_COPY.titleCount(ofType.length)}</span>
          </div>
          <label>
            <span className="visually-hidden">{LIST_COPY.search}</span>
            <input
              className="field"
              type="search"
              placeholder={LIST_COPY.search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="status-pills" role="group" aria-label={LIST_COPY.statusFilter}>
            {statusPills.map(({ filter, text }) => (
              <button
                key={filter}
                type="button"
                className="pill"
                aria-pressed={status === filter}
                onClick={() => setStatus(filter)}
              >
                {text}
              </button>
            ))}
          </div>
          {entries && ofType.length === 0 && <p className="list-empty">{LIST_COPY.emptyType}</p>}
          {ofType.length > 0 && shown.length === 0 && <p className="list-empty">{LIST_COPY.noMatches}</p>}
          <div className="title-grid">
            {shown.map((entry) => (
              <TitleCard key={entry.id} entry={entry} onOpen={() => openEdit(entry)} />
            ))}
          </div>
        </div>
        {sheet}
      </IonContent>
    </IonPage>
  )
}

export function ListPage() {
  const { type } = useParams()

  if (type === ALL_TYPES) {
    return <TitleList type={ALL_TYPES} label={LIST_COPY.allTitles} />
  }

  if (isMediaType(type)) {
    return <TitleList key={type} type={type} label={MEDIA_TYPE_LABELS[type]} />
  }

  return <Navigate to={HOME_PATH} replace />
}
