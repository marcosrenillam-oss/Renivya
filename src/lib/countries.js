import { COUNTRY_COORDINATES } from '@/lib/countryCoordinates'
import { DEFAULT_LOCALE } from '@/lib/languages'

/**
 * Países (ISO-3166-1 alfa-2) con región editorial (geografía compartida con el motor).
 * Los nombres se resuelven con Intl.DisplayNames en el idioma de la interfaz.
 */
export { REGIONS, COUNTRY_REGION } from '../../base44/shared/news/geo.ts'
import { COUNTRY_REGION } from '../../base44/shared/news/geo.ts'

export const COUNTRY_CODES = Object.keys(COUNTRY_COORDINATES)

/** Alias habituales en feeds y datos heredados → alfa-2. */
const ALIASES = {
  UK: 'GB', EL: 'GR',
  ESP: 'ES', PRT: 'PT', FRA: 'FR', DEU: 'DE', ITA: 'IT', GBR: 'GB', IRL: 'IE', NLD: 'NL', BEL: 'BE',
  CHE: 'CH', AUT: 'AT', USA: 'US', CAN: 'CA', MEX: 'MX', ARG: 'AR', BRA: 'BR', CHL: 'CL', COL: 'CO',
  PER: 'PE', VEN: 'VE', CHN: 'CN', JPN: 'JP', KOR: 'KR', IND: 'IN', RUS: 'RU', UKR: 'UA', TUR: 'TR',
  ISR: 'IL', PSE: 'PS', IRN: 'IR', SAU: 'SA', EGY: 'EG', MAR: 'MA', ZAF: 'ZA', NGA: 'NG', AUS: 'AU',
  NZL: 'NZ', POL: 'PL', SWE: 'SE', NOR: 'NO', DNK: 'DK', FIN: 'FI', GRC: 'GR',
}

/** Devuelve el código alfa-2 en mayúsculas o null (nunca adivina por nombre). */
export function normalizeCountryCode(value) {
  if (!value || typeof value !== 'string') return null
  const upper = value.trim().toUpperCase()
  if (ALIASES[upper]) return ALIASES[upper]
  return /^[A-Z]{2}$/.test(upper) ? upper : null
}

export function getCountryRegion(code) {
  return COUNTRY_REGION[normalizeCountryCode(code)] ?? null
}

const nameCache = new Map()

export function getCountryName(code, locale = DEFAULT_LOCALE) {
  const normalized = normalizeCountryCode(code)
  if (!normalized) return code ?? ''
  const key = `${locale}:${normalized}`
  if (nameCache.has(key)) return nameCache.get(key)
  let name = normalized
  try {
    name = new Intl.DisplayNames([locale], { type: 'region' }).of(normalized) || normalized
  } catch {
    /* sin Intl.DisplayNames */
  }
  nameCache.set(key, name)
  return name
}

/** Bandera emoji a partir de indicadores regionales. */
export function getCountryFlag(code) {
  const normalized = normalizeCountryCode(code)
  if (!normalized) return ''
  return String.fromCodePoint(...[...normalized].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}

/** Lista ordenada por nombre localizado (para selectores). */
export function listCountries(locale = DEFAULT_LOCALE) {
  return COUNTRY_CODES.map((code) => ({
    code,
    name: getCountryName(code, locale),
    flag: getCountryFlag(code),
    region: COUNTRY_REGION[code] ?? null,
  })).sort((a, b) => a.name.localeCompare(b.name, locale))
}
