import { getCountryFlag } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

export default function RegionCard({ region, active, onClick }) {
  const { t } = useI18n()
  return (
    <button onClick={onClick} aria-pressed={active} className={cn('glass-card glass-hover p-4 text-left', active && 'ring-1 ring-primary/40', !region.count && 'opacity-50')}>
      <p className="text-sm font-semibold">{t(`region.${region.region}`)}</p>
      <p className="type-caption mt-1 text-muted-foreground">{region.count === 1 ? t('world.countryStoriesOne') : t('world.countryStories', { count: region.count })}</p>
      <p className="mt-2 truncate text-base" aria-hidden="true">{region.countries.slice(0, 6).map(getCountryFlag).join(' ')}</p>
    </button>
  )
}
