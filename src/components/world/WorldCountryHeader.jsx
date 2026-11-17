import { X } from 'lucide-react'
import { getCountryFlag, getCountryName, getCountryRegion } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function WorldCountryHeader({ code, count, onClear }) {
  const { t, locale } = useI18n()
  const region = getCountryRegion(code)
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {region && <p className="eyebrow mb-1">{t(`region.${region}`)}</p>}
        <h2 className="type-h1 flex items-center gap-2">
          <span aria-hidden="true">{getCountryFlag(code)}</span>
          {getCountryName(code, locale)}
        </h2>
        <p className="type-caption mt-1 text-muted-foreground">{count === 1 ? t('world.countryStoriesOne') : t('world.countryStories', { count })}</p>
      </div>
      <button onClick={onClear} aria-label={t('world.clear')} className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
