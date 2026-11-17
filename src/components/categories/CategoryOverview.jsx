import { Link } from 'react-router-dom'
import { CATEGORIES, categoryToneClass } from '@/lib/categories'
import { getHeadline } from '@/lib/headline'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/** Rejilla de categorías con volumen y titular más relevante de cada una. */
export default function CategoryOverview({ stories = [] }) {
  const { t } = useI18n()
  const byCat = new Map()
  for (const s of stories) {
    if (!byCat.has(s.category)) byCat.set(s.category, [])
    byCat.get(s.category).push(s)
  }
  const ordered = [...CATEGORIES].sort((a, b) => (byCat.get(b.id)?.length || 0) - (byCat.get(a.id)?.length || 0))
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ordered.map(({ id, icon: Icon }) => {
        const list = byCat.get(id) || []
        const top = list[0]
        return (
          <Link key={id} to={`/categories?c=${id}`} className={cn('glass-card glass-hover flex flex-col p-5', !list.length && 'opacity-60')}>
            <div className="mb-4 flex items-center justify-between">
              <span className={cn('inline-flex items-center gap-2 text-sm font-semibold', categoryToneClass(id))}>
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(`category.${id}`)}
              </span>
              <span className="type-caption text-muted-foreground">
                {list.length === 1 ? t('categories.countOne') : t('categories.count', { count: list.length })}
              </span>
            </div>
            <p className="font-heading text-[1.08rem] font-semibold leading-snug text-foreground/90">
              {top ? getHeadline(top) : <span className="font-body text-sm font-normal text-muted-foreground">{t('categories.none')}</span>}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
