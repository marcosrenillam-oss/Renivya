// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// ProcessNewsItems: pending → normalized → clustered → created. Determinista salvo el embedding remoto opcional.
import { assignToStories, centroid, clusterDocuments, duplicateGroupId } from './clustering.ts'
import { getEmbeddings } from './embeddingProvider.ts'
import { extractEntities, normalizeEntityName } from './entities.ts'
import { canonicalUrl, normalizeNewsItem } from './normalizer.ts'
import { semanticSignature } from './semantic.ts'
import { upsertStoryFromMembers } from './storyService.ts'
import { computeRelatedStories } from './relations.ts'
import { foldAccents } from './normalizer.ts'

const ACTIVE = ['developing', 'active', 'updated']

function sourceKey(name) {
  return foldAccents(String(name || '').toLowerCase()).trim()
}

/** Miembro normalizado para el análisis a partir de un NewsItem y el catálogo de fuentes. */
export function toMember(item, normalized, source) {
  return {
    id: item.id,
    source_name: item.source_name ?? source?.name ?? null,
    source_id: source?.id ?? null,
    source_type: source?.type ?? null,
    reliability: source?.reliability ?? source?.reliability_score ?? null,
    url: item.url ?? null,
    canonical_url: normalized.canonical_url,
    content_hash: normalized.content_hash,
    title: normalized.title,
    text: normalized.cleaned_content,
    published_at: item.published_at ?? item.retrieved_at ?? null,
    retrieved_at: item.retrieved_at ?? null,
    language: normalized.normalized_language,
    country: item.country ?? source?.country ?? normalized.detected_country ?? null,
    image_url: item.image_url ?? null,
  }
}

/**
 * Procesa los NewsItem pendientes.
 * opts: { isDemo, batchId, now, embeddingProvider, locale, limit, log }
 */
export async function runPipeline(db, opts = {}) {
  const { isDemo = false, batchId = null, embeddingProvider = null, locale = 'es', limit = 200, log = () => {} } = opts
  const now = opts.now ? new Date(opts.now) : new Date()
  const stats = { pending: 0, ignored: 0, normalized: 0, assigned: 0, storiesCreated: 0, storiesUpdated: 0, versionBumps: 0, errors: [] }

  const pending = await db.NewsItem.filter({ status: 'pending', is_demo: isDemo }, 'published_at', limit)
  stats.pending = pending.length
  if (!pending.length) return stats

  const sources = await db.Source.filterAll({ is_demo: isDemo }, 'name', 2000)
  const sourceByName = new Map(sources.map((s) => [sourceKey(s.name), s]))

  // 1. Normalización + dedup EXACTA por URL canónica y content_hash.
  const urls = pending.map((p) => p.url).filter(Boolean)
  const processed = urls.length ? await db.NewsItem.filter({ url: { $in: urls }, status: { $ne: 'pending' } }, undefined, urls.length * 2) : []
  const seenUrls = new Set(processed.map((p) => canonicalUrl(p.url)).filter(Boolean))
  const seenHashes = new Set()
  const fresh = []
  for (const item of pending) {
    const n = normalizeNewsItem(item)
    if ((n.canonical_url && seenUrls.has(n.canonical_url)) || seenHashes.has(n.content_hash) || !n.title) {
      await db.NewsItem.update(item.id, { status: 'ignored', error: n.title ? 'duplicate' : 'empty', processed_at: now.toISOString() })
      stats.ignored++
      continue
    }
    if (n.canonical_url) seenUrls.add(n.canonical_url)
    seenHashes.add(n.content_hash)
    const ents = extractEntities({ title: n.title, text: n.cleaned_content }).slice(0, 12)
    const source = sourceByName.get(sourceKey(item.source_name))
    const member = toMember(item, n, source)
    const signature = semanticSignature(n.title, n.cleaned_content, ents.map((e) => e.name))
    await db.NewsItem.update(item.id, {
      status: 'normalized',
      cleaned_content: n.cleaned_content,
      normalized_language: n.normalized_language,
      detected_country: n.detected_country,
      semantic_signature: signature,
      detected_entities: ents.map((e) => e.name),
      error: null,
    })
    fresh.push({ item, member, entities: new Set(ents.map((e) => e.normalized_name)) })
    stats.normalized++
  }
  if (!fresh.length) return stats

  // 2. Embeddings (caché ArticleEmbedding por content_hash).
  const docFor = (m, ents) => ({ content_hash: m.content_hash, title: m.title, text: m.text, entities: [...ents], source_name: m.source_name, url: m.url, language: m.language })
  const { vectors: freshVectors } = await getEmbeddings(fresh.map((f) => docFor(f.member, f.entities)), { provider: embeddingProvider, cache: db.ArticleEmbedding, isDemo })
  const docs = fresh.map((f, i) => ({ ...f.member, key: f.item.id, embedding: freshVectors[i], entities: f.entities }))

  // 3. Perfiles de Stories activas recientes.
  const since = new Date(now.getTime() - 72 * 3_600_000).toISOString()
  const recent = await db.Story.filter({ is_demo: isDemo, status: { $in: ACTIVE }, updated_date: { $gte: since } }, '-updated_date', 200)
  const recentIds = recent.map((s) => s.id)
  const memberItems = recentIds.length ? await db.NewsItem.filterAll({ story_id: { $in: recentIds }, status: 'created' }, 'published_at', 4000) : []
  const oldMembersByStory = new Map()
  const oldDocs = memberItems.map((it) => {
    const n = normalizeNewsItem({ ...it, content: it.cleaned_content, description: '' })
    const m = toMember(it, { ...n, cleaned_content: it.cleaned_content || n.cleaned_content }, sourceByName.get(sourceKey(it.source_name)))
    if (!oldMembersByStory.has(it.story_id)) oldMembersByStory.set(it.story_id, [])
    oldMembersByStory.get(it.story_id).push(m)
    return { m, story_id: it.story_id, entities: new Set((it.detected_entities || []).map(normalizeEntityName)) }
  })
  const { vectors: oldVectors } = await getEmbeddings(oldDocs.map((d) => docFor(d.m, d.entities)), { provider: embeddingProvider, cache: db.ArticleEmbedding, isDemo })
  const profiles = recent.map((s) => {
    const own = oldDocs.map((d, i) => ({ d, v: oldVectors[i] })).filter(({ d }) => d.story_id === s.id)
    return {
      story_id: s.id,
      centroid: centroid(own.map((o) => o.v)),
      entities: new Set(own.flatMap((o) => [...o.d.entities])),
      last_published_at: own.map((o) => o.d.m.published_at).sort().pop() || s.published_at,
      urls: new Set(own.map((o) => o.d.m.canonical_url)),
    }
  }).filter((p) => p.centroid)

  // 4. Asignación a Stories existentes; el resto se agrupa en Stories nuevas.
  const assignment = assignToStories(docs, profiles)
  const groups = new Map()
  docs.forEach((d, i) => {
    const sid = assignment.get(i)
    if (sid) {
      if (!groups.has(sid)) groups.set(sid, [])
      groups.get(sid).push(i)
      stats.assigned++
    }
  })
  const unassigned = docs.map((_, i) => i).filter((i) => !assignment.has(i))
  const newClusters = clusterDocuments(unassigned.map((i) => docs[i])).map((c) => c.map((k) => unassigned[k]))

  const storyById = new Map(recent.map((s) => [s.id, s]))
  const touched = []
  const jobs = [...[...groups.entries()].map(([sid, idx]) => ({ story: storyById.get(sid), idx })), ...newClusters.map((idx) => ({ story: null, idx }))]

  for (const job of jobs) {
    const newMembers = job.idx.map((i) => docs[i])
    try {
      const { story, created, bumped } = await upsertStoryFromMembers(db, {
        story: job.story,
        oldMembers: job.story ? oldMembersByStory.get(job.story.id) || [] : [],
        newMembers,
        isDemo,
        batchId,
        now,
        locale,
      })
      if (created) stats.storiesCreated++
      else stats.storiesUpdated++
      if (bumped) stats.versionBumps++
      touched.push(story)
      const groupId = story.duplicate_group_id || duplicateGroupId(newMembers)
      for (const m of newMembers) {
        await db.NewsItem.update(m.key, { status: 'created', story_id: story.id, duplicate_group_id: groupId, processed_at: now.toISOString() })
      }
    } catch (error) {
      stats.errors.push(String(error?.message || error))
      log('error', error)
      for (const m of newMembers) await db.NewsItem.update(m.key, { status: 'pending', error: String(error?.message || error).slice(0, 500) })
    }
  }

  // 5. Historias relacionadas entre las activas.
  if (touched.length) {
    const pool = await db.Story.filter({ is_demo: isDemo, status: { $in: [...ACTIVE, 'resolved'] } }, '-updated_date', 300)
    const related = computeRelatedStories(pool)
    for (const s of touched) {
      const ids = related.get(s.id) || []
      if (JSON.stringify(ids) !== JSON.stringify(s.related_stories || [])) await db.Story.update(s.id, { related_stories: ids })
    }
  }
  log('pipeline', stats)
  return stats
}
