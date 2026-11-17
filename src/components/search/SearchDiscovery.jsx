import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { CATEGORIES } from '@/lib/categories'
import { getCountryFlag, getCountryName } from '@/lib/countries'
import { useI18n } from '@/lib/i18n/I18nContext'
import { trendingTerms } from '@/components/search/searchStories'

/** Descubrimiento cuando no hay consulta: temas del momento, categorías y países. */
export default function SearchDiscovery({ stories = [], onPick }) {
  const { t, locale } = useI18n()
  const trending = trendingTerms(stories)
  const countries = [...new Map(stories.flatMap((s) => s.countries || []).map((c) => [c, c])).keys()].slice(0, 12)
  return (
    <div className="space-y-10">
      {trending.length > 0 && (
        <section>
          <p className="eyebrow mb-3 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />{t('search.trending')}</p>
          <div className="flex flex-wrap gap-2">
            {trending.map((term) => (
              <button key={term} onClick={() => onPick(term)} className="rounded-full border bg-card/50 px-3.5 py-1.5 text-sm hover:border-foreground/30">
                {term}
              </button>
            ))}
          </div>
        </section>
      )}
      <section>
        <p className="eyebrow mb-3">{t('search.byCategory')}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map(({ id, icon: Icon }) => (
            <Link key={id} to={`/categories?c=${id}`} className="glass-card glass-hover flex items-center gap-2.5 px-3.5 py-3 text-sm">
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {t(`category.${id}`)}
            </Link>
          ))}
        </div>
      </section>
      {countries.length > 0 && (
        <section>
          <p className="eyebrow mb-3">{t('search.byCountry')}</p>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <Link key={c} to={`/world?country=${c}`} className="rounded-full border bg-card/50 px-3.5 py-1.5 text-sm hover:border-foreground/30">
                <span className="mr-1.5" aria-hidden="true">{getCountryFlag(c)}</span>
                {getCountryName(c, locale)}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
