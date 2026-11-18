import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bookmark } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import StoryListItem from '@/components/story/StoryListItem'
import FeedError from '@/components/story/FeedError'
import Spinner from '@/components/common/Spinner'
import { Button } from '@/components/ui/button'
import { listSavedStories } from '@/lib/dataService'
import { storyInLocale } from '../../engine/translation.js'
import { formatRelativeTime } from '@/lib/format'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function SavedStories() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const q = useQuery({ queryKey: ['saved-stories', user?.id], queryFn: listSavedStories, enabled: Boolean(user) })
  const stories = (q.data || []).map((s) => storyInLocale(s, locale)).filter(Boolean).sort((a, b) => String(b.saved_at || '').localeCompare(String(a.saved_at || '')))
  return (
    <div className="space-y-8">
      <SectionHeader as="h1" size="display" title={t('page.saved.title')} description={t('saved.subtitle')} />
      {q.isLoading ? (
        <Spinner label={t('common.loading')} />
      ) : q.isError ? (
        <FeedError onRetry={q.refetch} />
      ) : !stories.length ? (
        <div className="glass-card mx-auto max-w-md px-8 py-14 text-center">
          <Bookmark className="mx-auto mb-4 h-7 w-7 text-primary/70" strokeWidth={1.5} aria-hidden="true" />
          <p className="type-h2 mb-2">{t('saved.empty')}</p>
          <p className="type-small mb-6 text-muted-foreground">{t('saved.emptyBody')}</p>
          <Button variant="outline" asChild><Link to="/">{t('notFound.home')}</Link></Button>
        </div>
      ) : (
        <div className="divide-y">
          {stories.map((s) => (
            <StoryListItem
              key={s.id}
              story={s}
              extra={s.saved_at && <span className="type-caption text-muted-foreground">· {t('saved.savedOn', { time: formatRelativeTime(s.saved_at, locale) })}</span>}
            />
          ))}
        </div>
      )}
    </div>
  )
}
