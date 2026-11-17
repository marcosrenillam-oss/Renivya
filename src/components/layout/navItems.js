import {
  Newspaper, Flame, LayoutGrid, Globe2, Share2, Search, Bookmark, BarChart3, BrainCircuit, UserRound, Settings,
} from 'lucide-react'

/** Única fuente de verdad de la navegación. */
export const NAV_ITEMS = {
  home: { to: '/', labelKey: 'nav.home', icon: Newspaper, end: true },
  topStories: { to: '/top-stories', labelKey: 'nav.topStories', icon: Flame },
  categories: { to: '/categories', labelKey: 'nav.categories', icon: LayoutGrid },
  world: { to: '/world', labelKey: 'nav.world', icon: Globe2 },
  network: { to: '/network', labelKey: 'nav.network', icon: Share2 },
  search: { to: '/search', labelKey: 'nav.search', icon: Search },
  analytics: { to: '/analytics', labelKey: 'nav.analytics', icon: BarChart3 },
  saved: { to: '/saved', labelKey: 'nav.saved', icon: Bookmark },
  profile: { to: '/profile', labelKey: 'nav.profile', icon: UserRound },
  settings: { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  brain: { to: '/brain', labelKey: 'nav.brain', icon: BrainCircuit, adminOnly: true },
}

export const NAV_SECTIONS = [
  { key: 'nav.sectionRead', items: ['home', 'topStories', 'categories'] },
  { key: 'nav.sectionExplore', items: ['world', 'network', 'search', 'analytics'] },
  { key: 'nav.sectionYou', items: ['saved', 'profile', 'settings'] },
  { key: 'nav.sectionSystem', items: ['brain'] },
]

/** Móvil: 5 destinos principales en la barra inferior. */
export const BOTTOM_ITEMS = ['home', 'topStories', 'world', 'search', 'saved']

/** Tablet: rail con los destinos de lectura y exploración. */
export const RAIL_ITEMS = ['home', 'topStories', 'categories', 'world', 'network', 'search', 'saved']

export function visibleSections(user) {
  const isAdmin = user?.role === 'admin'
  return NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((id) => !NAV_ITEMS[id].adminOnly || isAdmin) })).filter(
    (s) => s.items.length
  )
}

/** Título de la sección activa a partir de la ruta. */
export function sectionForPath(pathname) {
  if (pathname.startsWith('/story/')) return { labelKey: 'page.story.title' }
  const entry = Object.values(NAV_ITEMS).find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))
  return entry ?? null
}
