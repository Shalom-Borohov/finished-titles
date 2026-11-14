import { IonButton, IonContent, useIonAlert } from '@ionic/react'
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Segmented, TextAreaField } from '../../components/formFields'
import { SheetHeader } from '../../components/SheetHeader'
import { useMessageToast } from '../../components/useMessageToast'
import { COMMON_COPY } from '../../copy/common'
import { STATUS_LABELS } from '../../copy/labels'
import { useAllEntries } from '../../data/hooks'
import { addEntry, deleteEntry, updateEntry } from '../../data/repo'
import { findExisting } from '../../domain/entries'
import { todayIso } from '../../domain/finishDate'
import { type Entry, isShowType, STATUSES } from '../../domain/types'
import { tmdbTitleId } from '../../search/client'
import { TitleDetailsPage } from '../details/TitleDetailsPage'
import { ENTRY_COPY } from './copy'
import { DateFields, RatingPills, SeasonStepper } from './formFields'
import { FormIdentity } from './FormIdentity'
import { dateProblem, draftFromForm, type EntryFormState } from './formState'
import { MoreDetailsRow } from './MoreDetailsRow'
import { useShowPrefill } from './useShowPrefill'
import './entryForm.css'

type EntryFormProps = {
  initial: EntryFormState
  editing?: Entry
  seasonsTvId?: string
  onOpenExisting: (entry: Entry) => void
  onClose: () => void
}

export function EntryForm({ initial, editing, seasonsTvId, onOpenExisting, onClose }: EntryFormProps) {
  const [form, setForm] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)
  const [showingDetails, setShowingDetails] = useState(false)
  const moreDetailsRow = useRef<HTMLButtonElement>(null)
  const [presentAlert] = useIonAlert()
  const toast = useMessageToast()
  const entries = useAllEntries()
  const [today] = useState(todayIso)
  const change = (changes: Partial<EntryFormState>) => setForm((current) => ({ ...current, ...changes }))
  const isStopped = form.status === 'stopped'
  const isShow = isShowType(form.type)
  const problem = dateProblem(form, today)
  const hasTitle = form.title.trim() !== ''
  const duplicate = !editing && !isSaving && hasTitle ? findExisting(entries ?? [], form) : undefined
  const detailsTitleId = tmdbTitleId(form)
  const sheetTitle = editing ? ENTRY_COPY.editTitle : COMMON_COPY.addTitle

  useShowPrefill(seasonsTvId, ({ seasons, endYear }) =>
    setForm((current) => ({
      ...current,
      seasons: current.seasons === undefined && seasons > 0 ? seasons : current.seasons,
      endYear: endYear ?? current.endYear,
    })),
  )

  async function save() {
    const draft = draftFromForm(form)

    setIsSaving(true)

    try {
      await (editing ? updateEntry({ ...editing, ...draft }) : addEntry(draft, Date.now()))
      onClose()
    } catch {
      setIsSaving(false)
      void toast(COMMON_COPY.actionFailed)
    }
  }

  function closeDetails() {
    flushSync(() => setShowingDetails(false))
    moreDetailsRow.current?.focus()
  }

  function confirmDelete(entry: Entry) {
    presentAlert({
      header: ENTRY_COPY.deleteQuestion,
      message: ENTRY_COPY.deleteWarning,
      buttons: [
        { text: COMMON_COPY.cancel, role: 'cancel' },
        {
          text: ENTRY_COPY.deleteConfirm,
          role: 'destructive',
          handler: () => void deleteEntry(entry.id).then(onClose, () => toast(COMMON_COPY.actionFailed)),
        },
      ],
    })
  }

  return (
    <>
      <div className="ion-page" inert={showingDetails}>
        <SheetHeader title={sheetTitle} onClose={onClose}>
          <IonButton
            className="save-button"
            fill="solid"
            shape="round"
            disabled={!hasTitle || Boolean(problem) || isSaving}
            onClick={() => void save()}
          >
            {ENTRY_COPY.save}
          </IonButton>
        </SheetHeader>
        <IonContent>
          <form className="sheet-body" onSubmit={(event) => event.preventDefault()}>
            <FormIdentity form={form} onChange={change} />

            {detailsTitleId && <MoreDetailsRow ref={moreDetailsRow} onOpen={() => setShowingDetails(true)} />}

            {duplicate && (
              <p className="duplicate-hint">
                {ENTRY_COPY.duplicateTitle}
                <button type="button" onClick={() => onOpenExisting(duplicate)}>
                  {ENTRY_COPY.openExisting}
                </button>
              </p>
            )}

            <Segmented
              label={ENTRY_COPY.statusField}
              options={STATUSES}
              labels={STATUS_LABELS}
              selected={form.status}
              onSelect={(status) => change({ status })}
            />

            {isStopped && isShow && (
              <SeasonStepper
                label={ENTRY_COPY.stoppedAtSeason}
                season={form.stoppedSeason}
                onChange={(stoppedSeason) => change({ stoppedSeason })}
              />
            )}

            {isStopped && (
              <TextAreaField
                label={ENTRY_COPY.whyStopped}
                text={form.stopReason}
                onChange={(stopReason) => change({ stopReason })}
              />
            )}

            <RatingPills
              legend={isStopped ? ENTRY_COPY.howWasItUntilThen : ENTRY_COPY.howWasIt}
              selected={form.rating}
              onSelect={(rating) => change({ rating })}
            />

            {!isStopped && isShow && (
              <SeasonStepper
                label={ENTRY_COPY.seasonsWatched}
                season={form.seasons}
                onChange={(seasons) => change({ seasons })}
              />
            )}

            <DateFields
              legend={isStopped ? ENTRY_COPY.whenStopped : ENTRY_COPY.whenFinished}
              form={form}
              today={today}
              problem={problem}
              onChange={change}
            />

            <TextAreaField
              label={ENTRY_COPY.note}
              text={form.note}
              placeholder={ENTRY_COPY.notePlaceholder}
              onChange={(note) => change({ note })}
            />

            {editing && (
              <button type="button" className="delete-entry" onClick={() => confirmDelete(editing)}>
                {ENTRY_COPY.deleteTitle}
              </button>
            )}
          </form>
        </IonContent>
      </div>
      {showingDetails && detailsTitleId && (
        <TitleDetailsPage
          titleId={detailsTitleId}
          identity={form}
          backLabel={sheetTitle}
          onBack={closeDetails}
        />
      )}
    </>
  )
}
