import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Moon, Search, Settings, Sun, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import LanguageSelector from '@/components/layout/LanguageSelector'
import { SymbolMenu } from '@/components/layout/NavMenu'
import { sectionForPath } from '@/components/layout/navItems'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { formatDate } from '@/lib/format'

function initials(user) {
  const source = user?.full_name || user?.email || '?'
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function Header() {
  const { t, locale } = useI18n()
  const { user } = useAuth()
  const { resolvedTheme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const section = sectionForPath(pathname)

  function onSearch(e) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search')
  }

  return (
    <header className="glass-panel safe-top sticky top-0 z-20 border-x-0 border-t-0">
      <div className="safe-x mx-auto flex h-16 max-w-6xl items-center gap-3 sm:px-6 lg:px-10">
        <div className="md:hidden">
          <SymbolMenu size={34} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="eyebrow truncate">{formatDate(new Date(), locale, 'dddd, LL')}</p>
          {section && <p className="truncate font-heading text-base font-semibold leading-tight">{t(section.labelKey)}</p>}
        </div>

        <form onSubmit={onSearch} className="relative hidden w-72 lg:block" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('header.searchPlaceholder')}
            aria-label={t('nav.search')}
            className="h-9 w-full rounded-full border bg-card/50 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </form>

        <Button variant="ghost" size="icon" className="text-muted-foreground lg:hidden" asChild>
          <Link to="/search" aria-label={t('nav.search')}>
            <Search />
          </Link>
        </Button>

        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={toggleTheme} aria-label={t('header.toggleTheme')}>
          {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
        </Button>

        <LanguageSelector compact className="hidden sm:inline-flex" />

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={t('header.account')}>
            <Avatar className="h-8 w-8 border">
              <AvatarFallback>{initials(user)}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <span className="block truncate text-sm font-semibold text-foreground">{user?.full_name || t('header.account')}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile"><UserRound />{t('nav.profile')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings"><Settings />{t('nav.settings')}</Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="sm:hidden" onSelect={(e) => e.preventDefault()}>
              <LanguageSelector compact className="-ml-2 h-6 px-2" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
