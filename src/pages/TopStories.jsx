import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { cn } from '@/lib/utils'

const section = (category) => CATEGORY_PARENT[category] || category || 'society'
const byScore = (a, b) => (b.renivya_score ?? 0) - (a.renivya_score ?? 0) || String(a.id).localeCompare(String(b.id))

/** Lo más importante del país del lector, por secciones (economía, deportes, etc.). */
export default function TopStories() {
  const { t, locale } = useI18n()
  const { stories, edition, isLoading, isError, refetch } = useEditionNews()
  // ?c= puede ser una sección (economía) o una sección fina (mercados): se abre en la madre.
  const [params] = useSearchParams()
  const initial = params.get('c')
  const [category, setCategoryState] = useState(initial ? section(initial) : null)
  const [sub, setSub] = useState(initial && CATEGORY_PARENT[initial] ? initial : null)
  const setCategory = (c) => {
    setCategoryState(c)
    setSub(null)
  }

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
  const inSection = category ? groups.find(([k]) => k === category)?.[1] || [] : null
  // Secciones finas presentes dentro de la elegida (p. ej. Internacional → Conflictos, Catástrofes).
  const subs = useMemo(() => (inSection ? [...new Set(inSection.map((s) => s.category).filter((c) => CATEGORY_PARENT[c] === category))] : []), [inSection, category])
  const bySub = inSection && sub ? inSection.filter((s) => s.category === sub) : null
  const selected = bySub?.length ? bySub : inSection

  return (
    <div className="space-y-6">
      <header className="safe-x pt-3">
        <div className="rule-thick" />
        <h1 className="py-1 font-display text-[36px] font-black leading-[1.05]">{t('top.title')}</h1>
        <p className="border-t border-foreground pt-1.5 font-serif-text text-[15px] italic text-muted-foreground">{t('top.subtitle', { country })}</p>
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
          <div className="sticky top-[calc(env(safe-area-inset-top)+3.5rem)] z-30 bg-background">
            <CategoryChips categories={groups.map(([k]) => k)} value={category} onChange={setCategory} />
            {subs.length > 0 && (
              <div className="safe-x">
                <div className="no-scrollbar flex gap-4 overflow-x-auto border-b border-foreground/40">
                  {[null, ...subs].map((c) => (
                    <button
                      key={c ?? 'all'}
                      type="button"
                      onClick={() => setSub(c)}
                      className={cn('shrink-0 py-1.5 font-serif-text text-[14px] italic transition-colors', (bySub?.length ? sub : null) === c ? 'text-foreground underline decoration-2 underline-offset-4' : 'text-muted-foreground')}
                    >
                      {c ? getCategoryLabel(c, t) : t('top.allIn', { section: getCategoryLabel(category, t) })}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={`${category ?? 'all'}-${sub ?? ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="safe-x space-y-8">
              {selected ? (
                selected.length ? (
                  <div className="border-t-[3px] border-foreground">
                    <LeadCard story={selected[0]} rank={1} />
                    <div className="divide-y divide-foreground border-t border-foreground">
                      {selected.slice(1, 30).map((s) => (
                        <NewsRow key={s.id} story={s} showCategory={!sub && s.category !== category} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="py-10 text-center text-muted-foreground">{t('top.emptyCategory')}</p>
                )
              ) : (
                groups.map(([key, list], gi) => (
                  <Reveal as="section" key={key}>
                    <div className="rule-thick" />
                    <div className="flex items-baseline justify-between py-1.5">
                      <h2 className="font-display text-[22px] font-black uppercase tracking-[0.04em]">{getCategoryLabel(key, t)}</h2>
                      {list.length > 3 && (
                        <button type="button" onClick={() => setCategory(key)} className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                          +{list.length - 3} →
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-foreground border-t border-foreground">
                      <LeadCard story={list[0]} />
                      {list.slice(1, 3).map((s) => (
                        <NewsRow key={s.id} story={s} showCategory={false} />
                      ))}
                    </div>
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
