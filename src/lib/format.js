import moment from 'moment'

/**
 * Utilidades de formato. Todas toleran null/fechas inválidas y devuelven ''.
 * El idioma de moment lo fija I18nProvider; aquí se puede forzar con `locale`.
 */

function toMoment(value, locale) {
  if (value == null || value === '') return null
  const m = moment(value)
  if (!m.isValid()) return null
  return locale ? m.locale(locale) : m
}

/** "hace 5 minutos" — limita fechas futuras (desfase de reloj) a "ahora". */
export function formatRelativeTime(value, locale) {
  const m = toMoment(value, locale)
  if (!m) return ''
  if (m.isAfter(moment())) return moment().locale(m.locale()).fromNow()
  return m.fromNow()
}

export function formatDate(value, locale, pattern = 'LL') {
  const m = toMoment(value, locale)
  return m ? m.format(pattern) : ''
}

export function formatDateTime(value, locale) {
  return formatDate(value, locale, 'LL · LT')
}

export function formatTime(value, locale) {
  return formatDate(value, locale, 'LT')
}

/** Fecha corta editorial: hoy → hora; este año → "12 nov"; si no → "12 nov 2024". */
export function formatShortDate(value, locale) {
  const m = toMoment(value, locale)
  if (!m) return ''
  const now = moment()
  if (m.isSame(now, 'day')) return m.format('LT')
  if (m.isSame(now, 'year')) return m.format('D MMM')
  return m.format('D MMM YYYY')
}

export function hoursSince(value) {
  const m = toMoment(value)
  return m ? Math.max(0, moment().diff(m, 'minutes') / 60) : null
}

export function formatNumber(value, locale = 'es', options) {
  if (value == null || Number.isNaN(Number(value))) return ''
  return new Intl.NumberFormat(locale, options).format(Number(value))
}

export function formatCompactNumber(value, locale = 'es') {
  return formatNumber(value, locale, { notation: 'compact', maximumFractionDigits: 1 })
}

/** 0-100 → "72 %" (formato local). */
export function formatPercent(value, locale = 'es') {
  if (value == null || Number.isNaN(Number(value))) return ''
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(Number(value) / 100)
}

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value))
}

export function truncate(text, max = 160) {
  if (!text) return ''
  const clean = String(text).replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`
}

/** Minutos de lectura estimados (≈220 palabras/min). */
export function readingMinutes(...parts) {
  const words = parts
    .flat()
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}
