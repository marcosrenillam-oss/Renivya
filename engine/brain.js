// "Cerebro" de RENIVYA: orquesta ingesta, procesamiento, mantenimiento y purga.
// Lo usan las funciones backend (service role) y, en modo local, la página Brain.
import { createDataAdapter } from './dataAdapter.js'
import { createMockNewsProvider, DEMO_SOURCES } from './mock.js'
import { canonicalUrl } from './normalizer.js'
import { runPipeline } from './pipeline.js'
import { hash64 } from './stats.js'

export { createDataAdapter }

/** Alta de fuentes por nombre exacto (no duplica). Devuelve las fuentes resultantes. */
export async function ensureSources(db, sources) {
  const existing = await db.Source.filterAll({}, 'name', 5000)
  const byName = new Map(existing.map((s) => [s.name, s]))
  const missing = sources.filter((s) => !byName.has(s.name))
  if (missing.length) for (const row of await db.Source.bulkCreate(missing)) byName.set(row.name, row)
  return sources.map((s) => byName.get(s.name))
}

/** Crea NewsItems pendientes evitando URLs ya conocidas (clave exacta: URL canónica). */
export async function ingestItems(db, items) {
  const candidates = items.filter((i) => i.url && i.title)
  if (!candidates.length) return { created: 0, skipped: items.length }
  const urls = candidates.map((i) => i.url)
  const known = await db.NewsItem.filter({ url: { $in: urls } }, undefined, urls.length * 2)
  const seen = new Set(known.map((k) => canonicalUrl(k.url)))
  const fresh = []
  for (const item of candidates) {
    const c = canonicalUrl(item.url)
    if (!c || seen.has(c)) continue
    seen.add(c)
    fresh.push(item)
  }
  if (fresh.length) await db.NewsItem.bulkCreate(fresh)
  return { created: fresh.length, skipped: items.length - fresh.length }
}

export function newBatchId(now = new Date()) {
  return `batch_${new Date(now).toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}_${hash64(String(Math.random())).slice(0, 6)}`
}

/** Datos de demostración en local o en un espacio de pruebas (is_demo: true). */
export async function seedDemo(db, { round = 1, now = new Date(), log } = {}) {
  const provider = createMockNewsProvider()
  await ensureSources(db, DEMO_SOURCES)
  const ingest = await ingestItems(db, await provider.fetch({ round, now }))
  const stats = await runPipeline(db, { isDemo: true, now, log })
  return { ingest, stats }
}

/** Ciclo real: feeds activos → NewsItems → pipeline. */
export async function runIngestionCycle(db, { provider, now = new Date(), embeddingProvider = null, maxSources = 30, log = () => {} } = {}) {
  const batchId = newBatchId(now)
  const sources = (await db.Source.filter({ is_active: true, is_demo: false }, 'last_fetched_at', maxSources)).filter((s) => s.feed_url)
  const report = { batchId, sources: sources.length, fetched: 0, created: 0, errors: [], perSource: [] }
  for (const source of sources) {
    const res = await provider.fetchSource(source, now)
    if (res.skipped) {
      report.perSource.push({ name: source.name, ok: true, items: 0, skipped: res.skipped })
      continue
    }
    if (res.error) report.errors.push(`${source.name}: ${res.error}`)
    report.perSource.push({ name: source.name, ok: !res.error, items: res.items.length, error: res.error ?? null })
    report.fetched += res.items.length
    report.created += (await ingestItems(db, res.items)).created
    if (!res.error) await db.Source.update(source.id, { last_fetched_at: now.toISOString() })
  }
  report.pipeline = await runPipeline(db, { isDemo: false, batchId, now, embeddingProvider, log })
  report.maintenance = await maintainStories(db, { now, isDemo: false })
  return report
}

/** Archiva historias sin evidencia nueva en 7 días (con registro en el historial). */
export async function maintainStories(db, { now = new Date(), isDemo = false, idleDays = 7 } = {}) {
  const limit = new Date(new Date(now).getTime() - idleDays * 86_400_000).toISOString()
  const stale = await db.Story.filter({ is_demo: isDemo, status: { $in: ['developing', 'active', 'updated', 'resolved'] }, updated_date: { $lt: limit } }, 'updated_date', 200)
  for (const s of stale) {
    await db.Story.update(s.id, { status: 'archived', archived_at: new Date(now).toISOString() })
    await db.StoryUpdate.create({
      story_id: s.id, timestamp: new Date(now).toISOString(), action: 'archived', change_type: 'static',
      summary_of_change: 'Archivada por falta de novedades.', whats_changed: [], fields_changed: ['status'],
      previous_version: s.version ?? 1, new_version: s.version ?? 1, is_demo: isDemo,
    })
  }
  return { archived: stale.length }
}

/**
 * Limpieza (> `days` días): Stories no guardadas por ningún usuario y todo lo que cuelga de ellas,
 * NewsItems antiguos y caché de embeddings caducada. Requiere permisos de servicio para ver SavedStory.
 */
export async function cleanOldStories(db, { days = 30, now = new Date(), savedStoryIds = new Set() } = {}) {
  const limit = new Date(new Date(now).getTime() - days * 86_400_000).toISOString()
  const old = await db.Story.filterAll({ published_at: { $lt: limit } }, 'published_at', 2000)
  const doomed = old.filter((s) => !savedStoryIds.has(s.id))
  const report = { stories: 0, kept_saved: old.length - doomed.length, news_items: 0, embeddings: 0 }
  for (const s of doomed) {
    for (const name of ['StorySource', 'StoryUpdate', 'StoryEntity', 'Media', 'EntityRelation']) {
      const rows = await db[name].filter({ story_id: s.id }, undefined, 1000)
      for (const r of rows) await db[name].delete(r.id)
    }
    await db.Story.delete(s.id)
    report.stories++
  }
  const doomedIds = new Set(doomed.map((s) => s.id))
  const items = await db.NewsItem.filterAll({ published_at: { $lt: limit } }, 'published_at', 5000)
  for (const it of items) {
    if (it.story_id && !doomedIds.has(it.story_id)) continue // pertenece a una historia guardada que se conserva
    await db.NewsItem.delete(it.id)
    report.news_items++
  }
  const embeddings = await db.ArticleEmbedding.filterAll({ created_date: { $lt: limit } }, 'created_date', 5000)
  for (const e of embeddings) await db.ArticleEmbedding.delete(e.id)
  report.embeddings = embeddings.length
  return report
}
