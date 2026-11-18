// Versión ligera del snapshot para el móvil: solo lo que la app muestra.
// El estado completo del motor (artículos, entidades, procedencia) queda en snapshot.json.
import { EDITIONS } from './sourceCatalog.js'

const STORY_DROP = new Set(['provenance', 'ingestion_batch', 'duplicate_group_id', 'world_mode', 'ai_generated', 'entities'])

function slimStory(story) {
  const out = {}
  for (const [k, v] of Object.entries(story)) if (!STORY_DROP.has(k)) out[k] = v
  return out
}

const pick = (row, keys) => Object.fromEntries(keys.filter((k) => k in row).map((k) => [k, row[k]]))

export function appView(snapshot) {
  const e = snapshot.entities || {}
  const stories = (e.Story || []).filter((s) => s.status !== 'archived')
  const keep = new Set(stories.map((s) => s.id))
  const mine = (rows) => (rows || []).filter((r) => keep.has(r.story_id))
  return {
    version: 2,
    generated_at: snapshot.generated_at,
    mode: snapshot.mode,
    editions: EDITIONS,
    sources: snapshot.sources || [],
    counts: { Story: stories.length },
    entities: {
      Story: stories.map(slimStory),
      StorySource: mine(e.StorySource).map((r) =>
        pick(r, ['id', 'story_id', 'source_id', 'source_name', 'url', 'country', 'language', 'source_type', 'published_at', 'role', 'is_demo', 'created_date', 'updated_date'])
      ),
      StoryUpdate: mine(e.StoryUpdate).map((r) =>
        pick(r, ['id', 'story_id', 'timestamp', 'action', 'change_type', 'fields_changed', 'previous_version', 'new_version', 'source', 'article_url', 'is_demo', 'created_date', 'updated_date'])
      ),
      Media: mine(e.Media).filter((m) => m.status !== 'rejected'),
      Source: (e.Source || []).map((r) => pick(r, ['id', 'name', 'url', 'country', 'language', 'type', 'is_active', 'is_demo', 'created_date', 'updated_date'])),
    },
  }
}
