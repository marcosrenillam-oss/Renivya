import { CATEGORIES } from '@/lib/categories'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/** Fila horizontal de categorías (scroll táctil, sin barra visible). */
export default function CategoryChips({ value, onChange, available = null, className }) {
  const { t } = useI18n()
  const list = available ? CATEGORIES.filter((c) => available.includes(c.id)) : CATEGORIES
  const chip = (id, label, Icon) => (
    <button
      key={id ?? 'all'}
      onClick={() => onChange(id)}
      aria-pressed={value === id}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
        value === id ? 'border-foreground bg-foreground text-background' : 'bg-card/50 text-muted-foreground hover:border-foreground/30 hover:text-foreground'
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {label}
    </button>
  )
  return (
    <div className={cn('-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0', className)}>
      {chip(null, t('feed.all'))}
      {list.map((c) => chip(c.id, t(`category.${c.id}`), c.icon))}
    </div>
  )
}
