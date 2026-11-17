// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Utilidades numéricas y de hash deterministas (sin dependencias, válidas en Deno y navegador).

export function clamp(value, min = 0, max = 100) {
  if (Number.isNaN(value) || value == null) return min
  return Math.min(max, Math.max(min, value))
}

export function round(value, decimals = 0) {
  const f = 10 ** decimals
  return Math.round(value * f) / f
}

export function mean(values) {
  const v = values.filter((x) => typeof x === 'number' && !Number.isNaN(x))
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0
}

export function median(values) {
  const v = values.filter((x) => typeof x === 'number' && !Number.isNaN(x)).sort((a, b) => a - b)
  if (!v.length) return 0
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

/** Curva de saturación suave: 0 → 0, crece rápido y se aplana hacia `max`. */
export function saturate(x, k = 1, max = 100) {
  return max * (1 - Math.exp(-Math.max(0, x) / k))
}

/** FNV-1a de 64 bits (dos mitades de 32) → hex de 16 caracteres. Determinista. */
export function hash64(input) {
  const str = String(input ?? '')
  let h1 = 0x811c9dc5
  let h2 = 0xcbf29ce4
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0
    h2 = Math.imul(h2 ^ c, 0x01000193 ^ 0x5bd1e995) >>> 0
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')
}

/** Hash de 32 bits sin signo (para el truco de hashing de embeddings). */
export function hash32(input, seed = 0x811c9dc5) {
  const str = String(input ?? '')
  let h = seed >>> 0
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 0x01000193) >>> 0
  return h
}

/** PRNG determinista (mulberry32) para layouts reproducibles. */
export function seededRandom(seed) {
  let a = typeof seed === 'number' ? seed >>> 0 : hash32(seed)
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hoursBetween(a, b) {
  const ta = new Date(a).getTime()
  const tb = new Date(b).getTime()
  if (Number.isNaN(ta) || Number.isNaN(tb)) return null
  return Math.abs(tb - ta) / 3_600_000
}

export function uniq(values) {
  return [...new Set(values.filter((v) => v != null && v !== ''))]
}

export function countBy(values, keyFn = (x) => x) {
  const out = new Map()
  for (const v of values) {
    const k = keyFn(v)
    if (k == null) continue
    out.set(k, (out.get(k) || 0) + 1)
  }
  return out
}

/** Orden estable con desempate por clave de texto (resultados reproducibles). */
export function stableSort(items, compare, tieKey = (x) => x?.id ?? '') {
  return [...items].sort((a, b) => compare(a, b) || String(tieKey(a)).localeCompare(String(tieKey(b))))
}
