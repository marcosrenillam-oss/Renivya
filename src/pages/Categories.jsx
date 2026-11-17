import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SectionHeader from '@/components/common/SectionHeader'
import Spinner from '@/components/common/Spinner'
import FeedError from '@/components/story/FeedError'
import CategoryOverview from '@/components/categories/CategoryOverview'
import CategoryDetail from '@/components/categories/CategoryDetail'
import { isCategory } from '@/lib/categories'
import { listStories, queryKeys, STORY_SORT } from '@/lib/dataService'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function Categories() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const c = params.get('c')
  const q = useQuery({
    queryKey: queryKeys.stories({ scope: 'categories' }),
    queryFn: () => listStories({ sort: STORY_SORT.score, limit: 400 }),
    enabled: !isCategory(c),
  })
  if (isCategory(c)) return <CategoryDetail category={c} />
  return (
    <div className="space-y-8">
      <SectionHeader as="h1" size="display" title={t('page.categories.title')} description={t('categories.subtitle')} />
      {q.isLoading ? <Spinner label={t('common.loading')} /> : q.isError ? <FeedError onRetry={q.refetch} /> : <CategoryOverview stories={q.data} />}
    </div>
  )
}
