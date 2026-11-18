import { useQuery } from '@tanstack/react-query'
import { getSystemStatus, queryKeys } from '@/lib/dataService'
import { formatRelativeTime, hoursSince } from '@/lib/format'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/**
 * Estado del sistema en lenguaje editorial: frescura y volumen.
 * Nunca muestra SCORE ni confianza.
 */
export default function StatusBar({ className, variant = 'inline' }) {
  const { t, locale } = useI18n()
  const { data, isError } = useQuery({
    queryKey: queryKeys.systemStatus(),
    queryFn: getSystemStatus,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  })

  let tone = 'bg-muted-foreground/40'
  let primary = t('status.noData')
  if (isError) {
    tone = 'bg-warning'
    primary = t('status.offline')
  } else if (data && !data.isEmpty) {
    const age = hoursSince(data.lastUpdatedAt)
    tone = age != null && age < 3 ? 'bg-success' : 'bg-warning'
    primary = t('status.updated', { time: formatRelativeTime(data.lastUpdatedAt, locale) })
  }

  const parts = []
  if (data && !data.isEmpty && !isError) {
    parts.push(data.activeStories === 1 ? t('status.storiesOne') : t('status.stories', { count: data.activeStories }))
  }

  const badges = []
  if (data?.hasDemo && !data?.hasReal) badges.push(t('status.demo'))

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'type-caption flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground',
        variant === 'stacked' && 'flex-col items-start gap-1.5',
        className
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', tone)} aria-hidden="true" />
        {primary}
      </span>
      {parts.map((p) => (
        <span key={p} className="inline-flex items-center gap-2">
          {variant === 'inline' && <span aria-hidden="true">·</span>}
          {p}
        </span>
      ))}
      {badges.map((b) => (
        <span key={b} className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
          {b}
        </span>
      ))}
    </div>
  )
}
