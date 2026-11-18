import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LeadCard from '@/components/front/LeadCard'
import NewsRow from '@/components/front/NewsRow'
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
        <h1 className="font-display text-[34px] font-bold leading-tight">{t('top.title')}</h1>
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
          <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-30 -my-1 bg-background/85 py-2 backdrop-blur-xl">
            <CategoryChips categories={groups.map(([k]) => k)} value={category} onChange={setCategory} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={category ?? 'all'} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="safe-x space-y-10">
              {selected ? (
                selected.length ? (
                  <div>
                    <LeadCard story={selected[0]} rank={1} />
                    <div className="mt-4 divide-y divide-border border-t">
                      {selected.slice(1, 30).map((s) => (
                        <NewsRow key={s.id} story={s} showCategory={false} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="py-10 text-center text-muted-foreground">{t('top.emptyCategory')}</p>
                )
              ) : (
                groups.map(([key, list]) => (
                  <section key={key}>
                    <div className="mb-4 flex items-baseline justify-between border-b-2 border-foreground pb-2">
                      <h2 className="font-display text-[22px] font-bold">{getCategoryLabel(key, t)}</h2>
                      {list.length > 3 && (
                        <button type="button" onClick={() => setCategory(key)} className="text-[13px] font-semibold text-accent">
                          +{list.length - 3}
                        </button>
                      )}
                    </div>
                    <LeadCard story={list[0]} />
                    {list.length > 1 && (
                      <div className="mt-3 divide-y divide-border border-t">
                        {list.slice(1, 3).map((s) => (
                          <NewsRow key={s.id} story={s} showCategory={false} />
                        ))}
                      </div>
                    )}
                  </section>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
