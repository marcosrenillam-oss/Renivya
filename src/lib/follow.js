import { useCallback, useSyncExternalStore } from 'react'

/**
 * Historias que sigues: se guarda la última versión que has visto de cada una. Si la historia
 * cambia de versión, aparece como "Actualizada" en la portada hasta que vuelves a abrirla.
 */
const KEY = 'renivya:following'
const listeners = new Set()

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}
let cache = read()

function write(next) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* sin persistencia */
  }
  listeners.forEach((fn) => fn())
}

const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useFollowing() {
  const map = useSyncExternalStore(subscribe, () => cache)
  const toggle = useCallback((story) => {
    const next = { ...cache }
    if (next[story.id]) delete next[story.id]
    else next[story.id] = { seen: story.version || 1, at: new Date().toISOString() }
    write(next)
  }, [])
  const markSeen = useCallback((story) => {
    const cur = cache[story.id]
    if (cur && cur.seen !== (story.version || 1)) write({ ...cache, [story.id]: { ...cur, seen: story.version || 1 } })
  }, [])
  return { map, isFollowing: (id) => Boolean(map[id]), hasNews: (s) => Boolean(map[s.id] && (s.version || 1) > map[s.id].seen), toggle, markSeen }
}
