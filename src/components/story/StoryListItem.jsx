import { Link } from 'react-router-dom'
import CategoryChip from '@/components/story/CategoryChip'
import Headline from '@/components/story/Headline'
import SaveButton from '@/components/story/SaveButton'
import StoryImage from '@/components/story/StoryImage'
import StoryMeta from '@/components/story/StoryMeta'
import StoryStateBadge from '@/components/story/StoryStateBadge'
import { getStoryInLocale } from '@/lib/i18n/storyLocale'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/** Fila de lista para feeds, búsqueda y guardadas. `rank` opcional (posición, no puntuación). */
export default function StoryListItem({ story: raw, rank, extra, className }) {
  const { locale } = useI18n()
  const { story } = getStoryInLocale(raw, locale)
  if (!story) return null
  return (
    <article className={cn('group', className)}>
      <Link to={`/story/${story.id}`} className="flex gap-4 py-5 sm:gap-6">
        {rank != null && <span className="w-7 shrink-0 pt-1 font-heading text-2xl font-semibold leading-none text-muted-foreground/50">{rank}</span>}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <CategoryChip category={story.category} />
            <StoryStateBadge story={story} />
          </div>
          <Headline story={story} size="h3" clamp={3} className="text-[1.15rem] transition-colors group-hover:text-primary/90 sm:text-[1.25rem]" />
          <p className="type-small mt-2 line-clamp-2 text-muted-foreground">{story.summary}</p>
          <div className="mt-3 flex items-center gap-3">
            <StoryMeta story={story} />
            {extra}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <StoryImage story={story} className="h-20 w-24 rounded-xl sm:h-24 sm:w-36" />
          <SaveButton storyId={story.id} />
        </div>
      </Link>
    </article>
  )
}
