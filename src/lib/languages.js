/**
 * Idiomas de RENIVYA.
 * - UI_LOCALES: idiomas de la interfaz (con diccionario propio).
 * - CONTENT_LANGUAGES: idiomas de contenido que puede traer una fuente (ISO-639-1).
 * Los nombres visibles se obtienen con Intl.DisplayNames (sin tablas inventadas).
 */

export const DEFAULT_LOCALE = 'es'

export const UI_LOCALES = [
  { code: 'es', label: 'Español', short: 'ES', momentLocale: 'es' },
  { code: 'en', label: 'English', short: 'EN', momentLocale: 'en' },
  { code: 'fr', label: 'Français', short: 'FR', momentLocale: 'fr' },
  { code: 'pt', label: 'Português', short: 'PT', momentLocale: 'pt' },
]

export const UI_LOCALE_CODES = UI_LOCALES.map((l) => l.code)

export const CONTENT_LANGUAGES = [
  'es', 'en', 'fr', 'pt', 'de', 'it', 'ca', 'eu', 'gl', 'nl', 'sv', 'no', 'da', 'fi', 'pl', 'cs',
  'ro', 'hu', 'el', 'tr', 'ru', 'uk', 'ar', 'he', 'fa', 'hi', 'ur', 'bn', 'zh', 'ja', 'ko', 'id',
  'ms', 'th', 'vi', 'sw',
]

export function isUiLocale(code) {
  return UI_LOCALE_CODES.includes(code)
}

/** Normaliza 'es-ES', 'ES', 'spa' → 'es' cuando es posible. Devuelve null si no se reconoce. */
export function normalizeLanguageCode(code) {
  if (!code || typeof code !== 'string') return null
  const base = code.trim().toLowerCase().replace('_', '-').split('-')[0]
  const iso3 = { spa: 'es', eng: 'en', fra: 'fr', fre: 'fr', por: 'pt', deu: 'de', ger: 'de', ita: 'it', cat: 'ca' }
  if (iso3[base]) return iso3[base]
  return /^[a-z]{2}$/.test(base) ? base : null
}

const displayCache = new Map()

/** Nombre del idioma `code` expresado en el idioma `locale`. */
export function getLanguageName(code, locale = DEFAULT_LOCALE) {
  const normalized = normalizeLanguageCode(code)
  if (!normalized) return code ?? ''
  const key = `${locale}:${normalized}`
  if (displayCache.has(key)) return displayCache.get(key)
  let name = normalized.toUpperCase()
  try {
    const dn = new Intl.DisplayNames([locale], { type: 'language' })
    const raw = dn.of(normalized)
    if (raw) name = raw.charAt(0).toLocaleUpperCase(locale) + raw.slice(1)
  } catch {
    /* Intl.DisplayNames no disponible: código en mayúsculas */
  }
  displayCache.set(key, name)
  return name
}

export function detectBrowserLocale() {
  try {
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language]
    for (const c of candidates) {
      const n = normalizeLanguageCode(c)
      if (n && isUiLocale(n)) return n
    }
  } catch {
    /* sin navigator */
  }
  return DEFAULT_LOCALE
}
