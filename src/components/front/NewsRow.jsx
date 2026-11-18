import { Link } from 'react-router-dom'
import StoryImage from '@/components/story/StoryImage'
import TiltCard from '@/components/premium/TiltCard'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { formatRelativeTime } from '@/lib/format'
import { haptic } from '@/lib/haptics'
import { sourceNames } from '@/components/front/storyText'

/** Noticia en lista: tarjeta de cristal con foto, sección, titular y fuente. */
export default function NewsRow({ story, showCategory = true }) {
  const { t } = useI18n()
  const first = sourceNames(story)[0]
  return (
    <TiltCard max={5} className="rounded-[22px]">
      <Link to={`/story/${story.id}`} onClick={() => haptic()} className="glass-premium flex gap-3.5 rounded-[22px] p-2.5 pr-3.5">
        <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-[16px] shadow-[0_10px_20px_-12px_rgba(0,0,0,0.5)]">
          <StoryImage story={story} className="h-full w-full" />
          {story.is_breaking && <span className="live-dot absolute left-2 top-2 h-2.5 w-2.5 rounded-full bg-destructive" />}
        </div>
        <div className="min-w-0 flex-1 py-0.5">
          {showCategory && (
            <p className="mb-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-accent">
              {story.is_breaking ? <span className="text-destructive">{t('home.breaking')}</span> : getCategoryLabel(story.category, t)}
            </p>
          )}
          <h3 className="line-clamp-3 font-display text-[16.5px] font-semibold leading-[1.2] text-foreground">{story.title}</h3>
          <p className="mt-1.5 truncate text-[12px] text-muted-foreground">
            {first && <span className="font-medium text-foreground/70">{first}</span>}
            {first && ' · '}
            {formatRelativeTime(story.updated_date || story.published_at)}
          </p>
        </div>
      </Link>
    </TiltCard>
  )
}
