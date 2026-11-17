import CountryFlags from '@/components/story/CountryFlags'
import { formatRelativeTime } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/** Metadatos editoriales: hora, nº de fuentes y países. Sin SCORE ni confianza. */
export default function StoryMeta({ story, className, showCountries = true }) {
  const { t, locale } = useI18n()
  const count = story.source_count ?? (story.sources || []).length
  const time = story.updated_date && story.version > 1 ? story.updated_date : story.published_at
  return (
    <div className={cn('type-caption flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground', className)}>
      {time && <time dateTime={time}>{formatRelativeTime(time, locale)}</time>}
      {count > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <span>{count === 1 ? t('story.sourcesOne') : t('story.sources', { count })}</span>
        </>
      )}
      {showCountries && (story.countries || []).length > 0 && (
        <>
          <span aria-hidden="true">·</span>
          <CountryFlags countries={story.countries} />
        </>
      )}
    </div>
  )
}
