import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Globe2 } from 'lucide-react'
import LeadCard from '@/components/front/LeadCard'
import NewsRow from '@/components/front/NewsRow'
import Reveal from '@/components/premium/Reveal'
import CategoryChips from '@/components/front/CategoryChips'
import FeedError from '@/components/story/FeedError'
import { byFront, storyCountries, storyInEdition, useEdition, useNews } from '@/lib/news/useNews'
import { buildWorldReport } from '../../engine/world.js'
import { useI18n } from '@/lib/i18n/I18nContext'
import { CATEGORY_PARENT } from '@/lib/categories'
import { getCountryName } from '@/lib/countries'
import { getLanguageName } from '@/lib/languages'
import { flagEmoji } from '@/lib/flags'
import { haptic } from '@/lib/haptics'
import { webglAvailable } from '@/lib/webgl'
import { cn } from '@/lib/utils'

const WorldGlobe = lazy(() => import('@/components/world/WorldGlobe'))
const WorldMap = lazy(() => import('@/components/world/WorldMap'))

const section = (c) => CATEGORY_PARENT[c] || c || 'society'

/** Mundo: lo que pasa fuera del país del lector. Globo de calor + banderas + secciones. */
export default function World() {
  const { t, locale } = useI18n()
  const edition = useEdition()
  const { stories, data: raw, isLoading, isError, refetch } = useNews()
  const [params, setParams] = useSearchParams()
  const selected = params.get('country')
  const [category, setCategory] = useState(null)
  const hasWebgl = useMemo(() => webglAvailable(), [])
  const chipsRef = useRef(null)

  // Importancia por país (todas las historias, en cualquier idioma: el globo no muestra texto).
  const report = useMemo(() => {
    const all = (raw || []).map((s) => ({ ...s, countries: storyCountries(s).filter((c) => c !== edition) }))
    return buildWorldReport(all)
  }, [raw, edition])

  const select = (code) => {
    haptic()
    setCategory(null)
    const next = new URLSearchParams(params)
    if (code) next.set('country', code)
    else next.delete('country')
    setParams(next, { replace: true })
  }

  // La bandera elegida (también desde el globo) se desliza a la vista.
  useEffect(() => {
    const el = chipsRef.current?.querySelector(`[data-code="${selected || 'all'}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selected])

  const pool = useMemo(() => {
    // Todo el mundo: lo que ocurre fuera del país del lector (aunque lo cuente su prensa)
    // y lo que publica la prensa extranjera sin ubicación concreta.
    const international = (s) => ((s.countries || []).length ? s.countries.some((c) => c !== edition) : !storyInEdition(s, edition))
    const list = selected ? stories.filter((s) => storyInEdition(s, selected)) : stories.filter(international)
    return list.sort(byFront)
  }, [stories, selected, edition])
  const categories = useMemo(() => [...new Set(pool.map((s) => section(s.category)))], [pool])
  const visible = category ? pool.filter((s) => section(s.category) === category) : pool

  return (
    <div className="space-y-5">
      <header className="safe-x pt-3">
        <h1 className="font-display text-[38px] font-bold leading-[1.05]">{t('world.title')}</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">{t('world.subtitle', { country: getCountryName(edition, locale) })}</p>
      </header>

      {isError ? (
        <div className="safe-x">
          <FeedError onRetry={refetch} />
        </div>
      ) : (
        <>
          <div className="relative">
            <Suspense fallback={<div className="skeleton mx-auto aspect-square w-[92%] rounded-full" />}>
              {hasWebgl ? (
                <div className="relative mx-auto aspect-square w-full max-w-[560px]">
                  <div aria-hidden="true" className="absolute inset-[8%] rounded-full bg-primary/25 blur-[60px] dark:bg-primary/30" />
                  <WorldGlobe countries={report.countries} selected={selected} onSelect={select} className="relative h-full w-full" />
                </div>
              ) : (
                <div className="safe-x">
                  <WorldMap countries={report.countries} selected={selected} onSelect={select} className="h-[360px] w-full overflow-hidden rounded-2xl" />
                </div>
              )}
            </Suspense>
            <div className="safe-x mx-auto mt-1 flex max-w-[320px] items-center gap-2 text-[11px] text-muted-foreground">
              <span>{t('world.legendLow')}</span>
              <span className="h-1.5 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--destructive)))' }} />
              <span>{t('world.legendHigh')}</span>
            </div>
          </div>

          <div ref={chipsRef} className="no-scrollbar safe-x flex gap-2 overflow-x-auto py-1">
            <button
              type="button"
              data-code="all"
              onClick={() => select(null)}
              className={cn('flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-[14px] font-medium transition', !selected ? 'border-foreground bg-foreground text-background' : 'glass-chip')}
            >
              <Globe2 className="h-[18px] w-[18px]" strokeWidth={1.7} />
              {t('world.everywhere')}
            </button>
            {report.countries.map((c) => (
              <button
                key={c.code}
                type="button"
                data-code={c.code}
                onClick={() => select(c.code)}
                className={cn(
                  'flex shrink-0 items-center gap-2 rounded-2xl border px-3.5 py-2.5 text-[14px] font-medium transition',
                  selected === c.code ? 'border-foreground bg-foreground text-background' : 'glass-chip'
                )}
              >
                <span className="text-[20px] leading-none">{flagEmoji(c.code)}</span>
                {getCountryName(c.code, locale)}
              </button>
            ))}
          </div>

          {categories.length > 1 && <CategoryChips categories={categories} value={category} onChange={setCategory} />}

          <AnimatePresence mode="wait">
            <motion.section key={`${selected}-${category}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="safe-x">
              {selected && <h2 className="mb-4 font-display text-[24px] font-bold">{t('world.countryNews', { country: getCountryName(selected, locale) })}</h2>}
              {isLoading ? (
                <div className="skeleton aspect-[16/10] w-full rounded-2xl" />
              ) : visible.length ? (
                <>
                  <LeadCard story={visible[0]} />
                  <div className="mt-3 space-y-3">
                    {visible.slice(1, 40).map((s) => (
                      <Reveal key={s.id}>
                        <NewsRow story={s} />
                      </Reveal>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-10 text-center">
                  <p className="font-display text-[18px] font-semibold">
                    {selected
                      ? t('world.noneInLanguage', { country: getCountryName(selected, locale), language: getLanguageName(locale, locale).toLowerCase() })
                      : t('world.noneEverywhere', { language: getLanguageName(locale, locale).toLowerCase() })}
                  </p>
                  <p className="mt-2 text-[14px] text-muted-foreground">{t('world.translationsPending')}</p>
                </div>
              )}
            </motion.section>
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
