import { base44 } from '@/api/base44Client'

/** Agregados para la página de Analítica (aquí SÍ se muestran métricas técnicas). */
export async function loadAnalytics({ days = 14 } = {}) {
  const E = base44.entities
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const [stories, updates, sources] = await Promise.all([
    E.Story.filter({ status: { $ne: 'archived' } }, '-renivya_score', 500),
    E.StoryUpdate.filter({ timestamp: { $gte: since } }, '-timestamp', 2000),
    E.StorySource.list('-created_date', 3000),
  ])

  const byCategory = new Map()
  for (const s of stories) {
    const c = byCategory.get(s.category) || { category: s.category, count: 0, score: 0, confidence: 0 }
    c.count++
    c.score += s.renivya_score ?? 0
    c.confidence += s.confidence ?? 0
    byCategory.set(s.category, c)
  }
  const categories = [...byCategory.values()]
    .map((c) => ({ ...c, score: Math.round(c.score / c.count), confidence: Math.round(c.confidence / c.count) }))
    .sort((a, b) => b.count - a.count)

  const byCountry = new Map()
  for (const s of stories) for (const c of s.countries || []) byCountry.set(c, (byCountry.get(c) || 0) + 1)
  const countries = [...byCountry.entries()].map(([code, count]) => ({ code, count })).sort((a, b) => b.count - a.count).slice(0, 12)

  const bySource = new Map()
  for (const r of sources) bySource.set(r.source_name, (bySource.get(r.source_name) || 0) + 1)
  const topSources = [...bySource.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 12)

  const dayKeys = Array.from({ length: days }, (_, i) => new Date(Date.now() - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10))
  const changes = dayKeys.map((day) => {
    const row = { day, new: 0, additional: 0, correction: 0, contradiction: 0, evolution: 0 }
    for (const u of updates) {
      if (String(u.timestamp).slice(0, 10) !== day) continue
      if (row[u.change_type] !== undefined) row[u.change_type]++
    }
    return row
  })

  const scatter = stories.map((s) => ({ id: s.id, title: s.title, category: s.category, score: s.renivya_score ?? 0, confidence: s.confidence ?? 0 }))
  const mean = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0)

  return {
    totals: {
      stories: stories.length,
      live: stories.filter((s) => ['developing', 'active', 'updated'].includes(s.status)).length,
      breaking: stories.filter((s) => s.is_breaking).length,
      sources: bySource.size,
      avgScore: mean(stories.map((s) => s.renivya_score ?? 0)),
      avgConfidence: mean(stories.map((s) => s.confidence ?? 0)),
      corrections: stories.filter((s) => s.has_corrections).length,
      contradictions: stories.filter((s) => (s.contradiction_flags || []).length).length,
    },
    categories,
    countries,
    topSources,
    changes,
    scatter,
    topStories: stories.slice(0, 8),
  }
}
