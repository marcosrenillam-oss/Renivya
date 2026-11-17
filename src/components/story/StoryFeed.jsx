import { Loader2 } from 'lucide-react'
import StoryListItem from '@/components/story/StoryListItem'
import FeedError from '@/components/story/FeedError'
import { Button } from '@/components/ui/button'
import { useStoryFeed } from '@/components/story/useStoryFeed'
import { useI18n } from '@/lib/i18n/I18nContext'

function ListSkeleton() {
  return (
    <div aria-hidden="true" className="divide-y">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-6 py-5">
          <div className="flex-1 space-y-3">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-6 w-full" />
            <div className="skeleton h-4 w-2/3" />
          </div>
          <div className="skeleton h-24 w-36 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

/** Feed paginado reutilizable. Distingue carga, error y vacío. */
export default function StoryFeed({ ranked = false, ...params }) {
  const { t } = useI18n()
  const q = useStoryFeed(params)
  if (q.isLoading) return <ListSkeleton />
  if (q.isError) return <FeedError onRetry={q.refetch} />
  const stories = q.data.pages.flat()
  if (!stories.length) return <p className="type-body py-16 text-center text-muted-foreground">{t('feed.empty')}</p>
  return (
    <div>
      <div className="divide-y">
        {stories.map((s, i) => (
          <StoryListItem key={s.id} story={s} rank={ranked ? i + 1 : undefined} />
        ))}
      </div>
      <div className="mt-8 flex justify-center">
        {q.hasNextPage ? (
          <Button variant="outline" onClick={() => q.fetchNextPage()} disabled={q.isFetchingNextPage}>
            {q.isFetchingNextPage && <Loader2 className="animate-spin" />}
            {t('feed.loadMore')}
          </Button>
        ) : (
          <p className="type-caption text-muted-foreground">{t('feed.end')}</p>
        )}
      </div>
    </div>
  )
}
