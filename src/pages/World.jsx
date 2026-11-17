import { lazy, Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SectionHeader from '@/components/common/SectionHeader'
import Spinner from '@/components/common/Spinner'
import FeedError from '@/components/story/FeedError'
import WorldFilters from '@/components/world/WorldFilters'
import WorldMetricRow from '@/components/world/WorldMetricRow'
import WorldCountryChips from '@/components/world/WorldCountryChips'
import CountryStoryPanel from '@/components/world/CountryStoryPanel'
import RegionCard from '@/components/world/RegionCard'
import { useWorldReport } from '@/components/world/useWorldReport'
import { useWorldCountryFeed } from '@/components/world/useWorldCountryFeed'
import { webglAvailable } from '@/lib/webgl'
import { useI18n } from '@/lib/i18n/I18nContext'

// three.js y Leaflet se cargan solo al entrar en Mundo.
const WorldGlobe = lazy(() => import('@/components/world/WorldGlobe'))
const WorldMap = lazy(() => import('@/components/world/WorldMap'))

export default function World() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const selected = params.get('country')
  const hasWebgl = useMemo(() => webglAvailable(), [])
  const [view, setView] = useState(hasWebgl ? 'globe' : 'map')
  const [region, setRegion] = useState(null)
  const [category, setCategory] = useState(null)
  const { report, stories, isLoading, isError, refetch } = useWorldReport({ category, region })
  const countryStories = useWorldCountryFeed(stories, selected)

  const select = (code) => {
    const next = new URLSearchParams(params)
    if (code) next.set('country', code)
    else next.delete('country')
    setParams(next, { replace: true })
  }

  return (
    <div className="space-y-8">
      <SectionHeader as="h1" size="display" title={t('page.world.title')} description={t('world.subtitle')} action={report && <WorldMetricRow totals={report.totals} />} />
      <WorldFilters view={view} onView={setView} region={region} onRegion={setRegion} category={category} onCategory={setCategory} />
      {view === 'globe' && !hasWebgl && <p className="type-small text-muted-foreground">{t('world.noWebgl')}</p>}
      {isLoading ? (
        <Spinner label={t('common.loading')} />
      ) : isError ? (
        <FeedError onRetry={refetch} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Suspense fallback={<div className="skeleton aspect-square w-full rounded-2xl" />}>
              {view === 'globe' && hasWebgl ? (
                <WorldGlobe countries={report.countries} selected={selected} onSelect={select} className="mx-auto aspect-square w-full max-w-[680px]" />
              ) : (
                <WorldMap countries={report.countries} selected={selected} onSelect={select} className="h-[460px] w-full sm:h-[560px]" />
              )}
            </Suspense>
            <p className="type-caption text-center text-muted-foreground/70">{t('world.attribution')}</p>
          </div>
          <aside className="space-y-6">
            {selected ? (
              <CountryStoryPanel code={selected} stories={countryStories} onClear={() => select(null)} />
            ) : (
              <p className="type-small text-muted-foreground">{t('world.selectCountry')}</p>
            )}
            <WorldCountryChips countries={report.countries} selected={selected} onSelect={select} />
            <div>
              <p className="eyebrow mb-3">{t('world.regions')}</p>
              <div className="grid grid-cols-2 gap-2">
                {report.regions.map((r) => (
                  <RegionCard key={r.region} region={r} active={region === r.region} onClick={() => setRegion(region === r.region ? null : r.region)} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
