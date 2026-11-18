import { useEffect, useRef } from 'react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

/** Índice de secciones como en la cabecera de un periódico: texto en versalitas, la activa subrayada. */
export default function CategoryChips({ categories, value, onChange, allLabel }) {
  const { t } = useI18n()
  const rowRef = useRef(null)
  // La pestaña elegida (también al llegar con ?c=) se desliza a la vista.
  useEffect(() => {
    rowRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [value])
  const chip = (id, label) => (
    <button
      key={id ?? 'all'}
      type="button"
      aria-pressed={value === id}
      onClick={() => {
        haptic()
        onChange(id)
      }}
      className={cn(
        'shrink-0 border-b-2 py-2 text-[12px] font-bold uppercase tracking-[0.14em] transition-colors',
        value === id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
      )}
    >
      {label}
    </button>
  )
  return (
    <div className="safe-x">
      <div ref={rowRef} className="no-scrollbar flex gap-5 overflow-x-auto border-y border-foreground bg-background">
        {chip(null, allLabel ?? t('top.all'))}
        {categories.map((c) => chip(c, getCategoryLabel(c, t)))}
      </div>
    </div>
  )
}
