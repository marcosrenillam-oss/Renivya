import { Link } from 'react-router-dom'
import { Clock, X } from 'lucide-react'
import { CATEGORIES, CATEGORY_PARENT } from '@/lib/categories'
import { getCountryName } from '@/lib/countries'
import { flagEmoji } from '@/lib/flags'
import { useI18n } from '@/lib/i18n/I18nContext'
import { recentSearches, useTopics } from '@/lib/preferences'
import { searchStories, trendingTerms } from '@/components/search/searchStories'

/** Noticias de un tema publicadas o actualizadas después de la última vez que lo miraste. */
export function newForTopic(stories, topic) {
  return searchStories(stories, topic.term).filter((s) => (s.updated_date || s.published_at || '') > (topic.seen || '')).length
}

function Heading({ children, action }) {
  return (
    <div className="flex items-baseline justify-between border-b border-foreground pb-1">
      <h2 className="kicker text-foreground">{children}</h2>
      {action}
    </div>
  )
}

/**
 * Sin consulta: búsquedas recientes, temas que sigues, temas del momento, secciones y países.
 * Todo como el índice de un periódico: texto, filetes y nada de botones de colores.
 */
export default function SearchDiscovery({ stories = [], onPick }) {
  const { t, locale } = useI18n()
  const recent = recentSearches.use()
  const { topics, toggle } = useTopics()
  const trending = trendingTerms(stories, 10)
  const countries = [...new Map(stories.flatMap((s) => s.countries || []).map((c) => [c, c])).keys()].slice(0, 14)
  const sections = CATEGORIES.filter((c) => !CATEGORY_PARENT[c.id])

  return (
    <div className="space-y-8">
      {recent.length > 0 && (
        <section>
          <Heading
            action={
              <button type="button" onClick={() => recentSearches.set([])} className="text-[11px] italic text-muted-foreground underline underline-offset-2">
                {t('search.clearRecent')}
              </button>
            }
          >
            {t('search.recent')}
          </Heading>
          <ul className="divide-y divide-foreground/20">
            {recent.map((term) => (
              <li key={term}>
                <button type="button" onClick={() => onPick(term)} className="flex w-full items-center gap-2.5 py-2 text-left font-serif-text text-[16px]">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {term}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <Heading>{t('search.topics')}</Heading>
        {topics.length ? (
          <ul className="divide-y divide-foreground/20">
            {topics.map((topic) => {
              const fresh = newForTopic(stories, topic)
              return (
                <li key={topic.term} className="flex items-center gap-2 py-2">
                  <button type="button" onClick={() => onPick(topic.term)} className="min-w-0 flex-1 text-left">
                    <span className="font-display text-[18px] font-bold">{topic.term}</span>
                    {fresh > 0 && (
                      <span className="ml-2 text-[12px] font-semibold text-destructive">{fresh === 1 ? t('search.newCountOne') : t('search.newCount', { count: fresh })}</span>
                    )}
                  </button>
                  <button type="button" onClick={() => toggle(topic.term)} aria-label={t('common.close')} className="p-1 text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="pt-2 font-serif-text text-[14px] italic text-muted-foreground">{t('search.topicsHint')}</p>
        )}
      </section>

      {trending.length > 0 && (
        <section>
          <Heading>{t('search.trending')}</Heading>
          <p className="pt-2 font-display text-[19px] leading-relaxed">
            {trending.map((term, i) => (
              <span key={term}>
                {i > 0 && <span className="mx-2 text-muted-foreground">·</span>}
                <button type="button" onClick={() => onPick(term)} className="underline decoration-foreground/25 underline-offset-4 hover:decoration-foreground">
                  {term}
                </button>
              </span>
            ))}
          </p>
        </section>
      )}

      <section>
        <Heading>{t('search.sections')}</Heading>
        <div className="grid grid-cols-2 border-l border-t border-foreground/25">
          {sections.map(({ id, icon: Icon }) => (
            <Link key={id} to={`/top-stories?c=${id}`} className="flex items-center gap-2 border-b border-r border-foreground/25 px-2.5 py-2.5 font-serif-text text-[15px]">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.6} aria-hidden="true" />
              {t(`category.${id}`)}
            </Link>
          ))}
        </div>
      </section>

      {countries.length > 0 && (
        <section>
          <Heading>{t('search.byCountry')}</Heading>
          <p className="pt-2 font-serif-text text-[16px] leading-loose">
            {countries.map((c, i) => (
              <span key={c}>
                {i > 0 && <span className="mx-1.5 text-muted-foreground">·</span>}
                <Link to={`/world?country=${c}`} className="whitespace-nowrap underline decoration-foreground/25 underline-offset-4">
                  <span className="mr-1" aria-hidden="true">{flagEmoji(c)}</span>
                  {getCountryName(c, locale)}
                </Link>
              </span>
            ))}
          </p>
        </section>
      )}
    </div>
  )
}
