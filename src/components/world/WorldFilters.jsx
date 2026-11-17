import { Globe2, Map as MapIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES } from '@/lib/categories'
import { REGIONS } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

export default function WorldFilters({ view, onView, region, onRegion, category, onCategory }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" className="inline-flex rounded-full border bg-card/60 p-1">
        {[['globe', Globe2, t('world.globe')], ['map', MapIcon, t('world.map')]].map(([id, Icon, label]) => (
          <button key={id} role="radio" aria-checked={view === id} onClick={() => onView(id)} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium', view === id ? 'bg-foreground text-background' : 'text-muted-foreground')}>
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <Select value={region || 'all'} onValueChange={(v) => onRegion(v === 'all' ? null : v)}>
        <SelectTrigger className="h-9 w-44 rounded-full text-xs" aria-label={t('world.regions')}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('world.allRegions')}</SelectItem>
          {REGIONS.map((r) => <SelectItem key={r} value={r}>{t(`region.${r}`)}</SelectItem>)}
        </SelectContent>
      </Select>
      <Select value={category || 'all'} onValueChange={(v) => onCategory(v === 'all' ? null : v)}>
        <SelectTrigger className="h-9 w-48 rounded-full text-xs" aria-label={t('page.categories.title')}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('world.allCategories')}</SelectItem>
          {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{t(`category.${c.id}`)}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}
