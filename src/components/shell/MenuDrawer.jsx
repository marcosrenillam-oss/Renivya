import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, ChartColumn, Flame, Globe2, Newspaper, Search, UserRound, X } from 'lucide-react'
import Logo from '@/components/branding/Logo'
import { useI18n } from '@/lib/i18n/I18nContext'
import { useAuth } from '@/lib/AuthContext'
import { getCountryName } from '@/lib/countries'
import { flagEmoji } from '@/lib/flags'
import { haptic } from '@/lib/haptics'
import { formatRelativeTime } from '@/lib/format'
import { getSnapshotMeta } from '@/lib/snapshotSync'
import { cn } from '@/lib/utils'

const MAIN = [
  { to: '/', key: 'nav.home', icon: Newspaper, end: true },
  { to: '/top-stories', key: 'nav.top', icon: Flame },
  { to: '/world', key: 'nav.world', icon: Globe2 },
]
const MORE = [
  { to: '/search', key: 'nav.search', icon: Search },
  { to: '/saved', key: 'nav.saved', icon: Bookmark },
  { to: '/profile', key: 'nav.profile', icon: UserRound },
  { to: '/analytics', key: 'nav.analytics', icon: ChartColumn },
]

/** Menú a pantalla completa desde la izquierda (cielo nocturno), con las secciones de la app. */
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
    <motion.li key={it.to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.06 + i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <NavLink
        to={it.to}
        end={it.end}
        onClick={() => {
          haptic()
          onClose()
        }}
        className={({ isActive }) =>
          cn(
            'group flex items-center gap-4 rounded-2xl px-3 transition-colors',
            big ? 'py-3' : 'py-2.5',
            isActive ? 'bg-white/[0.08] text-[#F3D88E]' : 'text-white/85 active:bg-white/[0.06]'
          )
        }
      >
        <it.icon className={cn('shrink-0', big ? 'h-6 w-6' : 'h-5 w-5 opacity-70')} strokeWidth={1.6} />
        <span className={big ? 'font-display text-[28px] font-semibold leading-none' : 'text-[16px] font-medium'}>{t(it.key)}</span>
      </NavLink>
    </motion.li>
  )

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t('nav.open')}>
          <motion.button
            type="button"
            aria-label={t('nav.close')}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.nav
            className="safe-top absolute inset-y-0 left-0 flex w-[86%] max-w-[380px] flex-col overflow-y-auto text-white shadow-2xl"
            style={{ background: 'radial-gradient(140% 60% at 0% 0%, #1B2D57 0%, #0E1A33 50%, #070D1C 100%)' }}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.4, right: 0 }}
            onDragEnd={(_, info) => info.offset.x < -80 && onClose()}
          >
            <div className="flex items-center justify-between px-5 pt-4">
              <Logo size={40} withWordmark className="[&>span]:text-white" />
              <button type="button" onClick={onClose} className="rounded-full p-2 text-white/60" aria-label={t('nav.close')}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <ul className="mt-8 space-y-1 px-3">{MAIN.map((it, i) => item(it, i, true))}</ul>
            <div className="mx-6 my-6 h-px bg-white/10" />
            <ul className="space-y-0.5 px-3">{MORE.map((it, i) => item(it, i + MAIN.length, false))}</ul>

            <div className="flex-1" />
            <div className="space-y-1 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 text-[13px] text-white/50">
              <p>
                <span className="mr-1.5">{flagEmoji(country)}</span>
                {t('nav.edition', { country: getCountryName(country, locale) })} · {locale === 'es' ? 'Español' : 'English'}
              </p>
              {meta?.generated_at && <p>{t('nav.updated', { time: formatRelativeTime(meta.generated_at) })}</p>}
            </div>
          </motion.nav>
        </div>
      )}
    </AnimatePresence>
  )
}
