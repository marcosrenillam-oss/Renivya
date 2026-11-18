import { useMemo, useState } from 'react'
import Greeting from '@/components/front/Greeting'
import BreakingTicker from '@/components/front/BreakingTicker'
import FrontPageCarousel from '@/components/front/FrontPageCarousel'
import FrontGrid from '@/components/front/FrontGrid'
import { FollowedUpdates } from '@/components/story/StoryExtras'
import TopicsStrip from '@/components/front/TopicsStrip'
import MissedBox from '@/components/reading/MissedBox'
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
    <div className="space-y-6">
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
          <MissedBox stories={stories} />
          <FollowedUpdates />
          <TopicsStrip />
          <section>
            <div className="safe-x">
              <div className="rule-thick" />
              <div className="flex items-baseline justify-between py-1.5">
                <h2 className="text-[13px] font-bold uppercase tracking-[0.2em]">{t('home.frontPages')}</h2>
                <span className="text-[11px] italic text-muted-foreground">{t('home.swipe')} →</span>
              </div>
            </div>
            <FrontPageCarousel stories={front} edition={edition} />
          </section>
          {rest.length > 0 && (
            <section className="safe-x">
              <div className="rule-thick" />
              <h2 className="py-1.5 text-[13px] font-bold uppercase tracking-[0.2em]">{t('home.more')}</h2>
              <FrontGrid stories={rest.slice(0, shown)} />
              {rest.length > shown && (
                <button type="button" onClick={() => setShown((n) => n + PAGE)} className="mt-2 w-full border-y-2 border-foreground py-3 text-[12px] font-bold uppercase tracking-[0.18em] text-foreground active:bg-muted">
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
