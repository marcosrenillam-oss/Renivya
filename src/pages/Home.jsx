import { useEffect, useState } from 'react'
import DigestHeader from '@/components/digest/DigestHeader'
import DigestSkeleton from '@/components/digest/DigestSkeleton'
import DigestEmpty from '@/components/digest/DigestEmpty'
import DailySummary from '@/components/digest/DailySummary'
import HomeLead from '@/components/digest/HomeLead'
import HomeBreaking from '@/components/digest/HomeBreaking'
import { HomeByCategory, HomePrimaryCountry, HomeTop } from '@/components/digest/HomeSections'
import { useBriefing } from '@/components/digest/useBriefing'
import FeedError from '@/components/story/FeedError'
import InstallPrompt from '@/components/common/InstallPrompt'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function Home() {
  const { t } = useI18n()
  const [mode, setMode] = useState(null)
  const { digest, preference, isLoading, isError, refetch, isEmpty } = useBriefing(mode)

  // Modo inicial según las preferencias guardadas.
  useEffect(() => {
    if (mode === null && preference) setMode(preference.world_mode_enabled ? 'world' : 'personal')
  }, [preference, mode])

  return (
    <div>
      <InstallPrompt />
      <DigestHeader mode={mode ?? 'world'} onModeChange={setMode} />
      {isLoading ? (
        <DigestSkeleton />
      ) : isError ? (
        <FeedError onRetry={refetch} />
      ) : isEmpty || !digest?.lead ? (
        <DigestEmpty />
      ) : (
        <div className="space-y-16">
          <div>
            <HomeBreaking stories={digest.breaking.filter((s) => s.id !== digest.lead.id)} />
            <HomeLead story={digest.lead} />
          </div>
          <div className="grid gap-12 xl:grid-cols-[1fr_320px]">
            <HomeTop stories={digest.top.slice(0, 6)} />
            <aside className="xl:pt-11">
              <DailySummary stories={digest.briefing} />
            </aside>
          </div>
          <HomePrimaryCountry code={digest.primaryCountry.code} stories={digest.primaryCountry.stories} />
          <HomeByCategory sections={digest.sections} />
          {digest.excluded > 0 && mode === 'personal' && (
            <p className="type-caption text-center text-muted-foreground">{t('home.filtered', { count: digest.excluded })}</p>
          )}
        </div>
      )}
    </div>
  )
}
