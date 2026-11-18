import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import Logo from '@/components/branding/Logo'
import { useI18n } from '@/lib/i18n/I18nContext'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

/** Barra flotante de cristal: Cruz del Sur (menú), nombre y, en la portada, la lupa. */
export default function TopBar({ onMenu }) {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className="safe-top pointer-events-none sticky top-0 z-40">
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'pointer-events-auto mx-auto mt-2 flex h-14 max-w-3xl items-center justify-between rounded-full px-2 transition-all duration-500',
          scrolled || pathname.startsWith('/story') ? 'glass-premium mx-3 sm:mx-auto' : 'mx-1 border border-transparent'
        )}
      >
        <button
          type="button"
          onClick={() => {
            haptic()
            onMenu()
          }}
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-accent transition active:scale-90"
          aria-label={t('nav.open')}
        >
          <span className="absolute inset-1 rounded-full bg-accent/10 blur-md" />
          <motion.span animate={{ rotate: [0, 8, 0, -6, 0] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }} className="relative">
            <Logo size={30} bare />
          </motion.span>
        </button>
        <Link to="/" className="font-display text-[17px] font-bold tracking-[0.26em] text-foreground">
          RENIVYA
        </Link>
        {pathname === '/' ? (
          <Link to="/search" onClick={() => haptic()} className="flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 transition active:scale-90" aria-label={t('nav.search')}>
            <Search className="h-[21px] w-[21px]" strokeWidth={1.9} />
          </Link>
        ) : (
          <span className="w-11" />
        )}
      </motion.div>
    </header>
  )
}
