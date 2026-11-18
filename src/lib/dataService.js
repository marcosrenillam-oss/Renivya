import { client } from '@/api/client'
import { normalizeEntityName } from '../../engine/entities.js'

/**
 * Capa de datos de RENIVYA sobre el almacén de entidades del dispositivo.
 * La interfaz NUNCA llama a client.entities directamente: pasa por aquí.
 *
 * Convenciones:
 *  - Las funciones lanzan en caso de error (la UI distingue error de vacío).
 *  - Devuelven arrays vacíos solo cuando de verdad no hay datos.
 *  - Deduplicación por claves exactas (story_id, entity_id, url…), nunca difusa.
 */

const E = client.entities

export const STORY_SORT = {
  recent: '-published_at',
  score: '-renivya_score',
  updated: '-updated_date',
}

/** Claves de React Query centralizadas. */
export const queryKeys = {
  stories: (params) => ['stories', params ?? {}],
  story: (id) => ['story', id],
  storySources: (id) => ['story', id, 'sources'],
  storyUpdates: (id) => ['story', id, 'updates'],
  storyEntities: (id) => ['story', id, 'entities'],
  storyMedia: (id) => ['story', id, 'media'],
  sources: (params) => ['sources', params ?? {}],
  entity: (id) => ['entity', id],
  preference: (userId) => ['preference', userId],
  saved: (userId) => ['saved', userId],
  systemStatus: () => ['system-status'],
}

/* ------------------------------------------------------------------ */
/* Normalización                                                       */
/* ------------------------------------------------------------------ */

/** normalized_name de Entity: misma función que usa el motor (fuente única). */
export { normalizeEntityName }

function uniqueBy(rows, key) {
  const seen = new Set()
  return rows.filter((row) => {
    const k = typeof key === 'function' ? key(row) : row?.[key]
    if (k == null || seen.has(k)) return false
    seen.add(k)
    return true
  })
}

function demoFilter(demo) {
  if (demo === 'exclude') return { is_demo: false }
  if (demo === 'only') return { is_demo: true }
  return {}
}

/* ------------------------------------------------------------------ */
/* Stories                                                             */
/* ------------------------------------------------------------------ */

/**
 * Lista de Stories.
 * @param {object} p
 * @param {object} [p.filter]        consulta adicional ($in, $ne, $gte…)
 * @param {string} [p.sort]          campo de orden ('-published_at' por defecto)
 * @param {number} [p.limit]
 * @param {number} [p.skip]
 * @param {boolean}[p.includeArchived]
 * @param {'include'|'exclude'|'only'} [p.demo]
 */
export async function listStories({ filter = {}, sort = STORY_SORT.recent, limit = 50, skip = 0, includeArchived = false, demo = 'include' } = {}) {
  const query = { ...demoFilter(demo), ...filter }
  if (!includeArchived && query.status === undefined) query.status = { $ne: 'archived' }
  return E.Story.filter(query, sort, limit, skip)
}

export async function getStory(id) {
  if (!id) throw new Error('getStory: id obligatorio')
  return E.Story.get(id)
}

export async function getStoriesByIds(ids = []) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return []
  const rows = await E.Story.filter({ id: { $in: unique } }, undefined, unique.length)
  const byId = new Map(rows.map((r) => [r.id, r]))
  return unique.map((id) => byId.get(id)).filter(Boolean)
}

export async function listStoriesByCategory(category, opts = {}) {
  return listStories({ ...opts, filter: { ...(opts.filter || {}), category } })
}

export async function listStoriesByCountry(countryCode, opts = {}) {
  return listStories({ ...opts, filter: { ...(opts.filter || {}), countries: countryCode } })
}

export async function countStories(filter = {}) {
  if (typeof E.Story.count === 'function') return E.Story.count(filter)
  const rows = await E.Story.filter(filter, undefined, 1000)
  return rows.length
}

/* ------------------------------------------------------------------ */
/* Relaciones de una Story                                             */
/* ------------------------------------------------------------------ */

export async function listStorySources(storyId) {
  const rows = await E.StorySource.filter({ story_id: storyId }, '-published_at', 200)
  // Una fila por URL de artículo (clave exacta); si no hay URL, por fuente.
  return uniqueBy(rows, (r) => r.url || `name:${r.source_name}`)
}

/** Historial de la Story, del más reciente al más antiguo. */
export async function listStoryUpdates(storyId) {
  return E.StoryUpdate.filter({ story_id: storyId }, '-timestamp', 200)
}

export async function listStoryEntities(storyId) {
  const rows = await E.StoryEntity.filter({ story_id: storyId }, undefined, 200)
  return uniqueBy(rows, 'entity_id')
}

export async function listStoryMedia(storyId) {
  const rows = await E.Media.filter({ story_id: storyId, status: { $ne: 'rejected' } }, undefined, 50)
  return uniqueBy(rows, 'url')
}

/* ------------------------------------------------------------------ */
/* Entidades y relaciones                                              */
/* ------------------------------------------------------------------ */

export async function getEntity(id) {
  return E.Entity.get(id)
}

export async function listEntitiesByIds(ids = []) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return []
  return E.Entity.filter({ id: { $in: unique } }, undefined, unique.length)
}

/** Búsqueda EXACTA por normalized_name (sin heurísticas difusas). */
export async function findEntityByName(name) {
  const normalized = normalizeEntityName(name)
  if (!normalized) return null
  const rows = await E.Entity.filter({ normalized_name: normalized }, 'created_date', 1)
  return rows[0] ?? null
}

export async function listStoriesForEntity(entityId, limit = 50) {
  const links = await E.StoryEntity.filter({ entity_id: entityId }, undefined, limit)
  return getStoriesByIds(links.map((l) => l.story_id))
}

export async function listEntityRelations(entityIds = []) {
  const ids = [...new Set(entityIds.filter(Boolean))]
  if (!ids.length) return []
  const rows = await E.EntityRelation.filter(
    { $or: [{ source_entity_id: { $in: ids } }, { target_entity_id: { $in: ids } }] },
    undefined,
    500
  )
  return uniqueBy(rows, (r) => `${r.source_entity_id}|${r.relation_type}|${r.target_entity_id}`)
}

/* ------------------------------------------------------------------ */
/* Fuentes                                                             */
/* ------------------------------------------------------------------ */

export async function listSources({ activeOnly = false, limit = 500 } = {}) {
  const query = activeOnly ? { is_active: true } : {}
  return E.Source.filter(query, 'name', limit)
}

/** Fiabilidad canónica (reliability), con caída al alias legacy. */
export function sourceReliability(source) {
  if (!source) return null
  return source.reliability ?? source.reliability_score ?? null
}

/* ------------------------------------------------------------------ */
/* Preferencias (1 por usuario, RLS por created_by_id)                 */
/* ------------------------------------------------------------------ */

export const DEFAULT_PREFERENCE = Object.freeze({
  preferred_categories: [],
  preferred_languages: [],
  keywords: [],
  followed_entities: [],
  followed_countries: [],
  primary_country: 'ES',
  excluded_categories: [],
  excluded_entities: [],
  minimum_score: 0,
  minimum_confidence: 0,
  digest_size: 10,
  digest_frequency: 'daily',
  world_mode_enabled: true,
  daily_briefing_time: null,
  weekly_summary_enabled: true,
  alert_threshold: 80,
})

/** Registro de preferencias del usuario actual (o null si no existe). La RLS limita a las suyas. */
async function findOwnPreference() {
  const rows = await E.Preference.list('-updated_date', 5)
  return rows[0] ?? null
}

/** Preferencias efectivas: defaults + registro guardado. Nunca lanza por "no existe". */
export async function getPreference() {
  const row = await findOwnPreference()
  return { ...DEFAULT_PREFERENCE, ...(row || {}), _persisted: Boolean(row) }
}

let preferenceWrite = null

/** Upsert de preferencias (un único registro por usuario). */
export async function savePreference(patch) {
  // Serializa escrituras concurrentes de esta pestaña para no crear dos registros.
  const run = async () => {
    const clean = { ...patch, updated_at: new Date().toISOString() }
    delete clean._persisted
    delete clean.id
    const existing = await findOwnPreference()
    const saved = existing ? await E.Preference.update(existing.id, clean) : await E.Preference.create({ ...DEFAULT_PREFERENCE, ...clean })
    return { ...DEFAULT_PREFERENCE, ...saved, _persisted: true }
  }
  preferenceWrite = (preferenceWrite || Promise.resolve()).catch(() => {}).then(run)
  return preferenceWrite
}

/* ------------------------------------------------------------------ */
/* Guardadas (SavedStory, RLS por created_by_id)                       */
/* ------------------------------------------------------------------ */

const savedLocks = new Map()

function withSavedLock(storyId, fn) {
  const prev = savedLocks.get(storyId) || Promise.resolve()
  const next = prev.catch(() => {}).then(fn)
  savedLocks.set(storyId, next)
  next.finally(() => {
    if (savedLocks.get(storyId) === next) savedLocks.delete(storyId)
  })
  return next
}

/** Elimina duplicados residuales (p. ej. carreras entre pestañas). Conserva el más antiguo. */
async function collapseDuplicates(rows) {
  const byStory = new Map()
  const extras = []
  for (const row of [...rows].sort((a, b) => String(a.created_date).localeCompare(String(b.created_date)))) {
    if (byStory.has(row.story_id)) extras.push(row)
    else byStory.set(row.story_id, row)
  }
  if (extras.length) await Promise.allSettled(extras.map((r) => E.SavedStory.delete(r.id)))
  return [...byStory.values()]
}

export async function listSavedStoryLinks() {
  const rows = await E.SavedStory.list('-created_date', 500)
  return collapseDuplicates(rows)
}

export async function listSavedStories() {
  const links = await listSavedStoryLinks()
  const stories = await getStoriesByIds(links.map((l) => l.story_id))
  const savedAt = new Map(links.map((l) => [l.story_id, l.created_date]))
  return stories.map((s) => ({ ...s, saved_at: savedAt.get(s.id) ?? null }))
}

export async function isStorySaved(storyId) {
  const rows = await E.SavedStory.filter({ story_id: storyId }, undefined, 5)
  return rows.length > 0
}

/** Idempotente: no crea un segundo registro si ya está guardada. */
export function saveStory(storyId) {
  return withSavedLock(storyId, async () => {
    const existing = await E.SavedStory.filter({ story_id: storyId }, 'created_date', 5)
    if (existing.length) {
      await collapseDuplicates(existing)
      return true
    }
    await E.SavedStory.create({ story_id: storyId })
    return true
  })
}

/** Borra TODOS los registros de esa Story del usuario (incluidos duplicados). */
export function unsaveStory(storyId) {
  return withSavedLock(storyId, async () => {
    const existing = await E.SavedStory.filter({ story_id: storyId }, undefined, 20)
    await Promise.all(existing.map((r) => E.SavedStory.delete(r.id)))
    return false
  })
}

/** Alterna el guardado (consultar y luego actuar). Devuelve el nuevo estado. */
export function toggleSavedStory(storyId) {
  return withSavedLock(storyId, async () => {
    const existing = await E.SavedStory.filter({ story_id: storyId }, undefined, 20)
    if (existing.length) {
      await Promise.all(existing.map((r) => E.SavedStory.delete(r.id)))
      return false
    }
    await E.SavedStory.create({ story_id: storyId })
    return true
  })
}

/* ------------------------------------------------------------------ */
/* Estado del sistema (StatusBar)                                      */
/* ------------------------------------------------------------------ */

/**
 * Estado legible del sistema, SIN métricas técnicas (ni score ni confianza).
 * { lastUpdatedAt, activeStories, hasReal, hasDemo, isEmpty }
 */
export async function getSystemStatus() {
  const [latest, latestReal] = await Promise.all([
    E.Story.filter({ status: { $ne: 'archived' } }, '-updated_date', 1),
    E.Story.filter({ is_demo: false, status: { $ne: 'archived' } }, '-updated_date', 1),
  ])
  const activeStories = latest.length ? await countStories({ status: { $in: ['developing', 'active', 'updated'] } }) : 0
  const hasDemo = latest.length ? (await E.Story.filter({ is_demo: true }, undefined, 1)).length > 0 : false
  return {
    lastUpdatedAt: latest[0]?.updated_date ?? latest[0]?.published_at ?? null,
    activeStories,
    hasReal: latestReal.length > 0,
    hasDemo,
    isEmpty: latest.length === 0,
  }
}
