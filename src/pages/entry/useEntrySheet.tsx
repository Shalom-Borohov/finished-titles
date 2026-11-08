import { IonModal } from '@ionic/react'
import { useState } from 'react'
import { ALL_TYPES, type TypeFilter } from '../../domain/entries'
import { todayIso } from '../../domain/finishDate'
import { type Entry, isSearchableType, type MediaType } from '../../domain/types'
import type { SearchResult } from '../../search/client'
import { EntryForm } from './EntryForm'
import { type EntryFormState, formFromDraft, formFromEntry } from './formState'
import { SearchStep } from './SearchStep'
import './entry.css'

const DEFAULT_MANUAL_TYPE: MediaType = 'movie'

type SheetStep = { kind: 'search' } | { kind: 'form'; initial: EntryFormState; editing?: Entry }

function formFromResult({ title, type, year, posterUrl, source, sourceId }: SearchResult) {
  return formFromDraft({ title, type, releaseYear: year, posterUrl, source, sourceId, status: 'finished' }, todayIso())
}

export function useEntrySheet(listType: TypeFilter) {
  const [step, setStep] = useState<SheetStep>({ kind: 'search' })
  const [isOpen, setIsOpen] = useState(false)
  const defaultType = listType === ALL_TYPES ? DEFAULT_MANUAL_TYPE : listType
  const close = () => setIsOpen(false)

  function show(next: SheetStep) {
    setStep(next)
    setIsOpen(true)
  }

  const openManual = (title: string) =>
    show({ kind: 'form', initial: formFromDraft({ title, type: defaultType, status: 'finished' }, todayIso()) })

  const openEdit = (entry: Entry) => show({ kind: 'form', initial: formFromEntry(entry, todayIso()), editing: entry })

  const pickResult = (result: SearchResult) => show({ kind: 'form', initial: formFromResult(result) })

  function openAdd() {
    if (isSearchableType(defaultType)) {
      show({ kind: 'search' })

      return
    }

    openManual('')
  }

  const sheet = (
    <IonModal isOpen={isOpen} backdropDismiss={false} onDidDismiss={close}>
      {step.kind === 'search' && (
        <SearchStep onPickResult={pickResult} onOpenExisting={openEdit} onManualEntry={openManual} onClose={close} />
      )}
      {step.kind === 'form' && (
        <EntryForm
          key={step.editing?.id}
          initial={step.initial}
          editing={step.editing}
          onOpenExisting={openEdit}
          onClose={close}
        />
      )}
    </IonModal>
  )

  return { openAdd, openEdit, sheet }
}
