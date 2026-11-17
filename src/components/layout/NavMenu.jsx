import { Link, NavLink, matchPath, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '@/components/branding/Logo'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { BOTTOM_ITEMS, NAV_ITEMS, RAIL_ITEMS, visibleSections } from '@/components/layout/navItems'
import { useAuth } from '@/lib/AuthContext'
import { useI18n } from '@/lib/i18n/I18nContext'
import { cn } from '@/lib/utils'

/* ---------- Menú desplegable desde el símbolo (móvil / tablet) ---------- */

export function SymbolMenu({ size = 34, className }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const { pathname } = useLocation()
  const sections = visibleSections(user)
  const isActive = (item) => Boolean(matchPath({ path: item.to, end: Boolean(item.end) }, pathname))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn('rounded-[14px] transition-transform duration-300 hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className)}
        aria-label={t('nav.openMenu')}
      >
        <Logo size={size} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={10} className="w-64 p-2">
        {sections.map((section, i) => (
          <div key={section.key}>
            {i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel>{t(section.key)}</DropdownMenuLabel>
            {section.items.map((id) => {
              const item = NAV_ITEMS[id]
              const Icon = item.icon
              return (
                <DropdownMenuItem key={id} asChild>
                  {/* Link + clase string: el Slot de Radix no admite className-función de NavLink */}
                  <Link
                    to={item.to}
                    aria-current={isActive(item) ? 'page' : undefined}
                    className={cn('gap-3 py-2', isActive(item) && 'bg-primary/10 text-primary focus:bg-primary/15')}
                  >
                    <Icon aria-hidden="true" />
                    {t(item.labelKey)}
                  </Link>
                </DropdownMenuItem>
              )
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* ---------- Sidebar (escritorio ≥1280px) ---------- */

export function SidebarNav({ footer }) {
  const { t } = useI18n()
  const { user } = useAuth()
  return (
    <aside className="glass-panel safe-top fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-y-0 border-l-0 xl:flex">
      <div className="px-6 pb-6 pt-7">
        <NavLink to="/" aria-label={t('nav.home')}>
          <Logo size={36} withWordmark />
        </NavLink>
        <p className="type-caption mt-3 text-muted-foreground">{t('app.tagline')}</p>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6" aria-label={t('nav.menu')}>
        {visibleSections(user).map((section) => (
          <div key={section.key}>
            <p className="eyebrow px-3 pb-2">{t(section.key)}</p>
            <ul className="space-y-0.5">
              {section.items.map((id) => {
                const item = NAV_ITEMS[id]
                const Icon = item.icon
                return (
                  <li key={id}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                          isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <motion.span
                              layoutId="sidebar-active"
                              className="absolute inset-0 rounded-md bg-primary/10"
                              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                            />
                          )}
                          <Icon className={cn('relative h-[18px] w-[18px]', isActive && 'text-primary')} aria-hidden="true" />
                          <span className="relative">{t(item.labelKey)}</span>
                        </>
                      )}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
      {footer && <div className="border-t px-5 py-4">{footer}</div>}
    </aside>
  )
}

/* ---------- Rail (tablet 768–1279px) ---------- */

export function RailNav() {
  const { t } = useI18n()
  const { pathname } = useLocation()
  return (
    <aside className="glass-panel fixed inset-y-0 left-0 z-30 hidden w-[calc(76px+env(safe-area-inset-left))] flex-col items-center border-y-0 border-l-0 pb-5 pl-[env(safe-area-inset-left)] pt-[calc(env(safe-area-inset-top)+1.25rem)] md:flex xl:hidden">
      <SymbolMenu size={40} />
      <nav className="mt-8 flex flex-1 flex-col items-center gap-1.5" aria-label={t('nav.menu')}>
        {RAIL_ITEMS.map((id) => {
          const item = NAV_ITEMS[id]
          const Icon = item.icon
          return (
            <Tooltip key={id} delayDuration={250}>
              <TooltipTrigger asChild>
                <Link
                  to={item.to}
                  aria-label={t(item.labelKey)}
                  aria-current={matchPath({ path: item.to, end: Boolean(item.end) }, pathname) ? 'page' : undefined}
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-md transition-colors',
                    matchPath({ path: item.to, end: Boolean(item.end) }, pathname)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{t(item.labelKey)}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </aside>
  )
}

/* ---------- Barra inferior (móvil <768px) ---------- */

export function BottomNav() {
  const { t } = useI18n()
  return (
    <nav
      className="glass-strong bottom-safe fixed inset-x-3 z-40 rounded-2xl bg-card/90 md:hidden dark:bg-card/95"
      aria-label={t('nav.menu')}
    >
      <ul className="grid grid-cols-5">
        {BOTTOM_ITEMS.map((id) => {
          const item = NAV_ITEMS[id]
          const Icon = item.icon
          return (
            <li key={id}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn('flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="max-w-full truncate px-1">{t(item.labelKey)}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
