import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

/** Fila deslizable de secciones (táctil, sin barra de desplazamiento). */
export default function CategoryChips({ categories, value, onChange, allLabel }) {
  const { t } = useI18n()
  const chip = (id, label) => (
    <button
      key={id ?? 'all'}
      type="button"
      onClick={() => {
        haptic()
        onChange(id)
      }}
      className={cn(
        'shrink-0 rounded-full border px-4 py-2 text-[14px] font-medium transition-colors',
        value === id ? 'border-foreground bg-foreground text-background' : 'border-border bg-card text-foreground/80'
      )}
    >
      {label}
    </button>
  )
  return (
    <div className="no-scrollbar safe-x flex gap-2 overflow-x-auto py-1">
      {chip(null, allLabel ?? t('top.all'))}
      {categories.map((c) => chip(c, getCategoryLabel(c, t)))}
    </div>
  )
}
