import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Error de carga (distinto de "vacío"). */
export default function FeedError({ onRetry, message }) {
  const { t } = useI18n()
  return (
    <div role="alert" className="glass-card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <AlertTriangle className="h-6 w-6 text-warning" aria-hidden="true" />
      <p className="type-h3">{message || t('feed.error')}</p>
      <p className="type-small text-muted-foreground">{t('common.errorBody')}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
          {t('common.retry')}
        </Button>
      )}
    </div>
  )
}
