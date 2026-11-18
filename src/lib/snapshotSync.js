import { client } from '@/api/client'

/**
 * Sincroniza las NOTICIAS publicadas en data/app.json (generado por GitHub Actions
 * cada hora) con el almacén de este dispositivo. Nunca toca Preference ni SavedStory.
 */
export const NEWS_ENTITIES = ['Story', 'NewsItem', 'Source', 'StorySource', 'StoryUpdate', 'Entity', 'StoryEntity', 'EntityRelation', 'Media']
// data/app.json: versión ligera (historias con sus traducciones). Las entidades que no trae
// se vacían para no dejar datos antiguos de versiones anteriores de la app.
const META_KEY = 'renivya:snapshot-meta'

export function getSnapshotMeta() {
  try {
    return JSON.parse(window.localStorage.getItem(META_KEY) || 'null')
  } catch {
    return null
  }
}

function setSnapshotMeta(meta) {
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta))
  } catch {
    /* sin persistencia */
  }
}

/**
 * Descarga el snapshot y, si es más reciente que el aplicado, reemplaza las noticias.
 * Devuelve { updated, meta } o lanza si no hay red ni snapshot.
 */
export async function syncSnapshot({ force = false } = {}) {
  const url = `${import.meta.env.BASE_URL}data/app.json`
  // 'no-cache': el navegador pregunta al servidor si hay versión nueva (ETag); si no la hay,
  // no se vuelve a descargar el archivo entero.
  const res = await fetch(url, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`snapshot ${res.status}`)
  const snap = await res.json()
  const current = getSnapshotMeta()
  if (!force && current?.generated_at === snap.generated_at) return { updated: false, meta: current }
  for (const name of NEWS_ENTITIES) {
    await client.entities[name].replaceAll(snap.entities?.[name] || [])
  }
  const meta = { generated_at: snap.generated_at, mode: snap.mode, sources: snap.sources || [], counts: snap.counts || {}, health: snap.health || null, editions: snap.editions || [], applied_at: new Date().toISOString() }
  setSnapshotMeta(meta)
  return { updated: true, meta }
}
