import { AnimatePresence, motion } from 'framer-motion'
import { Share, SquarePlus, X } from 'lucide-react'
import Logo from '@/components/branding/Logo'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n/I18nContext'
import { usePwaInstall } from '@/lib/pwa'
import { cn } from '@/lib/utils'

/**
 * Invitación a instalar RENIVYA como app.
 * variant="banner": tarjeta descartable en el AppShell.
 * variant="inline": bloque permanente (Ajustes), ignora el descarte.
 */
export default function InstallPrompt({ variant = 'banner', className }) {
  const { t } = useI18n()
  const { available, dismissed, dismiss, ios, canPrompt, promptInstall, standalone } = usePwaInstall()

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-start gap-4', className)}>
        <Logo size={44} />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="type-h3">{standalone ? t('pwa.installed') : t('pwa.title')}</p>
          {!standalone && <InstallSteps ios={ios} canPrompt={canPrompt} onInstall={promptInstall} t={t} />}
        </div>
      </div>
    )
  }

  const show = available && !dismissed
  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className={cn('glass-card relative mb-8 flex items-start gap-4 p-4 pr-11 sm:p-5 sm:pr-12', className)}
          aria-label={t('pwa.title')}
        >
          <Logo size={40} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="type-h3">{t('pwa.title')}</p>
            <InstallSteps ios={ios} canPrompt={canPrompt} onInstall={promptInstall} t={t} />
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('common.close')}
            className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function InstallSteps({ ios, canPrompt, onInstall, t }) {
  if (canPrompt) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p className="type-small text-muted-foreground">{t('pwa.body')}</p>
        <Button size="sm" onClick={onInstall}>{t('pwa.install')}</Button>
      </div>
    )
  }
  if (ios) {
    return (
      <p className="type-small text-muted-foreground">
        {t('pwa.iosStep1')} <Share className="mx-0.5 inline h-4 w-4 -translate-y-px text-accent" aria-label="Compartir" />{' '}
        {t('pwa.iosStep2')} <SquarePlus className="mx-0.5 inline h-4 w-4 -translate-y-px text-accent" aria-hidden="true" />{' '}
        <strong className="font-semibold text-foreground">{t('pwa.iosAction')}</strong>.
      </p>
    )
  }
  return <p className="type-small text-muted-foreground">{t('pwa.generic')}</p>
}
