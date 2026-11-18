import { Link } from 'react-router-dom'
import { REGIONS, COUNTRY_REGION } from '@/lib/countries'
import { storyCountries } from '@/lib/news/useNews'
import { flagEmoji } from '@/lib/flags'
import { haptic } from '@/lib/haptics'
import { useI18n } from '@/lib/i18n/I18nContext'

/** La noticia principal de cada región (fuera del país del lector) y cuántos países tienen noticias. */
export function worldToday(stories, countries, edition) {
  // Dónde ocurre (no quién lo cuenta); sin lugar detectado, el país del periódico.
  const place = (s) => ((s.countries || []).length ? s.countries : storyCountries(s)).filter((c) => c !== edition)
  const used = new Set()
  return REGIONS.map((region) => {
    const top = stories.find((s) => !used.has(s.id) && place(s).some((c) => COUNTRY_REGION[c] === region)) || null
    if (top) used.add(top.id)
    const active = countries.filter((c) => c.region === region && c.code !== edition).length
    const where = top ? place(top).find((c) => COUNTRY_REGION[c] === region) : null
    return { region, top, where, active }
  }).filter((r) => r.top)
}

/**
 * "El mundo hoy": una columna de periódico con la noticia de cada región.
 * Tocar el nombre de la región la filtra en el globo y en la lista.
 */
export default function WorldToday({ rows, onRegion }) {
  const { t } = useI18n()
  if (!rows.length) return null
  return (
    <section className="safe-x">
      <div className="rule-thick" />
      <div className="flex items-baseline justify-between gap-3 py-1.5">
        <h2 className="font-display text-[22px] font-black leading-tight">{t('world.today')}</h2>
        <p className="text-[11.5px] italic text-muted-foreground">{t('world.todayHint')}</p>
      </div>
      <ol className="divide-y divide-foreground/25 border-y border-foreground">
        {rows.map(({ region, top, where, active }) => (
          <li key={region} className="flex gap-3 py-2.5">
            <button
              type="button"
              onClick={() => {
                haptic()
                onRegion(region)
              }}
              className="w-[92px] shrink-0 text-left"
            >
              <span className="kicker block text-foreground underline decoration-foreground/30 underline-offset-4">{t(`region.${region}`)}</span>
              <span className="mt-0.5 block text-[10.5px] italic text-muted-foreground">
                {active === 1 ? t('world.regionCountriesOne') : t('world.regionCountries', { count: active })}
              </span>
            </button>
            <Link to={`/story/${top.id}`} className="min-w-0 flex-1 border-l border-foreground/30 pl-3">
              <span className="font-display text-[16.5px] font-bold leading-snug">
                {where && <span className="mr-1.5" aria-hidden="true">{flagEmoji(where)}</span>}
                {top.is_breaking && <span className="kicker mr-1.5 text-destructive">●</span>}
                {top.title}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
