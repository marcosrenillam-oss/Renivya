/** Escenarios de evolución (Story viva): creación, fuente adicional, corrección, duplicado. */
import { detectEvolution, deriveStatus, deriveTrend } from '../../../engine/evolution.js'

export function runEvolutionTests() {
  const prev = { title: 'A', summary: 'B', version: 1, independent_sources: 1, contradiction_flags: [], known_facts: [], confidence_status: 'low' }
  const base = { ...prev, independent_sources: 2, confidence_status: 'medium', known_facts: [{ text: 'Nuevo hecho', status: 'reported' }] }
  const results = []
  const t = (name, ok, detail) => results.push({ name, ok, detail })
  const created = detectEvolution({ previous: null, next: base })
  t('Creación', created.action === 'created' && !created.bump, created.change_type)
  const extra = detectEvolution({ previous: prev, next: base, newMembers: [{ url: 'u2', source_name: 'S2', title: 'x', text: 'y' }], previousUrls: new Set(['u1']) })
  t('Fuente adicional sube versión', extra.change_type === 'additional' && extra.bump, extra.whats_changed.join(' '))
  const corr = detectEvolution({ previous: prev, next: base, newMembers: [{ url: 'u3', source_name: 'S3', title: 'Fe de errores', text: 'Corrección de la cifra' }], previousUrls: new Set(['u1']) })
  t('Corrección', corr.action === 'correction', corr.summary)
  const dup = detectEvolution({ previous: prev, next: base, newMembers: [{ url: 'u1' }], previousUrls: new Set(['u1']) })
  t('Duplicado no versiona', dup.change_type === 'duplicate' && !dup.bump, dup.summary)
  const now = new Date()
  t('Estado en desarrollo', deriveStatus({ independentSources: 1, firstPublishedAt: now.toISOString(), now }) === 'developing', '')
  t('Tendencia al alza', deriveTrend([new Date(now - 3600e3).toISOString()], now) === 'rising', '')
  return results
}
