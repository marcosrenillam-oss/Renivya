import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { useAuth } from '@/lib/AuthContext'
import { getCountryName } from '@/lib/countries'
import { flagEmoji } from '@/lib/flags'
import { haptic } from '@/lib/haptics'
import { formatRelativeTime } from '@/lib/format'
import { getSnapshotMeta } from '@/lib/snapshotSync'
import { cn } from '@/lib/utils'

const MAIN = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/top-stories', key: 'nav.top' },
  { to: '/world', key: 'nav.world' },
]
const MORE = [
  { to: '/search', key: 'nav.search' },
  { to: '/saved', key: 'nav.saved' },
  { to: '/profile', key: 'nav.profile' },
  { to: '/analytics', key: 'nav.analytics' },
]

/** Menú como índice de periódico: cabecera gótica, secciones entre rayas. */
export default function MenuDrawer({ open, onClose }) {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const meta = getSnapshotMeta()
  const country = user?.country || 'ES'

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const item = (it, i, big) => (
    <motion.li key={it.to} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.035, duration: 0.3 }} className="border-b border-foreground/20 last:border-b-0">
      <NavLink
        to={it.to}
        end={it.end}
        onClick={() => {
          haptic()
          onClose()
        }}
        className={({ isActive }) => cn('flex items-baseline justify-between py-3', isActive ? 'text-foreground' : 'text-foreground/75')}
      >
        {({ isActive }) => (
          <>
            <span className={big ? 'font-display text-[28px] font-bold leading-tight' : 'font-serif-text text-[17px]'}>{t(it.key)}</span>
            {isActive && <span className="h-2 w-2 rounded-full bg-destructive" />}
          </>
        )}
      </NavLink>
    </motion.li>
  )

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('nav.open')}>
          <motion.button type="button" aria-label={t('nav.close')} className="absolute inset-0 bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.nav
            className="safe-top grain absolute inset-y-0 left-0 flex w-[84%] max-w-[370px] flex-col overflow-y-auto border-r border-foreground bg-background text-foreground shadow-2xl"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.4, right: 0 }}
            onDragEnd={(_, info) => info.offset.x < -80 && onClose()}
          >
            <div className="flex justify-end px-3 pt-3">
              <button type="button" onClick={onClose} className="p-2 text-foreground/70" aria-label={t('nav.close')}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6">
              <div className="rule-thick" />
              <p className="font-masthead py-1 text-center text-[46px] leading-tight">Renivya</p>
              <div className="rule-double" />
              <p className="py-1.5 text-center text-[10.5px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {flagEmoji(country)} {t('nav.edition', { country: getCountryName(country, locale) })} · {locale === 'es' ? 'Español' : 'English'}
              </p>
              <div className="rule-top" />
            </div>
            <ul className="mt-2 px-6">{MAIN.map((it, i) => item(it, i, true))}</ul>
            <div className="mx-6 mt-4 rule-thick" />
            <ul className="px-6">{MORE.map((it, i) => item(it, i + MAIN.length, false))}</ul>
            <div className="flex-1" />
            {meta?.generated_at && (
              <p className="px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 text-[12px] italic text-muted-foreground">{t('nav.updated', { time: formatRelativeTime(meta.generated_at) })}</p>
            )}
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  )
}
