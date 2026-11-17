// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Paso 3: agrupación de artículos en acontecimientos (Stories). Determinista.
import { cosine, jaccard } from './semantic.ts'
import { hash64, hoursBetween, stableSort } from './stats.ts'

export const DEFAULT_THRESHOLD = 0.5

/** Proximidad temporal: 1 si es simultáneo, ~0.37 a 48 h. */
function timeProximity(a, b) {
  const h = hoursBetween(a, b)
  return h == null ? 0.5 : Math.exp(-h / 48)
}

/**
 * Similitud entre dos documentos del pipeline:
 * { embedding, entities: Set<string>, published_at, canonical_url, content_hash }
 */
export function similarity(a, b) {
  if (a.canonical_url && a.canonical_url === b.canonical_url) return 1
  if (a.content_hash && a.content_hash === b.content_hash) return 1
  const sem = cosine(a.embedding, b.embedding)
  const ent = jaccard(a.entities || [], b.entities || [])
  const time = timeProximity(a.published_at, b.published_at)
  return 0.7 * sem + 0.2 * ent + 0.1 * time
}

/**
 * Clustering aglomerativo por enlace medio (orden de entrada estable por fecha e id).
 * Devuelve arrays de índices.
 */
export function clusterDocuments(docs, { threshold = DEFAULT_THRESHOLD } = {}) {
  const order = stableSort(
    docs.map((d, i) => ({ ...d, _i: i })),
    (a, b) => String(a.published_at || '').localeCompare(String(b.published_at || '')),
    (d) => d.key ?? d._i
  )
  const sim = new Map()
  const S = (i, j) => {
    const k = i < j ? `${i}:${j}` : `${j}:${i}`
    if (!sim.has(k)) sim.set(k, similarity(docs[i], docs[j]))
    return sim.get(k)
  }
  const clusters = []
  for (const d of order) {
    let best = -1
    let bestScore = threshold
    clusters.forEach((cluster, ci) => {
      const avg = cluster.reduce((acc, j) => acc + S(d._i, j), 0) / cluster.length
      const max = Math.max(...cluster.map((j) => S(d._i, j)))
      // enlace medio, con atajo para duplicados casi exactos
      const score = max >= 0.92 ? max : avg
      if (score > bestScore) {
        bestScore = score
        best = ci
      }
    })
    if (best === -1) clusters.push([d._i])
    else clusters[best].push(d._i)
  }
  return clusters
}

/** Centroide normalizado de varios embeddings. */
export function centroid(vectors) {
  const valid = vectors.filter(Boolean)
  if (!valid.length) return null
  const dims = valid[0].length
  const out = new Array(dims).fill(0)
  for (const v of valid) for (let i = 0; i < dims; i++) out[i] += v[i]
  const n = Math.sqrt(out.reduce((a, x) => a + x * x, 0)) || 1
  return out.map((x) => x / n)
}

/**
 * Asigna documentos nuevos a Stories existentes (perfil = centroide + entidades + última fecha).
 * Devuelve Map<docIndex, storyId> solo para asignaciones por encima del umbral.
 */
export function assignToStories(docs, profiles, { threshold = DEFAULT_THRESHOLD + 0.05 } = {}) {
  const out = new Map()
  docs.forEach((d, i) => {
    let bestId = null
    let best = threshold
    for (const p of profiles) {
      if (p.urls?.has(d.canonical_url)) {
        bestId = p.story_id
        best = 1
        break
      }
      const s = similarity(d, { embedding: p.centroid, entities: p.entities, published_at: p.last_published_at })
      if (s > best || (s === best && bestId && p.story_id < bestId)) {
        best = s
        bestId = p.story_id
      }
    }
    if (bestId) out.set(i, bestId)
  })
  return out
}

/** Id de grupo estable: hash de la URL canónica (o hash) del miembro más antiguo. */
export function duplicateGroupId(members) {
  const first = stableSort(members, (a, b) => String(a.published_at || '').localeCompare(String(b.published_at || '')), (m) => m.canonical_url || m.content_hash)[0]
  return `grp_${hash64(first?.canonical_url || first?.content_hash || '').slice(0, 12)}`
}
