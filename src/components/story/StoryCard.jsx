import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import CategoryChip from '@/components/story/CategoryChip'
import Headline from '@/components/story/Headline'
import SaveButton from '@/components/story/SaveButton'
import StoryImage from '@/components/story/StoryImage'
import StoryMeta from '@/components/story/StoryMeta'
import StoryStateBadge from '@/components/story/StoryStateBadge'
import { getStoryImage } from '@/lib/storyImage'
import { getStoryInLocale } from '@/lib/i18n/storyLocale'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/**
 * Tarjeta de historia. Variantes:
 *  - lead: historia principal (imagen amplia, titular display, entradilla).
 *  - feature: tarjeta con imagen para rejillas.
 *  - compact: solo texto, para columnas laterales.
 * Lee traducciones existentes (getStoryInLocale) pero NUNCA las solicita.
 */
export default function StoryCard({ story: raw, variant = 'feature', index = 0, hideCategory = false, className }) {
  const { locale } = useI18n()
  const { story } = getStoryInLocale(raw, locale)
  if (!story) return null
  const to = `/story/${story.id}`

  if (variant === 'lead') {
    return (
      <motion.article initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className={cn('group', className)}>
        <Link to={to} className="grid gap-6 lg:grid-cols-[1.25fr_1fr] lg:gap-10">
          {/* Sin foto real, la composición decorativa no debe empujar el titular fuera de la pantalla en móvil. */}
          <StoryImage story={story} eager className={cn('aspect-[16/10] rounded-2xl lg:order-2 lg:aspect-[4/3.4]', !getStoryImage(story) && 'hidden lg:block')} />
          <div className="flex flex-col justify-center lg:order-1">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <CategoryChip category={story.category} size="md" />
              <StoryStateBadge story={story} />
            </div>
            <Headline story={story} size="display" as="h2" className="transition-colors group-hover:text-primary/90" />
            <p className="type-body mt-5 line-clamp-4 text-[1.0625rem] leading-relaxed text-text-secondary">{story.summary}</p>
            <div className="mt-6 flex items-center justify-between gap-3">
              <StoryMeta story={story} />
              <SaveButton storyId={story.id} />
            </div>
          </div>
        </Link>
      </motion.article>
    )
  }

  if (variant === 'compact') {
    return (
      <article className={cn('group relative', className)}>
        <Link to={to} className="block py-4">
          {(!hideCategory || story.is_breaking || story.status !== 'active') && (
            <div className="mb-2 flex items-center gap-2">
              {!hideCategory && <CategoryChip category={story.category} />}
              <StoryStateBadge story={story} />
            </div>
          )}
          <Headline story={story} size="h3" clamp={3} className="transition-colors group-hover:text-primary/90" />
          <StoryMeta story={story} className="mt-2" />
        </Link>
      </article>
    )
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className={cn('glass-card glass-hover group overflow-hidden', className)}
    >
      <Link to={to} className="flex h-full flex-col">
        <StoryImage story={story} className="aspect-[16/9]" />
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <CategoryChip category={story.category} />
            <StoryStateBadge story={story} />
          </div>
          <Headline story={story} size="h2" clamp={3} className="text-[1.25rem]" />
          <p className="type-small mt-3 line-clamp-3 text-muted-foreground">{story.summary}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-5">
            <StoryMeta story={story} />
            <SaveButton storyId={story.id} />
          </div>
        </div>
      </Link>
    </motion.article>
  )
}
