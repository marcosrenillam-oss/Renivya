import { Hammer } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Marcador temporal de las vistas que llegan en fases posteriores. */
export default function PagePlaceholder({ titleKey, phase }) {
  const { t } = useI18n()
  return (
    <div className="animate-fade-up space-y-10">
      <SectionHeader eyebrow={t('app.tagline')} title={t(titleKey)} size="display" as="h1" />
      <div className="glass-card flex items-start gap-4 p-6 sm:p-8">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Hammer className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="type-h3 mb-1">{t('common.inProgress')}</p>
          <p className="type-small text-muted-foreground">{t('common.inProgressBody', { phase })}</p>
        </div>
      </div>
    </div>
  )
}
