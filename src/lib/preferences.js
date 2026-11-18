import { createLocalStore } from '@/lib/localStore'
import { CATEGORY_PARENT } from '@/lib/categories'
import { foldAccents } from '../../engine/normalizer.js'

/** Secciones que el lector no quiere ver en Portada, Lo más importante y Mundo. */
export const hiddenSections = createLocalStore('renivya:hidden-sections', [])

export function useHiddenSections() {
  const hidden = hiddenSections.use()
  return {
    hidden,
    isHidden: (id) => hidden.includes(id),
    toggle: (id) => hiddenSections.set((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id])),
  }
}

/** ¿La historia es de una sección oculta (ella o su sección madre)? */
export function inHiddenSection(story, hidden) {
  if (!hidden.length || !story?.category) return false
  return hidden.includes(story.category) || hidden.includes(CATEGORY_PARENT[story.category])
}

/** Últimas búsquedas (las 8 más recientes, sin repetir). */
export const recentSearches = createLocalStore('renivya:recent-searches', [])

export function rememberSearch(q) {
  const term = String(q || '').trim()
  if (term.length < 2) return
  recentSearches.set((list) => [term, ...list.filter((x) => foldAccents(x.toLowerCase()) !== foldAccents(term.toLowerCase()))].slice(0, 8))
}

/**
 * Temas que sigues (palabras o nombres: "Ucrania", "Real Madrid"...). Se guarda cuándo
 * los miraste por última vez para contar las noticias nuevas desde entonces.
 */
export const followedTopics = createLocalStore('renivya:topics', [])

export function useTopics() {
  const topics = followedTopics.use()
  const key = (t) => foldAccents(String(t).toLowerCase().trim())
  return {
    topics,
    isFollowed: (term) => topics.some((x) => key(x.term) === key(term)),
    toggle: (term) =>
      followedTopics.set((list) => (list.some((x) => key(x.term) === key(term)) ? list.filter((x) => key(x.term) !== key(term)) : [{ term: String(term).trim(), seen: new Date().toISOString() }, ...list].slice(0, 20))),
    markSeen: (term) => followedTopics.set((list) => list.map((x) => (key(x.term) === key(term) ? { ...x, seen: new Date().toISOString() } : x))),
  }
}
