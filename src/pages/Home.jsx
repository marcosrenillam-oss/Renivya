import { useMemo, useState } from 'react'
import Greeting from '@/components/front/Greeting'
import BreakingTicker from '@/components/front/BreakingTicker'
import FrontPageCarousel from '@/components/front/FrontPageCarousel'
import NewsRow from '@/components/front/NewsRow'
import EmptyEdition from '@/components/front/EmptyEdition'
import FeedError from '@/components/story/FeedError'
import { useEditionNews } from '@/lib/news/useNews'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCountryName } from '@/lib/countries'
import { getLanguageName } from '@/lib/languages'

const FRONT = 7
const PAGE = 20

/** Portada: saludo, última hora, primeras planas (carrusel) y el resto de noticias del país. */
export default function Home() {
  const { t, locale } = useI18n()
  const { stories, edition, isLoading, isError, refetch } = useEditionNews()
  const [shown, setShown] = useState(PAGE)

  const { breaking, front, rest } = useMemo(() => {
    const breaking = stories.filter((s) => s.is_breaking).slice(0, 5)
    const front = stories.slice(0, FRONT)
    const used = new Set(front.map((s) => s.id))
    return { breaking, front, rest: stories.filter((s) => !used.has(s.id)) }
  }, [stories])

  return (
    <div className="space-y-7">
      <Greeting />
      {isError ? (
        <div className="safe-x">
          <FeedError onRetry={refetch} />
        </div>
      ) : isLoading ? (
        <div className="safe-x space-y-4">
          <div className="skeleton h-[52px] w-full rounded-2xl" />
          <div className="skeleton mx-auto h-[min(132vw,560px)] w-[82vw] max-w-[380px] rounded-md" />
        </div>
      ) : !stories.length ? (
        <EmptyEdition title={t('home.empty', { country: getCountryName(edition, locale), language: getLanguageName(locale, locale).toLowerCase() })} hint={t('home.emptyHint')} />
      ) : (
        <>
          <BreakingTicker stories={breaking} />
          <section>
            <div className="safe-x flex items-baseline justify-between">
              <h2 className="font-display text-[22px] font-bold">{t('home.frontPages')}</h2>
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t('home.swipe')} →</span>
            </div>
            <FrontPageCarousel stories={front} edition={edition} />
          </section>
          {rest.length > 0 && (
            <section className="safe-x">
              <h2 className="border-b-2 border-foreground pb-2 font-display text-[22px] font-bold">{t('home.more')}</h2>
              <div className="divide-y divide-border">
                {rest.slice(0, shown).map((s) => (
                  <NewsRow key={s.id} story={s} />
                ))}
              </div>
              {rest.length > shown && (
                <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mt-4 w-full rounded-2xl border py-3.5 text-[15px] font-semibold text-foreground active:bg-muted">
                  {t('home.showMore')}
                </button>
              )}
            </section>
          )}
        </>
      )}
    </div>
  )
}
