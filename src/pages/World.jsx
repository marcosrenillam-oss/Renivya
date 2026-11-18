import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import LeadCard from '@/components/front/LeadCard'
import NewsRow from '@/components/front/NewsRow'
import CategoryChips from '@/components/front/CategoryChips'
import FeedError from '@/components/story/FeedError'
import CountryCard from '@/components/world/CountryCard'
import WorldToday, { worldToday } from '@/components/world/WorldToday'
import { byFront, storyCountries, storyInEdition, useEdition, useNews } from '@/lib/news/useNews'
import { buildWorldReport } from '../../engine/world.js'
import { useI18n } from '@/lib/i18n/I18nContext'
import { CATEGORY_PARENT } from '@/lib/categories'
import { COUNTRY_REGION, REGIONS, getCountryName } from '@/lib/countries'
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
  const region = params.get('region')
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
  const pickRegion = (r) => {
    haptic()
    setCategory(null)
    const next = new URLSearchParams()
    if (r) next.set('region', r)
    setParams(next, { replace: true })
    if (r) document.getElementById('world-globe')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const regionCountries = useMemo(() => (region ? report.countries.filter((c) => c.region === region) : report.countries), [report, region])
  const dimmed = useMemo(() => (region ? new Set(regionCountries.map((c) => c.code)) : null), [region, regionCountries])
  const selectedCountry = selected ? report.countries.find((c) => c.code === selected) || { code: selected, count: 0, live: 0, breaking: 0 } : null

  // La bandera elegida (también desde el globo) se desliza a la vista.
  useEffect(() => {
    const el = chipsRef.current?.querySelector(`[data-code="${selected || 'all'}"]`)
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [selected])

  const pool = useMemo(() => {
    // Todo el mundo: lo que ocurre fuera del país del lector (aunque lo cuente su prensa)
    // y lo que publica la prensa extranjera sin ubicación concreta.
    const international = (s) => ((s.countries || []).length ? s.countries.some((c) => c !== edition) : !storyInEdition(s, edition))
    const inRegion = (s) => ((s.countries || []).length ? s.countries : storyCountries(s)).some((c) => c !== edition && COUNTRY_REGION[c] === region)
    const list = selected ? stories.filter((s) => storyInEdition(s, selected)) : region ? stories.filter(inRegion) : stories.filter(international)
    return list.sort(byFront)
  }, [stories, selected, region, edition])
  const today = useMemo(() => worldToday([...stories].sort(byFront), report.countries, edition), [stories, report, edition])
  const categories = useMemo(() => [...new Set(pool.map((s) => section(s.category)))], [pool])
  const visible = category ? pool.filter((s) => section(s.category) === category) : pool

  return (
    <div className="space-y-5">
      <header className="safe-x pt-3">
        <div className="rule-thick" />
        <h1 className="py-1 font-display text-[36px] font-black leading-[1.05]">{t('world.title')}</h1>
        <p className="border-t border-foreground pt-1.5 font-serif-text text-[15px] italic text-muted-foreground">{t('world.subtitle', { country: getCountryName(edition, locale) })}</p>
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
                <div id="world-globe" className="relative mx-auto aspect-square w-full max-w-[560px] scroll-mt-16">
                  <WorldGlobe countries={report.countries} selected={selected} onSelect={select} focus={regionCountries[0]?.code} dimmed={dimmed} className="relative h-full w-full" />
                </div>
              ) : (
                <div className="safe-x">
                  <WorldMap countries={report.countries} selected={selected} onSelect={select} className="h-[360px] w-full overflow-hidden rounded-2xl" />
                </div>
              )}
            </Suspense>
            <div className="safe-x mx-auto mt-1 flex max-w-[320px] items-center gap-2 text-[11px] text-muted-foreground">
              <span>{t('world.legendLow')}</span>
              <span className="h-1.5 flex-1 rounded-full" style={{ background: 'linear-gradient(90deg, #f5c518, #f07a10, #c8102e)' }} />
              <span>{t('world.legendHigh')}</span>
            </div>
          </div>

          <div className="safe-x">
            <div className="no-scrollbar flex gap-5 overflow-x-auto border-t-[3px] border-double border-foreground">
              {[null, ...REGIONS.filter((r) => report.countries.some((c) => c.region === r))].map((r) => (
                <button
                  key={r ?? 'all'}
                  type="button"
                  onClick={() => pickRegion(r)}
                  className={cn('shrink-0 border-b-2 py-2 text-[11.5px] font-bold uppercase tracking-[0.16em] transition-colors', (region || null) === r && !selected ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground')}
                >
                  {r ? t(`region.${r}`) : t('world.everywhere')}
                </button>
              ))}
            </div>
          </div>

          <div className="safe-x"><div ref={chipsRef} className="no-scrollbar flex gap-4 overflow-x-auto border-y border-foreground">
            {regionCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                data-code={c.code}
                onClick={() => select(c.code)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 border-b-2 py-2.5 text-[12px] font-bold uppercase tracking-[0.12em] transition',
                  selected === c.code ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground'
                )}
              >
                <span className="text-[17px] leading-none">{flagEmoji(c.code)}</span>
                {getCountryName(c.code, locale)}
              </button>
            ))}
          </div></div>

          {selectedCountry ? (
            <CountryCard country={selectedCountry} empty={!isLoading && !pool.length} onClose={() => select(null)} />
          ) : (
            !region && <WorldToday rows={today} onRegion={pickRegion} />
          )}

          {categories.length > 1 && <CategoryChips categories={categories} value={category} onChange={setCategory} />}

          <AnimatePresence mode="wait">
            <motion.section key={`${selected}-${region}-${category}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.28 }} className="safe-x">
              <div className="rule-thick" />
              {(selected || region) && (
                <h2 className="py-1.5 text-[13px] font-bold uppercase tracking-[0.2em]">
                  {t('world.countryNews', { country: selected ? getCountryName(selected, locale) : t(`region.${region}`) })}
                </h2>
              )}
              {isLoading ? (
                <div className="skeleton aspect-[16/10] w-full rounded-2xl" />
              ) : visible.length ? (
                <>
                  <div className="border-t border-foreground">
                    <LeadCard story={visible[0]} />
                  </div>
                  <div className="divide-y divide-foreground border-t border-foreground">
                    {visible.slice(1, 40).map((s) => (
                      <NewsRow key={s.id} story={s} />
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
