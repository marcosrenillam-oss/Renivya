// Paso 9: la Story es un objeto vivo. Detecta qué cambió, de qué tipo y si sube de versión.
// Los textos de "Qué ha cambiado" son cualitativos (sin cifras de SCORE ni de confianza).
import { foldAccents } from './normalizer.ts'
import { hoursBetween } from './stats.ts'
import { hasCorrectionMarker } from './analysis.ts'

const RESOLUTION_MARKERS = [
  'queda resuelto', 'se resuelve', 'concluye', 'pone fin', 'finaliza', 'acuerdo firmado', 'firman el acuerdo', 'sentencia firme', 'es liberado',
  'resolved', 'comes to an end', 'ends with', 'deal signed', 'concluded', 'final verdict', 'prend fin', 'accord signé', 'termina com', 'chega ao fim',
]

const CONFIDENCE_ORDER = ['pending', 'low', 'medium', 'high', 'confirmed']
const CONFIDENCE_LABEL = { pending: 'pendiente', low: 'baja', medium: 'media', high: 'alta', confirmed: 'confirmada' }

export function hasResolutionMarker(text) {
  const f = ` ${foldAccents(String(text || '').toLowerCase())} `
  return RESOLUTION_MARKERS.some((m) => f.includes(` ${m}`))
}

const TRACKED_FIELDS = ['title', 'summary', 'body', 'key_points', 'known_facts', 'category', 'countries', 'status', 'image_url', 'source_count', 'confidence_status', 'contrast']

function changed(a, b) {
  return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)
}

/**
 * previous: Story anterior (o null). next: campos nuevos calculados.
 * newMembers: artículos que entran ahora. previousUrls: Set de URLs ya incluidas.
 */
export function detectEvolution({ previous, next, newMembers = [], previousUrls = new Set() }) {
  if (!previous) {
    return { action: 'created', change_type: 'new', bump: false, whats_changed: ['Primera versión de la historia.'], fields_changed: [], summary: 'Historia creada a partir de las primeras fuentes.' }
  }
  const fresh = newMembers.filter((m) => !previousUrls.has(m.canonical_url || m.url))
  const fields_changed = TRACKED_FIELDS.filter((f) => changed(previous[f], next[f]))
  const whats = []

  if (!fresh.length) {
    return { action: 'updated', change_type: 'duplicate', bump: false, whats_changed: [], fields_changed: [], summary: 'Artículos ya incluidos: sin cambios.' }
  }

  const freshText = fresh.map((m) => `${m.title} ${m.text}`).join(' ')
  const newSources = [...new Set(fresh.map((m) => m.source_name).filter(Boolean))]
  const prevIndependent = previous.independent_sources ?? 0
  const nextIndependent = next.independent_sources ?? 0
  const prevContr = (previous.contradiction_flags || []).length
  const nextContr = (next.contradiction_flags || []).length
  const prevFacts = new Set((previous.known_facts || []).map((f) => f.text))
  const newFacts = (next.known_facts || []).filter((f) => !prevFacts.has(f.text) && f.status !== 'context')

  let action = 'updated'
  let change_type = 'static'

  if (hasCorrectionMarker(freshText)) {
    action = 'correction'
    change_type = 'correction'
    whats.push(`Corrección publicada por ${newSources.join(', ')}.`)
  } else if (hasResolutionMarker(freshText)) {
    action = 'resolved'
    change_type = 'evolution'
    whats.push('Las fuentes informan de que el asunto ha quedado resuelto.')
  } else if (nextContr > prevContr) {
    change_type = 'contradiction'
    const added = (next.contradiction_flags || []).filter((f) => !(previous.contradiction_flags || []).includes(f))
    whats.push(...added.slice(0, 3).map((f) => `Nueva discrepancia entre fuentes: ${f}.`))
  } else if (nextIndependent > prevIndependent || newFacts.length) {
    change_type = 'additional'
  } else if (fields_changed.includes('title') || fields_changed.includes('summary')) {
    change_type = 'evolution'
  } else if (newSources.length) {
    change_type = 'additional'
  }

  if (newSources.length) whats.push(`${newSources.length === 1 ? 'Se suma una fuente' : `Se suman ${newSources.length} fuentes`}: ${newSources.join(', ')}.`)
  for (const f of newFacts.slice(0, 3)) whats.push(`Nuevo dato: ${f.text}`)
  const pc = CONFIDENCE_ORDER.indexOf(previous.confidence_status)
  const nc = CONFIDENCE_ORDER.indexOf(next.confidence_status)
  if (pc >= 0 && nc >= 0 && pc !== nc) whats.push(`La solidez de la información pasa a ${CONFIDENCE_LABEL[next.confidence_status]}.`)
  if (next.is_breaking && !previous.is_breaking) action = 'breaking'

  const bump = change_type !== 'static' && change_type !== 'duplicate'
  return {
    action,
    change_type,
    bump,
    whats_changed: whats,
    fields_changed,
    summary: whats[0] || 'Actualización menor.',
  }
}

/** Estado de vida de la Story. */
export function deriveStatus({ previous, resolved, independentSources, firstPublishedAt, lastPublishedAt, bumped, now = new Date() }) {
  if (resolved || previous?.status === 'resolved') return 'resolved'
  const idleH = hoursBetween(lastPublishedAt || firstPublishedAt, now) ?? 0
  if (idleH > 24 * 7) return 'archived'
  const ageH = hoursBetween(firstPublishedAt, now) ?? 0
  if (independentSources < 2 || ageH < 3) return 'developing'
  if (previous && bumped) return 'updated'
  return previous?.status === 'updated' && idleH < 12 ? 'updated' : 'active'
}

/** Tendencia por ritmo de nuevas fuentes: últimas 6 h frente a las 6 h anteriores. */
export function deriveTrend(dates, now = new Date()) {
  const t = new Date(now).getTime()
  const hours = dates.map((d) => (t - new Date(d).getTime()) / 3_600_000).filter((h) => h >= 0)
  const recent = hours.filter((h) => h <= 6).length
  const before = hours.filter((h) => h > 6 && h <= 12).length
  if (!hours.length || Math.min(...hours) > 24) return 'declining'
  if (recent > before && recent >= 1) return 'rising'
  return 'stable'
}
