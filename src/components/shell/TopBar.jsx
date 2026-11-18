import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useI18n } from '@/lib/i18n/I18nContext'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

/** Barra de periódico: menú (tres rayas), cabecera gótica y lupa en la portada. */
export default function TopBar({ onMenu }) {
  const { t } = useI18n()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const home = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > (home ? 150 : 8))
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [home])

  return (
    <header className={cn('safe-top sticky top-0 z-40 bg-background transition-[border-color] duration-300', scrolled ? 'border-b border-foreground' : 'border-b border-transparent')}>
      <div className="safe-x mx-auto flex h-14 max-w-3xl items-center justify-between">
        <button
          type="button"
          onClick={() => {
            haptic()
            onMenu()
          }}
          className="-ml-2 flex h-11 w-11 flex-col items-center justify-center gap-[5px] transition active:scale-90"
          aria-label={t('nav.open')}
        >
          <span className="h-[2px] w-[22px] bg-foreground" />
          <span className="h-[1px] w-[22px] bg-foreground" />
          <span className="h-[2px] w-[22px] bg-foreground" />
        </button>
        <Link
          to="/"
          className={cn('font-masthead text-[28px] leading-none text-foreground transition-opacity duration-300', home && !scrolled ? 'opacity-0' : 'opacity-100')}
        >
          Renivya
        </Link>
        {home ? (
          <Link to="/search" onClick={() => haptic()} className="-mr-2 flex h-11 w-11 items-center justify-center text-foreground active:scale-90" aria-label={t('nav.search')}>
            <Search className="h-[21px] w-[21px]" strokeWidth={1.8} />
          </Link>
        ) : (
          <span className="w-11" />
        )}
      </div>
    </header>
  )
}
