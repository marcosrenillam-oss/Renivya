import { useSyncExternalStore } from 'react'

/**
 * Preferencia guardada en este dispositivo (localStorage) y compartida entre pantallas:
 * cualquier cambio se ve al momento en todas las que la usan.
 */
export function createLocalStore(key, fallback) {
  const listeners = new Set()
  const read = () => {
    try {
      const raw = localStorage.getItem(key)
      return raw == null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  }
  let cache = read()
  const set = (next) => {
    cache = typeof next === 'function' ? next(cache) : next
    try {
      localStorage.setItem(key, JSON.stringify(cache))
    } catch {
      /* sin persistencia (modo privado) */
    }
    listeners.forEach((fn) => fn())
  }
  const subscribe = (fn) => {
    listeners.add(fn)
    return () => listeners.delete(fn)
  }
  const use = () => useSyncExternalStore(subscribe, () => cache, () => fallback)
  return { use, set, get: () => cache }
}
