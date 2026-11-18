import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import StoryImage from '@/components/story/StoryImage'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { haptic } from '@/lib/haptics'
import { sourcesLabel } from '@/components/front/storyText'

/** Noticia principal de una sección: foto grande, titular y entradilla. */
export default function LeadCard({ story, rank }) {
  const { t } = useI18n()
  return (
    <motion.div whileTap={{ scale: 0.985 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
      <Link to={`/story/${story.id}`} onClick={() => haptic()} className="block">
        <div className="relative overflow-hidden rounded-2xl">
          <StoryImage story={story} className="aspect-[16/10] w-full object-cover" />
          {rank != null && (
            <span className="absolute left-3 top-3 flex h-8 min-w-8 items-center justify-center rounded-full bg-background/90 px-2 font-display text-[16px] font-bold text-foreground backdrop-blur">
              {rank}
            </span>
          )}
        </div>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent">
          {story.is_breaking ? <span className="text-destructive">{t('home.breaking')}</span> : getCategoryLabel(story.category, t)}
        </p>
        <h3 className="mt-1 font-display text-[23px] font-bold leading-[1.12] text-foreground">{story.title}</h3>
        {story.summary && <p className="mt-2 line-clamp-3 font-serif-text text-[15px] leading-relaxed text-muted-foreground">{story.summary}</p>}
        <p className="mt-2 text-[12.5px] text-muted-foreground">{sourcesLabel(story, t, 3)}</p>
      </Link>
    </motion.div>
  )
}
