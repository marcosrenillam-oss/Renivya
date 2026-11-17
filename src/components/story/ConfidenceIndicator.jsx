import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

const TONE = { confirmed: 'bg-success', high: 'bg-success', medium: 'bg-warning', low: 'bg-destructive', pending: 'bg-muted-foreground' }

/** Solidez de la información. Solo en el detalle y en Analítica (nunca en portada ni cronología). */
export default function ConfidenceIndicator({ status, value, showValue = true, className }) {
  const { t } = useI18n()
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="type-small font-medium">{t(`confidence.${status || 'pending'}`)}</span>
        {showValue && value != null && <span className="type-caption tabular-nums text-muted-foreground">{Math.round(value)}/100</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value ?? 0} aria-label={t('story.solidity')}>
        <div className={cn('h-full rounded-full transition-all duration-700', TONE[status] || TONE.pending)} style={{ width: `${Math.max(4, value ?? 0)}%` }} />
      </div>
    </div>
  )
}
