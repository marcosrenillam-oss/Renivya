import { useQuery } from '@tanstack/react-query'
import SectionHeader from '@/components/common/SectionHeader'
import Spinner from '@/components/common/Spinner'
import FeedError from '@/components/story/FeedError'
import AnalyticsSummary from '@/components/analytics/AnalyticsSummary'
import CategoryChart from '@/components/analytics/CategoryChart'
import ScoreConfidenceChart from '@/components/analytics/ScoreConfidenceChart'
import ChangeChart from '@/components/analytics/ChangeChart'
import SourceChart from '@/components/analytics/SourceChart'
import CountryChart from '@/components/analytics/CountryChart'
import TopStories from '@/components/analytics/TopStories'
import { loadAnalytics } from '@/lib/news/analyticsService'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function Analytics() {
  const { t } = useI18n()
  const q = useQuery({ queryKey: ['analytics'], queryFn: () => loadAnalytics() })
  return (
    <div className="space-y-8">
      <SectionHeader as="h1" size="display" title={t('page.analytics.title')} description={t('analytics.subtitle')} />
      {q.isLoading ? (
        <Spinner label={t('common.loading')} />
      ) : q.isError ? (
        <FeedError onRetry={q.refetch} />
      ) : !q.data.totals.stories ? (
        <p className="type-body py-16 text-center text-muted-foreground">{t('analytics.empty')}</p>
      ) : (
        <>
          <AnalyticsSummary totals={q.data.totals} />
          <div className="grid gap-5 lg:grid-cols-2">
            <ScoreConfidenceChart data={q.data.scatter} />
            <ChangeChart data={q.data.changes} />
            <CategoryChart data={q.data.categories} />
            <CountryChart data={q.data.countries} />
            <SourceChart data={q.data.topSources} />
            <TopStories stories={q.data.topStories} />
          </div>
        </>
      )}
    </div>
  )
}
