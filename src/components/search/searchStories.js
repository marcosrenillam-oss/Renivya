import { foldAccents } from '../../../engine/normalizer.js'
import { normalizeEntityName } from '../../../engine/entities.js'

/**
 * Búsqueda local sobre las historias recientes (sin servidor de búsqueda).
 * Puntúa coincidencias en titular > entidades > palabras clave > entradilla > cuerpo.
 * Todas las palabras de la consulta deben aparecer (AND).
 */
export function searchStories(stories, query) {
  const terms = foldAccents(String(query || '').toLowerCase()).split(/\s+/).filter((w) => w.length >= 2)
  if (!terms.length) return []
  const fold = (x) => foldAccents(String(x || '').toLowerCase())
  return stories
    .map((s) => {
      const fields = [
        [fold(s.title), 6],
        [(s.entities || []).map(normalizeEntityName).join(' '), 5],
        [fold((s.keywords || []).join(' ')), 4],
        [fold(s.summary), 2],
        [fold((s.body || []).join(' ')), 1],
      ]
      let score = 0
      for (const term of terms) {
        const hit = fields.reduce((acc, [text, w]) => acc + (text.includes(term) ? w : 0), 0)
        if (!hit) return null
        score += hit
      }
      return { s, score: score + (s.renivya_score ?? 0) / 50 }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || String(a.s.id).localeCompare(String(b.s.id)))
    .map((x) => x.s)
}

/** Temas del momento: palabras clave y entidades más repetidas entre historias vivas. */
export function trendingTerms(stories, n = 12) {
  const freq = new Map()
  for (const s of stories) {
    for (const k of new Set([...(s.entities || []).slice(0, 5), ...(s.keywords || []).slice(0, 3)])) {
      const key = String(k)
      freq.set(key, (freq.get(key) || 0) + 1 + (s.renivya_score ?? 0) / 100)
    }
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([k]) => k)
}
