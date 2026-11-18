import { AnimatePresence, motion } from 'framer-motion'
import { Check, RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'

/** Aviso discreto de cristal bajo la barra: actualizando noticias / app al día. */
export default function UpdatePill({ state }) {
  const { t } = useI18n()
  const label = state === 'app' ? t('update.app') : state === 'syncing' ? t('update.news') : state === 'updated' ? t('update.done') : null
  return (
    <AnimatePresence>
      {label && (
        <motion.div
          key={state}
          initial={{ opacity: 0, y: -14, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed left-1/2 top-[calc(env(safe-area-inset-top)+4rem)] z-[60] -translate-x-1/2"
          role="status"
        >
          <div className="flex items-center gap-2 border border-foreground bg-background px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-foreground shadow-[0_8px_20px_-12px_rgba(0,0,0,0.5)]">
            {state === 'updated' ? <Check className="h-3.5 w-3.5 text-accent" /> : <RefreshCw className="h-3.5 w-3.5 animate-spin text-accent" />}
            {label}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
