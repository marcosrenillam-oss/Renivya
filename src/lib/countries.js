import { COUNTRY_COORDINATES } from '@/lib/countryCoordinates'
import { DEFAULT_LOCALE } from '@/lib/languages'

/**
 * Países (ISO-3166-1 alfa-2) con región editorial.
 * Los nombres se resuelven con Intl.DisplayNames en el idioma de la interfaz.
 */
export const REGIONS = ['europe', 'americas', 'asia', 'middle_east', 'africa', 'oceania']

const REGION_MEMBERS = {
  europe: 'ES PT FR DE IT GB IE NL BE LU CH AT DK SE NO FI IS PL CZ SK HU RO BG GR HR SI RS BA ME MK AL EE LV LT UA BY MD RU CY MT AD MC VA',
  americas: 'US CA MX GT HN SV NI CR PA CU DO PR HT JM CO VE EC PE BO CL AR UY PY BR',
  asia: 'CN JP KR KP TW HK IN PK BD LK NP AF KZ UZ MN TH VN MY SG ID PH MM KH',
  middle_east: 'TR IL PS LB SY JO IQ IR SA AE QA KW BH OM YE',
  africa: 'EG LY TN DZ MA SD SS ET SO KE UG TZ RW CD CG CM NG GH CI SN ML NE BF TD ZA ZW ZM MZ AO NA BW MG',
  oceania: 'AU NZ PG FJ',
}

export const COUNTRY_REGION = Object.fromEntries(
  Object.entries(REGION_MEMBERS).flatMap(([region, list]) => list.split(' ').map((code) => [code, region]))
)

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
