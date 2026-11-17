import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/**
 * Estado editorial de la historia (sin métricas). "Activa" no se muestra: es el estado normal.
 */
export default function StoryStateBadge({ story, className }) {
  const { t } = useI18n()
  if (!story) return null
  if (story.is_breaking) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-primary-foreground', className)}>
        <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary-foreground" aria-hidden="true" />
        {t('story.breaking')}
      </span>
    )
  }
  const map = {
    developing: 'border-warning/40 text-warning',
    updated: 'border-accent/40 text-accent',
    resolved: 'border-success/40 text-success',
    archived: 'border-border text-muted-foreground',
  }
  const tone = map[story.status]
  if (!tone && !story.has_corrections) return null
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      {tone && <span className={cn('rounded-full border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em]', tone)}>{t(`storyStatus.${story.status}`)}</span>}
      {story.has_corrections && (
        <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{t('story.corrected')}</span>
      )}
    </span>
  )
}
