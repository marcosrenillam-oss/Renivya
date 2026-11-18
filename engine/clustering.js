// Paso 3: agrupación de artículos en acontecimientos (Stories). Determinista.
import { cosine, jaccard } from './semantic.js'
import { hash64, hoursBetween, stableSort } from './stats.js'

export const DEFAULT_THRESHOLD = 0.45
const MEMBER_MARGIN = 0.03
const NO_SHARED_KEYS = 0.75

const fold = (w) => w.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const ALIAS = { barca: 'barcelona', 'barça': 'barcelona', azulgrana: 'barcelona', azulgranas: 'barcelona', merengue: 'madrid', blancos: 'madrid', eeuu: 'estados', 'ee.uu': 'estados', usa: 'estados' }

/**
 * Nombres y cifras de un texto (lo que dos periódicos comparten cuando cuentan lo mismo):
 * palabras con mayúscula inicial, números con su unidad o marcador ("6,8", "2-1", "2%").
 */
const KEY_STOP = new Set('los las del una uno unos unas este esta estos estas ese esa por para con sin sobre tras ante entre como pero mas segun hoy ayer the this that these those and for with from after over into its his her their our new two'.split(' '))

export function keysOf(text) {
  const t = String(text || '')
  const nums = (t.match(/\d+(?:[.,]\d+)?(?:\s?%|-\d+)?/g) || []).map((n) => n.replace(/\s/g, ''))
  // Mayúscula a mitad de frase = nombre propio; la primera palabra de cada frase no cuenta
  // ("Police arrest...", "Detectives said..."), salvo que vuelva a aparecer dentro de una frase.
  const names = []
  for (const sentence of t.split(/(?:[.!?:;«»"“”]\s+|\n+)/)) {
    const words = sentence.match(/[A-ZÁÉÍÓÚÑ][\wáéíóúñüçàèìòùâêîôûäëïö]{2,}|\S+/g) || []
    words.slice(1).forEach((w) => /^[A-ZÁÉÍÓÚÑ][\wáéíóúñüçàèìòùâêîôûäëïö]{2,}$/.test(w) && names.push(w))
  }
  const folded = names.map(fold).filter((w) => !KEY_STOP.has(w)).map((w) => ALIAS[w] || w)
  return new Set([...nums, ...folded])
}

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
  // Con nombres y cifras disponibles se separan mucho mejor el mismo suceso y sucesos distintos.
  if (a.keys?.size && b.keys?.size) {
    const keys = jaccard(a.keys, b.keys)
    const score = 0.55 * sem + 0.15 * ent + 0.2 * keys + 0.1 * time
    // Sin ningún nombre ni cifra en común casi nunca es el mismo suceso (p. ej. dos detenciones distintas).
    return keys === 0 ? score * NO_SHARED_KEYS : score
  }
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
      // enlace medio, o el artículo más parecido con un margen (y atajo para duplicados casi exactos)
      const score = max >= 0.92 ? max : Math.max(avg, max - MEMBER_MARGIN)
      if (score > bestScore) {
        bestScore = score
        best = ci
      }
    })
    if (best === -1) clusters.push([d._i])
    else clusters[best].push(d._i)
  }
  return mergeClusters(clusters, sim, threshold)
}

/**
 * Segunda pasada: el orden de llegada puede abrir dos grupos para el mismo suceso. Se unen
 * cuando comparten un par de artículos muy parecidos y, de media, también se parecen.
 */
function mergeClusters(clusters, sim, threshold) {
  const owner = new Map()
  clusters.forEach((c, ci) => c.forEach((i) => owner.set(i, ci)))
  const parent = clusters.map((_, ci) => ci)
  const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])))
  const members = clusters.map((c) => [...c])
  const strong = [...sim.entries()].filter(([, s]) => s >= threshold + 0.05).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  for (const [key] of strong) {
    const [i, j] = key.split(':').map(Number)
    const a = find(owner.get(i))
    const b = find(owner.get(j))
    if (a === b) continue
    let total = 0
    let n = 0
    for (const x of members[a]) for (const y of members[b]) {
      const k = x < y ? `${x}:${y}` : `${y}:${x}`
      if (sim.has(k)) {
        total += sim.get(k)
        n++
      }
    }
    if (!n || total / n < threshold - 0.1) continue
    parent[b] = a
    members[a].push(...members[b])
    members[b] = []
  }
  return members.filter((c) => c.length)
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
export function assignToStories(docs, profiles, { threshold = DEFAULT_THRESHOLD } = {}) {
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
      // Con la media de la historia y con su artículo más parecido (un poco más exigente).
      // Para la media se usan los nombres y cifras del artículo que más comparte con el nuevo.
      const members = p.members || []
      const keys = d.keys?.size && members.length ? members.reduce((a, m) => (jaccard(d.keys, m.keys || []) > jaccard(d.keys, a) ? m.keys : a), new Set()) : undefined
      let s = similarity(d, { embedding: p.centroid, entities: p.entities, keys, published_at: p.last_published_at })
      for (const m of members) s = Math.max(s, similarity(d, m) - MEMBER_MARGIN)
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
