import { useMemo, useState } from 'react'
import Greeting from '@/components/front/Greeting'
import BreakingTicker from '@/components/front/BreakingTicker'
import FrontPageCarousel from '@/components/front/FrontPageCarousel'
import NewsRow from '@/components/front/NewsRow'
import FeatureCard from '@/components/front/FeatureCard'
import Reveal from '@/components/premium/Reveal'
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
              <h2 className="font-display text-[24px] font-bold">{t('home.frontPages')}</h2>
              <span className="text-[12px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t('home.swipe')} →</span>
            </div>
            <FrontPageCarousel stories={front} edition={edition} />
          </section>
          {rest.length > 0 && (
            <section className="safe-x">
              <h2 className="mb-4 font-display text-[24px] font-bold">{t('home.more')}</h2>
              <div className="space-y-3">
                {rest.slice(0, shown).map((s, i) => (
                  <Reveal key={s.id} delay={Math.min(i % 6, 3) * 0.04}>
                    {i % 5 === 0 ? <FeatureCard story={s} /> : <NewsRow story={s} />}
                  </Reveal>
                ))}
              </div>
              {rest.length > shown && (
                <button type="button" onClick={() => setShown((n) => n + PAGE)} className="glass-premium mt-5 w-full rounded-full py-3.5 text-[15px] font-semibold text-foreground transition active:scale-[0.98]">
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
