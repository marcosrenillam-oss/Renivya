// Paso 1 del pipeline: limpieza, URL canónica, hash de contenido, idioma y país. Determinista.
import { hash64 } from './stats.ts'
import { CITY_GAZETTEER, COUNTRY_CODES, DEMONYMS } from './geo.ts'

const ENTITY_MAP = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–',
  laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', euro: '€', iexcl: '¡', iquest: '¿',
}

export function decodeEntities(text) {
  if (!text) return ''
  return String(text)
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITY_MAP[name.toLowerCase()] ?? m)
}

export function stripHtml(html) {
  if (!html) return ''
  return decodeEntities(
    String(html)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<(script|style|iframe|noscript)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h\d)>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
  )
}

/** Texto limpio: sin HTML, sin restos de "Leer más", espacios normalizados. */
export function cleanText(raw) {
  return stripHtml(raw)
    .replace(/\b(leer más|seguir leyendo|read more|continue reading|lire la suite|ler mais)\b.*$/gim, '')
    .replace(/\s*\[[^\]]{0,40}\]\s*/g, ' ')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

export function foldAccents(text) {
  return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Frases (heurística robusta a abreviaturas comunes). */
export function splitSentences(text) {
  if (!text) return []
  const protectedText = String(text).replace(/\b(Sr|Sra|Dr|Dra|Mr|Mrs|Ms|St|EE\.UU|etc|aprox|núm|No)\./g, '$1§')
  return protectedText
    .split(/(?<=[.!?…])\s+(?=[«"“¿¡A-ZÁÉÍÓÚÑÀÈÌÒÙÂÊÎÔÛÇ0-9])|\n+/)
    .map((s) => s.replace(/§/g, '.').trim())
    .filter((s) => s.length >= 25)
}

const TRACKING = /^(utm_\w+|fbclid|gclid|mc_cid|mc_eid|ref|ref_src|cmpid|ocid|at_\w+|__twitter_impression)$/i

/** URL canónica para deduplicación EXACTA. */
export function canonicalUrl(url) {
  if (!url) return null
  try {
    const u = new URL(String(url).trim())
    u.hash = ''
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '')
    u.protocol = 'https:'
    const keep = [...u.searchParams.entries()].filter(([k]) => !TRACKING.test(k)).sort(([a], [b]) => a.localeCompare(b))
    u.search = keep.length ? `?${new URLSearchParams(keep).toString()}` : ''
    let out = u.toString()
    if (out.endsWith('/') && u.pathname !== '/') out = out.slice(0, -1)
    return out
  } catch {
    return null
  }
}

/** Hash del contenido normalizado (clave de ArticleEmbedding). */
export function contentHash(text) {
  const normalized = foldAccents(String(text || '').toLowerCase()).replace(/\s+/g, ' ').trim()
  return hash64(normalized)
}

/* ---------------- idioma ---------------- */

const LANGUAGE_MARKERS = {
  es: ['el', 'la', 'los', 'las', 'de', 'del', 'que', 'y', 'en', 'por', 'para', 'con', 'una', 'según', 'tras', 'este', 'han', 'más', 'sus', 'pero'],
  en: ['the', 'of', 'and', 'to', 'in', 'that', 'is', 'for', 'on', 'with', 'was', 'by', 'has', 'have', 'from', 'after', 'said', 'its', 'are', 'will'],
  fr: ['le', 'la', 'les', 'des', 'du', 'et', 'est', 'une', 'dans', 'pour', 'que', 'qui', 'sur', 'avec', 'pas', 'selon', 'aux', 'été', 'ont', 'cette'],
  pt: ['o', 'os', 'as', 'do', 'da', 'dos', 'das', 'e', 'em', 'que', 'para', 'com', 'uma', 'não', 'segundo', 'após', 'pelo', 'pela', 'foi', 'são'],
  de: ['der', 'die', 'das', 'und', 'ist', 'nicht', 'mit', 'auf', 'für', 'ein', 'eine', 'den', 'von', 'zu', 'sich', 'dem', 'nach', 'wurde', 'auch', 'bei'],
  it: ['il', 'lo', 'gli', 'della', 'che', 'e', 'per', 'con', 'una', 'non', 'sono', 'nel', 'alla', 'dei', 'secondo', 'dopo', 'anche', 'questo', 'stato', 'più'],
}
const MARKER_SETS = Object.fromEntries(Object.entries(LANGUAGE_MARKERS).map(([k, v]) => [k, new Set(v)]))

/** Idioma por frecuencia de palabras funcionales. Devuelve { language, confidence }. */
export function detectLanguage(text, hint = null) {
  const words = String(text || '').toLowerCase().match(/[a-zàâäáãçéèêëíìîïñóòôöõúùûü]+/g) || []
  const scores = Object.fromEntries(Object.keys(MARKER_SETS).map((l) => [l, 0]))
  for (const w of words.slice(0, 600)) for (const [l, set] of Object.entries(MARKER_SETS)) if (set.has(w)) scores[l]++
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const [best, bestScore] = ranked[0]
  const second = ranked[1][1]
  const hinted = hint ? String(hint).toLowerCase().slice(0, 2) : null
  if (bestScore < 3) return { language: hinted || best, confidence: bestScore ? 0.3 : 0 }
  const confidence = Math.min(1, (bestScore - second) / Math.max(4, bestScore))
  if (hinted && hinted !== best && confidence < 0.2 && scores[hinted] >= second) return { language: hinted, confidence }
  return { language: best, confidence }
}

/* ---------------- país ---------------- */

const NAME_LOCALES = ['es', 'en', 'fr', 'pt', 'de', 'it']
const EXTRA_COUNTRY_ALIASES = {
  US: ['EEUU', 'EE.UU.', 'EE. UU.', 'USA', 'Estados Unidos de América', 'United States of America', 'U.S.'],
  GB: ['Reino Unido', 'UK', 'Gran Bretaña', 'Great Britain', 'Britain', 'Inglaterra', 'England'],
  KR: ['Corea del Sur', 'South Korea', 'Corée du Sud'],
  KP: ['Corea del Norte', 'North Korea', 'Corée du Nord'],
  CD: ['RDC', 'República Democrática del Congo', 'DR Congo'],
  AE: ['EAU', 'Emiratos', 'UAE', 'Emiratos Árabes Unidos'],
  NL: ['Holanda', 'Holland'],
  PS: ['Cisjordania', 'West Bank', 'Franja de Gaza', 'Gaza Strip'],
  CZ: ['Chequia', 'Czechia'],
  TR: ['Turquía', 'Türkiye', 'Turkey'],
}
const CASE_SENSITIVE = new Set(['UK', 'USA', 'EEUU', 'EE.UU.', 'EE. UU.', 'U.S.', 'RDC', 'EAU', 'UAE'])

let countryMatchers = null

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildCountryMatchers() {
  const out = []
  const add = (code, alias, weight) => {
    if (!alias || alias.length < 3) return
    if (CASE_SENSITIVE.has(alias)) {
      out.push({ code, weight, re: new RegExp(`(?<![\\p{L}])${escapeRegex(alias)}(?![\\p{L}])`, 'u'), folded: false })
    } else {
      const f = foldAccents(alias.toLowerCase())
      out.push({ code, weight, re: new RegExp(`(?<![\\p{L}])${escapeRegex(f)}(?![\\p{L}])`, 'u'), folded: true })
    }
  }
  for (const code of COUNTRY_CODES) {
    const names = new Set()
    for (const locale of NAME_LOCALES) {
      try {
        const n = new Intl.DisplayNames([locale], { type: 'region' }).of(code)
        if (n && n !== code) names.add(n)
      } catch {
        /* Intl sin datos regionales */
      }
    }
    for (const n of EXTRA_COUNTRY_ALIASES[code] || []) names.add(n)
    for (const n of names) add(code, n, 3)
    for (const d of DEMONYMS[code] || []) add(code, d, 1)
  }
  for (const city of CITY_GAZETTEER) for (const n of [city.name, ...city.aliases]) add(city.country, n, 2)
  return out
}

/** Países mencionados, ordenados por peso. Devuelve [{ code, weight }]. */
export function detectCountries(text) {
  if (!text) return []
  countryMatchers ??= buildCountryMatchers()
  const original = String(text)
  const folded = foldAccents(original.toLowerCase())
  const totals = new Map()
  for (const m of countryMatchers) {
    const hay = m.folded ? folded : original
    const matches = hay.match(new RegExp(m.re.source, 'gu'))
    if (matches) totals.set(m.code, (totals.get(m.code) || 0) + m.weight * Math.min(matches.length, 4))
  }
  return [...totals.entries()].map(([code, weight]) => ({ code, weight })).sort((a, b) => b.weight - a.weight || a.code.localeCompare(b.code))
}

/* ---------------- NewsItem ---------------- */

/** Normaliza un NewsItem crudo. No inventa nada: si no se detecta, queda null. */
export function normalizeNewsItem(item) {
  const title = cleanText(item.title)
  const description = cleanText(item.description)
  const content = cleanText(item.content)
  const body = content && content.length > description.length ? content : description
  const cleaned = [title, body].filter(Boolean).join('\n')
  const { language } = detectLanguage(cleaned, item.language)
  const countries = detectCountries(cleaned)
  const hinted = item.country ? String(item.country).toUpperCase() : null
  return {
    title,
    cleaned_content: body,
    normalized_language: language || item.language || null,
    detected_country: countries[0]?.code ?? hinted ?? null,
    detected_countries: countries.map((c) => c.code),
    canonical_url: canonicalUrl(item.url),
    content_hash: contentHash(cleaned),
  }
}
