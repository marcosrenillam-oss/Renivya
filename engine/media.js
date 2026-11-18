// Paso 8: media con procedencia completa. Dedup por URL canónica EXACTA.
// Una imagen nunca se atribuye a RENIVYA: autor/crédito/licencia solo si vienen del feed; si no, null.
import { canonicalUrl } from './normalizer.js'
import { stableSort } from './stats.js'

function isHttpUrl(u) {
  try {
    const p = new URL(u)
    return p.protocol === 'https:' || p.protocol === 'http:'
  } catch {
    return false
  }
}

/** Candidatos a partir de los artículos del grupo. */
export function mediaCandidates(members) {
  const out = new Map()
  for (const m of members) {
    if (!m.image_url || !isHttpUrl(m.image_url)) continue
    const url = canonicalUrl(m.image_url) || m.image_url
    if (out.has(url)) continue
    out.set(url, {
      url,
      type: 'image',
      news_item_id: m.id ?? null,
      source_id: m.source_id ?? null,
      source_name: m.source_name ?? null,
      source_article_url: m.url ?? null,
      author: m.image_author ?? null,
      credit: m.image_credit ?? null,
      license: m.image_license ?? null,
      alt_text: m.image_alt ?? null,
      caption: m.image_caption ?? null,
      published_at: m.published_at ?? null,
      reliability: m.reliability ?? null,
    })
  }
  return [...out.values()]
}

/** Imagen principal: fuente más fiable, luego la más antigua, luego URL (determinista). */
export function selectPrimaryMedia(candidates) {
  return (
    stableSort(
      candidates,
      (a, b) => (b.reliability ?? 60) - (a.reliability ?? 60) || String(a.published_at || '').localeCompare(String(b.published_at || '')),
      (c) => c.url
    )[0] ?? null
  )
}

/** Guarda Media de una Story sin duplicar URLs. Devuelve la URL principal o null. */
export async function persistMedia(db, { storyId, candidates, isDemo }) {
  if (!candidates.length) return null
  const existing = await db.Media.filter({ url: { $in: candidates.map((c) => c.url) } }, undefined, candidates.length * 2)
  const known = new Map(existing.map((m) => [m.url, m]))
  const primary = selectPrimaryMedia([...candidates, ...existing.filter((m) => m.story_id === storyId && m.status === 'active')])
  const rows = candidates
    .filter((c) => !known.has(c.url))
    .map(({ reliability, ...c }) => ({ ...c, story_id: storyId, is_primary: c.url === primary?.url, status: 'active', is_demo: isDemo }))
  if (rows.length) await db.Media.bulkCreate(rows)
  // Mantener una sola primaria por Story.
  for (const m of existing) {
    if (m.story_id === storyId && m.is_primary && m.url !== primary?.url) await db.Media.update(m.id, { is_primary: false })
    if (m.story_id === storyId && !m.is_primary && m.url === primary?.url) await db.Media.update(m.id, { is_primary: true })
  }
  return primary?.url ?? null
}
