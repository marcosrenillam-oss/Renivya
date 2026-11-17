// Historias relacionadas: entidades y palabras clave compartidas (Jaccard), determinista.
import { jaccard } from './semantic.ts'

export function relatedScore(a, b) {
  const ent = jaccard(a.entities || [], b.entities || [])
  const kw = jaccard(a.keywords || [], b.keywords || [])
  const sameCategory = a.category && a.category === b.category ? 0.1 : 0
  const sharedCountry = (a.countries || []).some((c) => (b.countries || []).includes(c)) ? 0.05 : 0
  return 0.6 * ent + 0.25 * kw + sameCategory + sharedCountry
}

/** Para cada historia, hasta `k` relacionadas por encima del umbral. */
export function computeRelatedStories(stories, { k = 4, threshold = 0.18 } = {}) {
  const out = new Map()
  for (const a of stories) {
    const ranked = stories
      .filter((b) => b.id !== a.id)
      .map((b) => ({ id: b.id, s: relatedScore(a, b) }))
      .filter((x) => x.s >= threshold)
      .sort((x, y) => y.s - x.s || String(x.id).localeCompare(String(y.id)))
      .slice(0, k)
      .map((x) => x.id)
    out.set(a.id, ranked)
  }
  return out
}
