import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bookmark, WifiOff } from 'lucide-react'
import NewsRow from '@/components/front/NewsRow'
import FeedError from '@/components/story/FeedError'
import Spinner from '@/components/common/Spinner'
import { listSavedStories } from '@/lib/dataService'
import { storyInLocale } from '../../engine/translation.js'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Guardadas: copia completa en el dispositivo, se leen sin conexión aunque ya no estén publicadas. */
export default function SavedStories() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const q = useQuery({ queryKey: ['saved-stories', user?.id], queryFn: listSavedStories, enabled: Boolean(user) })
  const stories = (q.data || []).map((s) => storyInLocale(s, locale)).filter(Boolean).sort((a, b) => String(b.saved_at || '').localeCompare(String(a.saved_at || '')))
  return (
    <div className="space-y-6">
      <header className="pt-1">
        <div className="rule-thick" />
        <h1 className="py-1 font-display text-[36px] font-black leading-[1.05]">{t('page.saved.title')}</h1>
        <p className="flex items-center gap-1.5 border-t border-foreground pt-1.5 font-serif-text text-[15px] italic text-muted-foreground">
          <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {t('read.offline')}
        </p>
      </header>
      {q.isLoading ? (
        <Spinner label={t('common.loading')} />
      ) : q.isError ? (
        <FeedError onRetry={q.refetch} />
      ) : !stories.length ? (
        <div className="border-y border-foreground py-12 text-center">
          <Bookmark className="mx-auto mb-3 h-7 w-7 text-foreground/50" strokeWidth={1.5} aria-hidden="true" />
          <p className="font-display text-[22px] font-bold">{t('saved.empty')}</p>
          <p className="mx-auto mt-2 max-w-sm font-serif-text text-[15px] italic text-muted-foreground">{t('saved.emptyBody')}</p>
          <Link to="/" className="mt-5 inline-block border-y-2 border-foreground px-5 py-2 text-[12px] font-bold uppercase tracking-[0.18em]">
            {t('notFound.home')}
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-foreground border-y border-foreground">
          {stories.map((s) => (
            <NewsRow key={s.id} story={s} />
          ))}
        </div>
      )}
    </div>
  )
}
