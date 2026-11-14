import { Poster } from '../../components/Poster'
import { YearRange } from '../../components/YearRange'
import { MEDIA_TYPE_SINGULAR_LABELS } from '../../copy/labels'
import { isMediaType, isShowType, MEDIA_TYPES } from '../../domain/types'
import { ENTRY_COPY } from './copy'
import type { EntryFormState } from './formState'

type FormIdentityProps = {
  form: EntryFormState
  onChange: (changes: Partial<EntryFormState>) => void
}

export function FormIdentity({ form, onChange }: FormIdentityProps) {
  return (
    <div className="form-identity">
      <div className="form-identity-poster">
        <Poster title={form.title} posterUrl={form.posterUrl} compact />
      </div>
      <div className="form-identity-inputs">
        <label>
          <span className="visually-hidden">{ENTRY_COPY.titleField}</span>
          <input
            className="title-input"
            dir="auto"
            placeholder={ENTRY_COPY.titleField}
            value={form.title}
            onChange={(event) => onChange({ title: event.target.value })}
          />
        </label>
        <div className="form-identity-meta">
          <label>
            <span className="visually-hidden">{ENTRY_COPY.typeField}</span>
            <select
              className="type-select"
              value={form.type}
              onChange={(event) => isMediaType(event.target.value) && onChange({ type: event.target.value })}
            >
              {MEDIA_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MEDIA_TYPE_SINGULAR_LABELS[type]}
                </option>
              ))}
            </select>
          </label>
          <YearRange
            className="release-year"
            releaseYear={form.releaseYear}
            endYear={isShowType(form.type) ? form.endYear : undefined}
          />
        </div>
      </div>
    </div>
  )
}
