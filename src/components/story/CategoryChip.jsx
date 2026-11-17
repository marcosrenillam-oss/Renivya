import { Link } from 'react-router-dom'
import { getCategory, categoryToneClass } from '@/lib/categories'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/** Etiqueta de categoría sobria: icono + texto en el tono de la categoría. */
export default function CategoryChip({ category, link = false, className, size = 'sm' }) {
  const { t } = useI18n()
  const meta = getCategory(category)
  if (!meta) return null
  const Icon = meta.icon
  const content = (
    <>
      <Icon className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} aria-hidden="true" />
      <span>{t(`category.${category}`)}</span>
    </>
  )
  const cls = cn(
    'inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em]',
    size === 'sm' ? 'text-[10.5px]' : 'text-[11.5px]',
    categoryToneClass(category),
    className
  )
  return link ? (
    <Link to={`/categories?c=${category}`} className={cn(cls, 'hover:opacity-80')} onClick={(e) => e.stopPropagation()}>
      {content}
    </Link>
  ) : (
    <span className={cls}>{content}</span>
  )
}
