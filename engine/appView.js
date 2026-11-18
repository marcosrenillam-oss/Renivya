// Versión ligera del snapshot para el móvil: solo lo que la app muestra.
// El estado completo del motor (artículos, entidades, procedencia) queda en snapshot.json.
import { EDITIONS } from './sourceCatalog.js'

const APP_TOP = 320
const APP_PER_COUNTRY = 25
const APP_MAX = 550

const STORY_DROP = new Set(['provenance', 'ingestion_batch', 'duplicate_group_id', 'world_mode', 'ai_generated'])

function slimStory(story) {
  const out = {}
  for (const [k, v] of Object.entries(story)) if (!STORY_DROP.has(k)) out[k] = v
  return out
}

const pick = (row, keys) => Object.fromEntries(keys.filter((k) => k in row).map((k) => [k, row[k]]))

export function appView(snapshot) {
  const e = snapshot.entities || {}
  // Al móvil van las historias vivas de los últimos 4 días: las más importantes (importancia
  // con el paso del tiempo) y, además, las principales de cada país, para que Mundo y cada
  // edición tengan noticias aunque no estén entre las grandes del día.
  const now = new Date(snapshot.generated_at || Date.now()).getTime()
  const since = new Date(now - 4 * 86_400_000).toISOString()
  const live = (e.Story || []).filter((s) => s.status !== 'archived' && (s.updated_date || s.published_at || '') >= since)
  const rank = (s) => {
    const hours = Math.max(0, (now - Date.parse(s.updated_date || s.published_at || 0)) / 3_600_000)
    return (s.renivya_score ?? 0) / (1 + hours / 36) + (s.is_breaking ? 12 : 0) + Math.min(s.source_count ?? 1, 6)
  }
  const ranked = [...live].sort((a, b) => rank(b) - rank(a) || String(a.id).localeCompare(String(b.id)))
  const chosen = new Set(ranked.slice(0, APP_TOP).map((s) => s.id))
  const perCountry = new Map()
  for (const s of ranked) {
    for (const c of new Set([...(s.countries || []), ...(s.source_countries || [])])) {
      const n = perCountry.get(c) || 0
      if (n >= APP_PER_COUNTRY) continue
      perCountry.set(c, n + 1)
      chosen.add(s.id)
    }
  }
  const stories = ranked.filter((s) => chosen.has(s.id)).slice(0, APP_MAX)
  const keep = new Set(stories.map((s) => s.id))
  const mine = (rows) => (rows || []).filter((r) => keep.has(r.story_id))
  return {
    version: 2,
    generated_at: snapshot.generated_at,
    mode: snapshot.mode,
    editions: EDITIONS,
    sources: snapshot.sources || [],
    health: snapshot.health || null,
    counts: { Story: stories.length },
    entities: {
      Story: stories.map(slimStory),
      StorySource: mine(e.StorySource).map((r) =>
        pick(r, ['id', 'story_id', 'source_id', 'source_name', 'title', 'url', 'country', 'language', 'source_type', 'published_at', 'role', 'is_demo', 'created_date', 'updated_date'])
      ),
      StoryUpdate: mine(e.StoryUpdate).map((r) =>
        pick(r, ['id', 'story_id', 'timestamp', 'action', 'change_type', 'fields_changed', 'previous_version', 'new_version', 'source', 'article_url', 'is_demo', 'created_date', 'updated_date'])
      ),
      Media: mine(e.Media).filter((m) => m.status !== 'rejected'),
      Source: (e.Source || []).map((r) => pick(r, ['id', 'name', 'url', 'country', 'language', 'type', 'is_active', 'is_demo', 'created_date', 'updated_date'])),
    },
  }
}
