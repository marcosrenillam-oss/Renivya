import { getCountryFlag, getCountryName } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

export default function CountryFlags({ countries = [], max = 3, withNames = false, className }) {
  const { locale } = useI18n()
  if (!countries.length) return null
  const shown = countries.slice(0, max)
  const rest = countries.length - shown.length
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {shown.map((c) => (
        <span key={c} title={getCountryName(c, locale)} className="inline-flex items-center gap-1">
          <span aria-hidden="true">{getCountryFlag(c)}</span>
          {withNames ? <span>{getCountryName(c, locale)}</span> : <span className="sr-only">{getCountryName(c, locale)}</span>}
        </span>
      ))}
      {rest > 0 && <span className="text-muted-foreground">+{rest}</span>}
    </span>
  )
}
