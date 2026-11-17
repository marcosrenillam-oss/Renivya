import { useState } from 'react'
import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Lista editable de etiquetas (Intro o coma para añadir). Sin duplicados (sin distinguir mayúsculas). */
export default function TagInput({ value = [], onChange, placeholder, label, id }) {
  const { t } = useI18n()
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim().replace(/,$/, '')
    if (v && !value.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...value, v])
    setDraft('')
  }
  return (
    <div>
      {label && <label htmlFor={id} className="type-small mb-2 block font-medium">{label}</label>}
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border bg-card/60 p-1.5 focus-within:ring-2 focus-within:ring-ring/30">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== tag))} aria-label={`${t('common.close')} ${tag}`} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={add}
          placeholder={placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none"
        />
      </div>
    </div>
  )
}
