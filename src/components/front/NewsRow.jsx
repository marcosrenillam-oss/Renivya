import { Link } from 'react-router-dom'
import StoryImage from '@/components/story/StoryImage'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { formatRelativeTime } from '@/lib/format'
import { haptic } from '@/lib/haptics'
import { sourceNames } from '@/components/front/storyText'

/** Noticia en lista: titular + datos breves a la izquierda, foto a la derecha. */
export default function NewsRow({ story, showCategory = true }) {
  const { t } = useI18n()
  const first = sourceNames(story)[0]
  return (
    <Link to={`/story/${story.id}`} onClick={() => haptic()} className="flex gap-4 py-4 active:opacity-70">
      <div className="min-w-0 flex-1">
        {showCategory && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
            {story.is_breaking ? <span className="text-destructive">{t('home.breaking')}</span> : getCategoryLabel(story.category, t)}
          </p>
        )}
        <h3 className="line-clamp-3 font-display text-[18px] font-semibold leading-[1.18] text-foreground">{story.title}</h3>
        <p className="mt-1.5 text-[12.5px] text-muted-foreground">
          {first && <span>{first}</span>}
          {first && ' · '}
          {formatRelativeTime(story.updated_date || story.published_at)}
        </p>
      </div>
      <StoryImage story={story} className="h-[84px] w-[84px] shrink-0 overflow-hidden rounded-xl object-cover" />
    </Link>
  )
}
