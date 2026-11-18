import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n/I18nContext'
import { getCategoryLabel } from '@/lib/categories'
import { formatRelativeTime } from '@/lib/format'
import { getStoryImage } from '@/lib/storyImage'
import { haptic } from '@/lib/haptics'
import { sourceNames } from '@/components/front/storyText'

/** Foto real de la noticia (o nada): nunca una imagen inventada. */
export function StoryPhoto({ story, className, eager = false }) {
  const [ok, setOk] = useState(true)
  const img = getStoryImage(story)
  if (!img || !ok) return null
  return (
    <img
      src={img.url}
      alt={img.alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setOk(false)}
      className={className}
    />
  )
}

/**
 * Noticia en columna de periódico: sección, titular antiguo, entradilla y fuente; la foto a la
 * derecha. Las noticias se separan con la raya negra (la pone la lista).
 */
export default function NewsRow({ story, showCategory = true, summary = true }) {
  const { t } = useI18n()
  const first = sourceNames(story)[0]
  return (
    <Link to={`/story/${story.id}`} onClick={() => haptic()} className="flex gap-4 py-4 active:opacity-60">
      <div className="min-w-0 flex-1">
        {showCategory && (
          <p className={story.is_breaking ? 'kicker !text-destructive' : 'kicker'}>{story.is_breaking ? t('home.breaking') : getCategoryLabel(story.category, t)}</p>
        )}
        <h3 className="mt-1 font-display text-[19px] font-bold leading-[1.15] text-foreground">{story.title}</h3>
        {summary && story.summary && <p className="mt-1.5 line-clamp-2 font-serif-text text-[14px] leading-snug text-foreground/75">{story.summary}</p>}
        <p className="mt-1.5 text-[11.5px] italic text-muted-foreground">
          {first && <span>{first}</span>}
          {first && ' · '}
          {formatRelativeTime(story.updated_date || story.published_at)}
        </p>
      </div>
      <StoryPhoto story={story} className="h-[96px] w-[96px] shrink-0 self-start object-cover [filter:grayscale(0.15)_contrast(1.05)]" />
    </Link>
  )
}
