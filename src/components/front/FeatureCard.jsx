import { Link, useNavigate } from 'react-router-dom'
import { openStory } from '@/lib/storyTransition'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { getStoryImage } from '@/lib/storyImage'
import { sourcesLabel } from '@/components/front/storyText'
import { StoryPhoto } from '@/components/front/NewsRow'

/** Noticia destacada a la manera de un periódico: foto grande con pie, titular y entradilla. */
export default function FeatureCard({ story, rank, showSummary = true }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const img = getStoryImage(story)
  return (
    <Link to={`/story/${story.id}`} onClick={(e) => openStory(e, navigate, story.id)} className="block py-4 active:opacity-70">
      {img && (
        <figure className="mb-3 overflow-hidden">
          <StoryPhoto story={story} eager={rank === 1} className="aspect-[3/2] w-full object-cover [filter:grayscale(0.1)_contrast(1.05)]" />
          {img.credit && <figcaption className="mt-1 text-[10.5px] italic text-muted-foreground">{img.credit}</figcaption>}
        </figure>
      )}
      <div className="flex items-baseline gap-2">
        {rank != null && <span className="font-display text-[22px] font-black leading-none">{rank}.</span>}
        <p className={story.is_breaking ? 'kicker !text-destructive' : 'kicker'}>{story.is_breaking ? t('home.breaking') : getCategoryLabel(story.category, t)}</p>
      </div>
      <h3 className="mt-1 font-display text-[27px] font-black leading-[1.08] tracking-[-0.01em] text-foreground">{story.title}</h3>
      {showSummary && story.summary && <p className="mt-2 font-serif-text text-[15.5px] leading-relaxed text-foreground/80">{story.summary}</p>}
      <p className="mt-2 text-[11.5px] italic text-muted-foreground">{sourcesLabel(story, t, 3)}</p>
    </Link>
  )
}
