import { Link } from 'react-router-dom'
import { getHeadline } from '@/lib/headline'
import { getStoryInLocale } from '@/lib/i18n/storyLocale'
import { formatRelativeTime } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Franja de última hora: solo si el motor ha marcado historias como is_breaking. */
export default function HomeBreaking({ stories = [] }) {
  const { t, locale } = useI18n()
  if (!stories.length) return null
  return (
    <div role="region" aria-label={t('home.breaking')} className="mb-10 overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.06]">
      {stories.map((raw) => {
        const { story } = getStoryInLocale(raw, locale)
        return (
          <Link key={story.id} to={`/story/${story.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-primary/[0.06] sm:px-5">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary-foreground">
              <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary-foreground" aria-hidden="true" />
              {t('home.breaking')}
            </span>
            <span className="min-w-0 flex-1 truncate font-heading text-[1.02rem] font-semibold">{getHeadline(story)}</span>
            <span className="type-caption hidden shrink-0 text-muted-foreground sm:block">{formatRelativeTime(story.breaking_detected_at || story.published_at, locale)}</span>
          </Link>
        )
      })}
    </div>
  )
}
