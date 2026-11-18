import { foldAccents } from '../../../engine/normalizer.js'
import { normalizeEntityName } from '../../../engine/entities.js'

const STOP = new Set('de del la las el los un una unos unas y o en a al por para con sin que se su sus lo es the of to in and for on at by an or is are was with from'.split(' '))

/** Equivalencias habituales (siglas, nombres en otro idioma, apodos). */
const SYNONYM_GROUPS = [
  ['eeuu', 'ee uu', 'usa', 'estados unidos', 'united states', 'us'],
  ['uk', 'reino unido', 'united kingdom', 'britain', 'gran bretana'],
  ['ue', 'eu', 'union europea', 'european union', 'bruselas', 'brussels'],
  ['ia', 'ai', 'inteligencia artificial', 'artificial intelligence'],
  ['onu', 'un', 'naciones unidas', 'united nations'],
  ['otan', 'nato'],
  ['barca', 'barcelona', 'azulgrana'],
  ['futbol', 'football', 'soccer'],
  ['china', 'pekin', 'beijing'],
  ['rusia', 'russia', 'moscu', 'moscow', 'kremlin'],
  ['ucrania', 'ukraine', 'kiev', 'kyiv'],
  ['elecciones', 'elections', 'election', 'electoral'],
]
const SYNONYMS = new Map()
for (const group of SYNONYM_GROUPS) for (const w of group) SYNONYMS.set(w, group)

const fold = (x) => foldAccents(String(x || '').toLowerCase())
const wordsOf = (text) => fold(text).split(/[^a-z0-9ñ]+/).filter(Boolean)

/** Distancia de edición acotada (corta en cuanto supera `max`). */
function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      best = Math.min(best, cur[j])
    }
    if (best > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

/** Índice de una historia para buscar rápido (campos con su peso). */
function indexStory(s) {
  const fields = [
    { text: fold(s.title), weight: 6 },
    { text: (s.entities || []).map(normalizeEntityName).join(' '), weight: 5 },
    { text: fold((s.keywords || []).join(' ')), weight: 4 },
    { text: fold(s.summary), weight: 2 },
    { text: fold((s.body || []).join(' ')), weight: 1, noFuzzy: true },
  ]
  for (const f of fields) f.words = f.noFuzzy ? null : [...new Set(wordsOf(f.text))]
  return fields
}

/** Cuánto encaja un término (y sus equivalencias) en una historia: 0 si nada. */
function termScore(term, fields) {
  const alts = SYNONYMS.get(term) || [term]
  let best = 0
  for (const f of fields) {
    for (const alt of alts) {
      if (alt.includes(' ')) {
        if (f.text.includes(alt)) best = Math.max(best, f.weight)
        continue
      }
      // Palabra exacta, palabra que empieza así (a medio escribir) o con una o dos letras cambiadas.
      if (new RegExp(`(^|[^a-z0-9ñ])${alt}([^a-z0-9ñ]|$)`).test(f.text)) best = Math.max(best, f.weight)
      else if (alt.length >= 3 && new RegExp(`(^|[^a-z0-9ñ])${alt}`).test(f.text)) best = Math.max(best, f.weight * 0.8)
      else if (f.words && alt.length >= 5) {
        const max = alt.length >= 8 ? 2 : 1
        if (f.words.some((w) => Math.abs(w.length - alt.length) <= max && editDistance(alt, w, max) <= max)) best = Math.max(best, f.weight * 0.6)
      }
    }
  }
  return best
}

/**
 * Búsqueda local sobre las historias recientes (sin servidor de búsqueda), tolerante:
 * palabras a medio escribir, faltas de una o dos letras, acentos y equivalencias (EE. UU. = USA).
 * Primero las que tienen todas las palabras; si no hay ninguna, las que tienen más.
 */
export function searchStoriesDetailed(stories, query) {
  const raw = wordsOf(query).filter((w) => w.length >= 2)
  // Equivalencias de varias palabras escritas tal cual ("estados unidos").
  const q = fold(query)
  const phrases = SYNONYM_GROUPS.flat().filter((p) => p.includes(' ') && q.includes(p))
  let terms = raw.filter((w) => !STOP.has(w) && !phrases.some((p) => p.split(' ').includes(w)))
  terms = [...phrases, ...terms]
  if (!terms.length) terms = raw
  if (!terms.length) return { results: [], partial: false }
  const scored = stories.map((s) => {
    const fields = indexStory(s)
    const per = terms.map((t) => termScore(t, fields))
    return { s, hits: per.filter((x) => x > 0).length, score: per.reduce((a, b) => a + b, 0) + (s.renivya_score ?? 0) / 50 }
  })
  const order = (a, b) => b.score - a.score || String(a.s.id).localeCompare(String(b.s.id))
  const all = scored.filter((x) => x.hits === terms.length).sort(order)
  if (all.length || terms.length === 1) return { results: all.map((x) => x.s), partial: false }
  const most = Math.max(0, ...scored.map((x) => x.hits))
  if (!most) return { results: [], partial: false }
  return { results: scored.filter((x) => x.hits === most).sort(order).slice(0, 40).map((x) => x.s), partial: true }
}

export function searchStories(stories, query) {
  return searchStoriesDetailed(stories, query).results
}

/**
 * Temas del momento: palabras clave y entidades más repetidas entre historias vivas.
 * Solo las que aparecen tal cual en el texto que lee el usuario (su idioma): nunca se mezclan.
 */
export function trendingTerms(stories, n = 12) {
  const freq = new Map()
  for (const s of stories) {
    const text = fold(`${s.title || ''} ${s.summary || ''} ${(s.body || []).join(' ')}`)
    const seen = new Set()
    // Solo nombres propios (personas, lugares, organizaciones) que aparecen tal cual en el texto.
    for (const raw of (s.entities || []).slice(0, 6)) {
      const name = String(raw).trim()
      const key = fold(name)
      if (!/^\p{Lu}/u.test(name) || key.length < 3 || seen.has(key) || !text.includes(key)) continue
      seen.add(key)
      const cur = freq.get(key) || { name, score: 0 }
      cur.score += 1 + (s.renivya_score ?? 0) / 100
      freq.set(key, cur)
    }
  }
  return [...freq.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)).slice(0, n).map((x) => x.name)
}
