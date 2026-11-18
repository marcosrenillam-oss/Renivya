import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LeadCard from '@/components/front/LeadCard'
import NewsRow from '@/components/front/NewsRow'
import Reveal from '@/components/premium/Reveal'
import CategoryChips from '@/components/front/CategoryChips'
import EmptyEdition from '@/components/front/EmptyEdition'
import FeedError from '@/components/story/FeedError'
import { useEditionNews } from '@/lib/news/useNews'
import { useI18n } from '@/lib/i18n/I18nContext'
import { CATEGORIES, CATEGORY_PARENT, getCategoryLabel } from '@/lib/categories'
import { getCountryName } from '@/lib/countries'
import { getLanguageName } from '@/lib/languages'

const section = (category) => CATEGORY_PARENT[category] || category || 'society'
const byScore = (a, b) => (b.renivya_score ?? 0) - (a.renivya_score ?? 0) || String(a.id).localeCompare(String(b.id))

/** Lo más importante del país del lector, por secciones (economía, deportes, etc.). */
export default function TopStories() {
  const { t, locale } = useI18n()
  const { stories, edition, isLoading, isError, refetch } = useEditionNews()
  const [category, setCategory] = useState(null)

  const groups = useMemo(() => {
    const map = new Map()
    for (const s of [...stories].sort(byScore)) {
      const key = section(s.category)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(s)
    }
    const order = CATEGORIES.map((c) => c.id)
    return [...map.entries()].sort((a, b) => (b[1][0]?.renivya_score ?? 0) - (a[1][0]?.renivya_score ?? 0) || order.indexOf(a[0]) - order.indexOf(b[0]))
  }, [stories])

  const country = getCountryName(edition, locale)
  const selected = category ? groups.find(([k]) => k === category)?.[1] || [] : null

  return (
    <div className="space-y-6">
      <header className="safe-x pt-3">
        <h1 className="font-display text-[38px] font-bold leading-[1.05]">{t('top.title')}</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">{t('top.subtitle', { country })}</p>
      </header>

      {isError ? (
        <div className="safe-x">
          <FeedError onRetry={refetch} />
        </div>
      ) : isLoading ? (
        <div className="safe-x">
          <div className="skeleton aspect-[16/10] w-full rounded-2xl" />
        </div>
      ) : !stories.length ? (
        <EmptyEdition title={t('home.empty', { country, language: getLanguageName(locale, locale).toLowerCase() })} hint={t('home.emptyHint')} />
      ) : (
        <>
          <div className="sticky top-[calc(env(safe-area-inset-top)+4.4rem)] z-30 -my-1 py-2">
            <CategoryChips categories={groups.map(([k]) => k)} value={category} onChange={setCategory} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={category ?? 'all'} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="safe-x space-y-10">
              {selected ? (
                selected.length ? (
                  <div>
                    <LeadCard story={selected[0]} rank={1} />
                    <div className="mt-3 space-y-3">
                      {selected.slice(1, 30).map((s) => (
                        <Reveal key={s.id}>
                          <NewsRow story={s} showCategory={false} />
                        </Reveal>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="py-10 text-center text-muted-foreground">{t('top.emptyCategory')}</p>
                )
              ) : (
                groups.map(([key, list], gi) => (
                  <Reveal as="section" key={key}>
                    <div className="mb-3 flex items-end justify-between">
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-[34px] font-black leading-none text-accent/80">{String(gi + 1).padStart(2, '0')}</span>
                        <h2 className="font-display text-[24px] font-bold leading-none">{getCategoryLabel(key, t)}</h2>
                      </div>
                      {list.length > 3 && (
                        <button type="button" onClick={() => setCategory(key)} className="glass-chip rounded-full px-3 py-1 text-[12.5px] font-semibold text-accent">
                          +{list.length - 3}
                        </button>
                      )}
                    </div>
                    <LeadCard story={list[0]} />
                    {list.length > 1 && (
                      <div className="mt-3 space-y-3">
                        {list.slice(1, 3).map((s) => (
                          <NewsRow key={s.id} story={s} showCategory={false} />
                        ))}
                      </div>
                    )}
                  </Reveal>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
