import { getCountryFlag, getCountryName } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

export default function WorldCountryChips({ countries = [], selected, onSelect, max = 10 }) {
  const { t, locale } = useI18n()
  if (!countries.length) return null
  return (
    <div>
      <p className="eyebrow mb-3">{t('world.mostActive')}</p>
      <div className="flex flex-wrap gap-2">
        {countries.slice(0, max).map((c) => (
          <button
            key={c.code}
            onClick={() => onSelect(c.code)}
            aria-pressed={selected === c.code}
            className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors', selected === c.code ? 'border-primary bg-primary/10 text-primary' : 'bg-card/50 hover:border-foreground/30')}
          >
            <span aria-hidden="true">{getCountryFlag(c.code)}</span>
            {getCountryName(c.code, locale)}
            <span className="type-caption text-muted-foreground">{c.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
