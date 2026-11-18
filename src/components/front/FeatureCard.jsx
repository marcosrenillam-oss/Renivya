import { Link } from 'react-router-dom'
import StoryImage from '@/components/story/StoryImage'
import TiltCard from '@/components/premium/TiltCard'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { haptic } from '@/lib/haptics'
import { sourcesLabel } from '@/components/front/storyText'
import { cn } from '@/lib/utils'

/**
 * Noticia destacada: foto a sangre que se mueve despacio, degradado y panel de cristal con
 * el titular. Se inclina en 3D al tocarla.
 */
export default function FeatureCard({ story, rank, tall = false, showSummary = true }) {
  const { t } = useI18n()
  return (
    <TiltCard max={7} className="rounded-[28px]">
      <Link
        to={`/story/${story.id}`}
        onClick={() => haptic()}
        className={cn('relative block overflow-hidden rounded-[28px] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]', tall ? 'aspect-[4/5]' : 'aspect-[5/4]')}
      >
        <div className="ken-burns absolute inset-0">
          <StoryImage story={story} className="h-full w-full" eager={rank === 1} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between">
          <span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
            {story.is_breaking ? t('home.breaking') : getCategoryLabel(story.category, t)}
          </span>
          {rank != null && (
            <span className="flex h-9 min-w-9 items-center justify-center rounded-full border border-white/25 bg-white/15 px-2 font-display text-[17px] font-bold text-white backdrop-blur-md">{rank}</span>
          )}
        </div>
        <div className="absolute inset-x-2.5 bottom-2.5 rounded-[22px] border border-white/15 bg-white/10 p-4 text-white backdrop-blur-xl" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}>
          <h3 className="font-display text-[22px] font-bold leading-[1.12] [text-shadow:0_2px_12px_rgba(0,0,0,0.35)]">{story.title}</h3>
          {showSummary && story.summary && <p className="mt-1.5 line-clamp-2 text-[13.5px] leading-snug text-white/80">{story.summary}</p>}
          <p className="mt-2 truncate text-[11.5px] font-medium text-white/65">{sourcesLabel(story, t, 3)}</p>
        </div>
      </Link>
    </TiltCard>
  )
}
