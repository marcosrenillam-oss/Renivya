import { normalizeEntityName } from './entityService.js'

/**
 * Digest de portada. Determinista: mismas Stories + mismas preferencias → mismo resultado.
 * - Filtros duros: categorías/entidades excluidas, SCORE y confianza mínimos.
 * - Modo WORLD: importancia global, sin personalización.
 * - Modo personal: refuerzos por categorías, países, entidades y temas seguidos.
 * - Diversidad: máximo 3 historias por categoría en la selección principal.
 * Nada de esto se muestra como cifra en la portada.
 */
const LIVE = new Set(['developing', 'active', 'updated', 'resolved'])
const MAX_PER_CATEGORY = 3

function textOf(s) {
  return `${s.title} ${s.summary} ${(s.keywords || []).join(' ')}`.toLowerCase()
}

export function personalBoost(story, pref) {
  if (!pref || pref.world_mode_enabled) return 0
  let boost = 0
  if ((pref.preferred_categories || []).includes(story.category)) boost += 8
  const countries = story.countries || []
  if ((pref.followed_countries || []).some((c) => countries.includes(c))) boost += 6
  if (pref.primary_country && countries.includes(pref.primary_country)) boost += 5
  const ents = new Set((story.entities || []).map(normalizeEntityName))
  if ((pref.followed_entities || []).some((e) => ents.has(normalizeEntityName(e)))) boost += 7
  const text = textOf(story)
  if ((pref.keywords || []).some((k) => k && text.includes(String(k).toLowerCase()))) boost += 5
  return boost
}

export function passesHardFilters(story, pref) {
  if (!LIVE.has(story.status ?? 'active')) return false
  if (!pref) return true
  if ((pref.excluded_categories || []).includes(story.category)) return false
  const ents = new Set((story.entities || []).map(normalizeEntityName))
  if ((pref.excluded_entities || []).some((e) => ents.has(normalizeEntityName(e)))) return false
  if ((story.renivya_score ?? 0) < (pref.minimum_score ?? 0)) return false
  if ((story.confidence ?? 0) < (pref.minimum_confidence ?? 0)) return false
  return true
}

function rank(stories, pref) {
  return stories
    .map((s) => ({ s, r: (s.renivya_score ?? 0) + personalBoost(s, pref) + (s.is_breaking ? 6 : 0) }))
    .sort((a, b) => b.r - a.r || String(b.s.published_at || '').localeCompare(String(a.s.published_at || '')) || String(a.s.id).localeCompare(String(b.s.id)))
    .map((x) => x.s)
}

export function buildDigest(stories, pref = null) {
  const eligible = stories.filter((s) => passesHardFilters(s, pref))
  const ranked = rank(eligible, pref)
  const size = Math.max(3, pref?.digest_size ?? 10)

  const selected = []
  const perCategory = new Map()
  for (const s of ranked) {
    const n = perCategory.get(s.category) || 0
    if (n >= MAX_PER_CATEGORY) continue
    perCategory.set(s.category, n + 1)
    selected.push(s)
    if (selected.length >= size) break
  }
  const [lead = null, ...top] = selected
  const used = new Set(selected.map((s) => s.id))

  const primary = pref?.primary_country || 'ES'
  const primaryCountry = ranked.filter((s) => !used.has(s.id) && (s.countries || []).includes(primary)).slice(0, 4)

  const sections = []
  const byCategory = new Map()
  for (const s of ranked) {
    if (s.id === lead?.id) continue
    if (!byCategory.has(s.category)) byCategory.set(s.category, [])
    byCategory.get(s.category).push(s)
  }
  for (const [category, list] of byCategory) if (list.length) sections.push({ category, stories: list.slice(0, 3) })
  sections.sort((a, b) => (b.stories[0]?.renivya_score ?? 0) - (a.stories[0]?.renivya_score ?? 0))

  const breaking = ranked.filter((s) => s.is_breaking).slice(0, 3)

  return {
    lead,
    top,
    breaking,
    primaryCountry: { code: primary, stories: primaryCountry },
    sections: sections.slice(0, 6),
    briefing: selected.slice(0, 5),
    excluded: stories.length - eligible.length,
    total: eligible.length,
  }
}
