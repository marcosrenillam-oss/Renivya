import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { getCountryName, getCountryRegion } from '@/lib/countries'
import { getCategoryLabel } from '@/lib/categories'
import { flagEmoji } from '@/lib/flags'
import { formatRelativeTime } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'

/**
 * Ficha del país tocado en el globo, como un recuadro de periódico: bandera, cifras del día,
 * tema principal y la noticia más importante en el idioma del lector.
 */
export default function CountryCard({ country, top = null, empty = false, onClose }) {
  const { t, locale } = useI18n()
  if (!country) return null
  const region = getCountryRegion(country.code)
  const stats = [
    { text: country.count === 1 ? t('world.countryStoriesOne') : t('world.countryStories', { count: country.count }) },
    country.live > 0 && { text: t('world.cardLive', { count: country.live }) },
    country.breaking > 0 && { text: t('world.cardBreaking', { count: country.breaking }), hot: true },
  ].filter(Boolean)

  return (
    <motion.section
      key={country.code}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="safe-x"
      aria-label={getCountryName(country.code, locale)}
    >
      <div className="border-y-[3px] border-double border-foreground py-3">
        <div className="flex items-start gap-3">
          <span className="text-[40px] leading-none" aria-hidden="true">{flagEmoji(country.code)}</span>
          <div className="min-w-0 flex-1">
            {region && <p className="kicker text-muted-foreground">{t(`region.${region}`)}</p>}
            <h2 className="font-display text-[30px] font-black leading-[1.02]">{getCountryName(country.code, locale)}</h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {stats.map((s, i) => (
                <span key={s.text} className={s.hot ? 'font-semibold text-destructive' : undefined}>
                  {i > 0 && ' · '}
                  {s.text}
                </span>
              ))}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('world.clear')} className="-mr-1 rounded-full p-1.5 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <dl className="mt-3 grid grid-cols-2 border-t border-foreground/30 pt-2 text-[12.5px]">
          {country.dominantCategory && (
            <div>
              <dt className="kicker text-muted-foreground">{t('world.cardTopic')}</dt>
              <dd className="font-serif-text text-[15px]">{getCategoryLabel(country.dominantCategory, t)}</dd>
            </div>
          )}
          {country.lastUpdated && (
            <div className="border-l border-foreground/30 pl-3">
              <dt className="kicker text-muted-foreground">{t('world.cardUpdatedLabel')}</dt>
              <dd className="font-serif-text text-[15px]">{formatRelativeTime(country.lastUpdated, locale)}</dd>
            </div>
          )}
        </dl>

        {(top || empty) && <div className="mt-3 border-t border-foreground pt-2">
          {top && <p className="kicker text-destructive">{t('world.cardTop')}</p>}
          {top ? (
            <Link to={`/story/${top.id}`} className="mt-0.5 block font-display text-[19px] font-bold leading-snug hover:underline">
              {top.title}
            </Link>
          ) : (
            <p className="mt-0.5 font-serif-text text-[15px] italic text-muted-foreground">{t('world.cardEmpty')}</p>
          )}
        </div>}
      </div>
    </motion.section>
  )
}
