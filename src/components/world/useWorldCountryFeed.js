import { useMemo } from 'react'

/** Historias de un país a partir del conjunto ya cargado (orden por relevancia). */
export function useWorldCountryFeed(stories, code) {
  return useMemo(() => {
    if (!code) return []
    return stories
      .filter((s) => (s.countries || []).includes(code) && s.status !== 'archived')
      .sort((a, b) => (b.renivya_score ?? 0) - (a.renivya_score ?? 0))
  }, [stories, code])
}
