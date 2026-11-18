import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import Logo from '@/components/branding/Logo'
import { useI18n } from '@/lib/i18n/I18nContext'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

/** Barra superior mínima: Cruz del Sur (abre el menú), nombre y, en la portada, la lupa. */
export default function TopBar({ onMenu }) {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'safe-top sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300',
        scrolled ? 'bg-background/80 shadow-[0_1px_0_hsl(var(--border))] backdrop-blur-xl' : 'bg-transparent'
      )}
    >
      <div className="safe-x mx-auto flex h-14 max-w-3xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
            haptic()
            onMenu()
          }}
          className="-ml-1.5 flex h-11 w-11 items-center justify-center rounded-full text-accent transition active:scale-90"
          aria-label={t('nav.open')}
        >
          <Logo size={30} bare />
        </button>
        <Link to="/" className="font-display text-[17px] font-bold tracking-[0.22em] text-foreground">
          RENIVYA
        </Link>
        {pathname === '/' ? (
          <Link to="/search" onClick={() => haptic()} className="-mr-1.5 flex h-11 w-11 items-center justify-center rounded-full text-foreground/80 active:scale-90" aria-label={t('nav.search')}>
            <Search className="h-[22px] w-[22px]" strokeWidth={1.8} />
          </Link>
        ) : (
          <span className="w-11" />
        )}
      </div>
    </header>
  )
}
