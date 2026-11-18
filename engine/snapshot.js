// Construcción del snapshot de noticias que publica GitHub Actions (y que la app sincroniza).
import { cleanOldStories, createDataAdapter, ensureSources, maintainStories, runIngestionCycle, seedDemo } from './brain.js'
import { REAL_SOURCES } from './sourceCatalog.js'

export const SNAPSHOT_ENTITIES = ['Story', 'NewsItem', 'Source', 'StorySource', 'StoryUpdate', 'Entity', 'StoryEntity', 'EntityRelation', 'Media']
const MAX_STORIES = 500
// Sube cuando cambia la forma de las historias: un estado anterior de otra versión se descarta
// (v2: idioma único por historia, ediciones por país, traducciones).
export const STATE_VERSION = 2

/**
 * entities: almacén en memoria (client.entities con replaceAll).
 * previous: snapshot publicado anterior (o null). provider: proveedor RSS (o null para solo demo).
 */
export async function buildSnapshot({ entities, previous = null, provider = null, sources = REAL_SOURCES, now = new Date(), log = () => {} }) {
  const db = createDataAdapter(entities)
  const count = async (name, q = {}) => (await db[name].filterAll(q, undefined, 100000)).length

  // 1. Estado anterior: solo si era real (la demo nunca se mezcla con noticias reales).
  if (previous?.mode === 'real' && previous.state_version === STATE_VERSION) {
    for (const name of SNAPSHOT_ENTITIES) await entities[name].replaceAll(previous.entities?.[name] || [])
  }

  // 2. Ingesta real.
  let perSource = []
  let mode = 'demo'
  if (provider) {
    await ensureSources(db, sources)
    const report = await runIngestionCycle(db, { provider, now })
    perSource = report.perSource
    log(`feeds: ${perSource.filter((s) => s.ok).length}/${report.sources} ok · artículos nuevos: ${report.created} · historias +${report.pipeline.storiesCreated} ~${report.pipeline.storiesUpdated}`)
    if (report.errors.length) log('errores:', report.errors.join(' | '))
    if ((await count('Story', { is_demo: false })) > 0) mode = 'real'
  }

  // 3. Sin noticias reales: demostración. Con ellas: mantenimiento y purga de > 30 días.
  if (mode === 'demo') {
    for (const name of SNAPSHOT_ENTITIES) await entities[name].replaceAll([])
    await seedDemo(db, { round: 1, now: new Date(now.getTime() - 3 * 3_600_000) })
    await seedDemo(db, { round: 2, now })
  } else {
    await maintainStories(db, { now, isDemo: false })
    log('limpieza:', JSON.stringify(await cleanOldStories(db, { days: 30, now })))
  }

  // 4. Recorte: historias más recientes; artículos necesarios para deduplicar y para que
  //    las historias vivas sigan agrupando noticias nuevas en la próxima ejecución.
  const stories = (await db.Story.filterAll({}, '-updated_date', 100000)).slice(0, MAX_STORIES)
  const keep = new Set(stories.map((s) => s.id))
  const liveSince = new Date(now.getTime() - 72 * 3_600_000).toISOString()
  const live = new Set(stories.filter((s) => s.updated_date >= liveSince && s.status !== 'archived').map((s) => s.id))
  const dedupSince = new Date(now.getTime() - 7 * 86_400_000).toISOString()
  const items = (await db.NewsItem.filterAll({}, '-published_at', 100000))
    .filter((it) => keep.has(it.story_id) || (it.published_at || it.retrieved_at || '') >= dedupSince)
    .map(({ content, description, ...it }) => (live.has(it.story_id) ? it : { ...it, cleaned_content: null }))
  const byStory = async (name) => (await db[name].filterAll({}, undefined, 100000)).filter((r) => !r.story_id || keep.has(r.story_id))
  const links = await byStory('StoryEntity')
  const used = new Set(links.map((l) => l.entity_id))

  const out = {
    Story: stories,
    NewsItem: items,
    Source: await db.Source.filterAll({}, 'name', 10000),
    StorySource: await byStory('StorySource'),
    StoryUpdate: await byStory('StoryUpdate'),
    Entity: (await db.Entity.filterAll({}, undefined, 100000)).filter((e) => used.has(e.id)),
    StoryEntity: links,
    EntityRelation: await byStory('EntityRelation'),
    Media: await byStory('Media'),
  }
  return {
    version: 1,
    state_version: STATE_VERSION,
    generated_at: new Date(now).toISOString(),
    mode,
    counts: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])),
    sources: perSource.map(({ name, ok, items: n, error }) => ({ name, ok, items: n, error: error ?? null })),
    entities: out,
  }
}
