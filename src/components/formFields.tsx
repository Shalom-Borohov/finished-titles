import './formFields.css'

type SegmentedProps<Option extends string> = {
  label: string
  options: readonly Option[]
  labels: Record<Option, string>
  selected: Option
  onSelect: (option: Option) => void
}

export function Segmented<Option extends string>({ label, options, labels, selected, onSelect }: SegmentedProps<Option>) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option} type="button" aria-pressed={option === selected} onClick={() => onSelect(option)}>
          {labels[option]}
        </button>
      ))}
    </div>
  )
}

type TextAreaFieldProps = {
  label: string
  text?: string
  placeholder?: string
  onChange: (text: string) => void
}

export function TextAreaField({ label, text, placeholder, onChange }: TextAreaFieldProps) {
  return (
    <label className="form-group">
      <span className="form-group-label">{label}</span>
      <textarea
        className="text-field"
        dir="auto"
        rows={2}
        placeholder={placeholder}
        value={text ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
