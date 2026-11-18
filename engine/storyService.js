// Construye o actualiza una Story a partir de sus artículos: análisis → scoring → editorial →
// entidades → media → evolución. Guarda StorySource, StoryUpdate y sube `version` cuando procede.
import { analyzeCluster } from './analysis.js'
import { classifyCluster } from './classifier.js'
import { buildEditorial, rankMembers } from './editorial.js'
import { extractEntities, extractRelations, persistEntities } from './entities.js'
import { deriveStatus, deriveTrend, detectEvolution } from './evolution.js'
import { mediaCandidates, persistMedia } from './media.js'
import { detectCountries } from './normalizer.js'
import { extractKeywords } from './semantic.js'
import { computeConfidence, computeScore } from './scoring.js'
import { duplicateGroupId } from './clustering.js'
import { uniq } from './stats.js'

/** Países de la historia: suma de pesos por artículo; solo los que superan un mínimo. */
function storyCountries(members) {
  const totals = new Map()
  for (const m of members) {
    for (const { code, weight } of detectCountries(`${m.title}\n${m.text}`)) totals.set(code, (totals.get(code) || 0) + weight)
  }
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  const top = ranked[0]?.[1] ?? 0
  return ranked.filter(([, w]) => w >= Math.max(2, top * 0.25)).slice(0, 6).map(([c]) => c)
}

function roleFor(member, analysis, leadUrl) {
  if (member.source_type === 'official' || member.source_type === 'data') return 'primary'
  const name = member.source_name || ''
  if (analysis.contradictions.some((c) => c.label.includes(name))) return 'contrast'
  if (member.url === leadUrl) return 'primary'
  return 'corroboration'
}

function sourceRow(m, analysis, story, leadUrl, isDemo) {
  const confirmedWithMe = analysis.knownFacts.filter((f) => f.status === 'confirmed' && f.sources.some((s) => s.url === m.url)).map((f) => f.text)
  const mine = analysis.knownFacts.find((f) => f.sources.some((s) => s.url === m.url))
  return {
    story_id: story.id,
    source_id: m.source_id ?? null,
    source_name: m.source_name,
    // Titular con el que lo publica este periódico (para comparar enfoques).
    title: m.title ?? null,
    url: m.url ?? null,
    country: m.country ?? null,
    language: m.language ?? null,
    source_type: m.source_type ?? null,
    published_at: m.published_at ?? null,
    retrieved_at: m.retrieved_at ?? null,
    reliability: m.reliability ?? null,
    contribution: mine?.text ?? m.title,
    agrees_with: confirmedWithMe.slice(0, 5),
    diverges_on: analysis.contradictions.filter((c) => c.label.includes(m.source_name || '')).map((c) => c.label).slice(0, 5),
    role: roleFor(m, analysis, leadUrl),
    is_demo: isDemo,
  }
}

/**
 * db: adaptador de entidades. story: Story existente o null.
 * oldMembers/newMembers: miembros normalizados ({ id, source_name, source_type, source_id, reliability, url,
 * canonical_url, title, text, published_at, retrieved_at, language, country, image_url }).
 */
export async function upsertStoryFromMembers(db, { story, oldMembers = [], newMembers, isDemo, batchId = null, now = new Date(), locale = 'es' }) {
  const members = [...oldMembers, ...newMembers]
  const analysis = analyzeCluster(members)
  const countries = storyCountries(members)
  const languages = uniq(members.map((m) => m.language))
  const cls = classifyCluster(members.map((m) => ({ title: m.title, text: m.text })), countries)
  const category = story && cls.method === 'fallback' ? story.category : cls.category
  const dates = members.map((m) => m.published_at).filter(Boolean).sort()
  const firstPublishedAt = story?.first_detected_at || dates[0] || now.toISOString()
  const lastPublishedAt = dates[dates.length - 1] || firstPublishedAt
  const allText = members.map((m) => `${m.title}\n${m.text}`).join('\n')

  const provisionalStatus = analysis.independentSources < 2 ? 'developing' : 'active'
  const editorial = buildEditorial({ members, analysis, category, countries, status: provisionalStatus, locale })
  const conf = computeConfidence({ analysis, languages, firstPublishedAt, lastPublishedAt, insufficientInfo: editorial.insufficient_info, correctedFacts: story?.has_corrections ? 1 : 0, now })
  const sc = computeScore({ category, countries, languages, analysis, text: allText, confidence: conf.confidence, status: provisionalStatus, firstPublishedAt, lastPublishedAt, now })

  const lead = rankMembers(members)[0]
  const sources = rankMembers(members)
    .slice(0, 30)
    .map((m) => ({ name: m.source_name, country: m.country ?? null, language: m.language ?? null, url: m.url ?? null, reliability: m.reliability ?? null, stance: null, published_at: m.published_at ?? null }))

  const next = {
    ...editorial,
    category,
    renivya_score: sc.score,
    score: sc.score,
    importance: sc.importance,
    score_breakdown: sc.breakdown,
    breaking_score: sc.breaking_score,
    is_breaking: sc.is_breaking,
    confidence: conf.confidence,
    confidence_status: conf.status,
    confidence_level: conf.level,
    confidence_breakdown: conf.breakdown,
    independent_sources: analysis.independentSources,
    agreement_ratio: analysis.agreementRatio,
    contradiction_flags: analysis.contradictions.map((c) => c.label),
    source_count: members.length,
    countries,
    // Países de la prensa que la cuenta (edición de país = su prensa + lo que ocurre allí).
    source_countries: uniq(members.map((m) => m.country)),
    languages,
    keywords: extractKeywords(members.map((m) => m.title).join(' '), allText, 8),
    sources,
    duplicate_group_id: story?.duplicate_group_id || duplicateGroupId(members),
    published_at: firstPublishedAt,
    first_detected_at: story?.first_detected_at || firstPublishedAt,
    trend: deriveTrend(dates, now),
    ai_generated: false,
    ingestion_batch: isDemo ? null : batchId,
    is_demo: isDemo,
    world_mode: true,
  }

  const previousUrls = new Set(oldMembers.map((m) => m.canonical_url || m.url))
  const evo = detectEvolution({ previous: story, next: { ...next, known_facts: editorial.known_facts }, newMembers, previousUrls })
  const resolved = evo.action === 'resolved'
  next.status = deriveStatus({ previous: story, resolved, independentSources: analysis.independentSources, firstPublishedAt, lastPublishedAt, bumped: evo.bump, now })

  const nowIso = new Date(now).toISOString()
  if (resolved && !story?.resolved_at) next.resolved_at = nowIso
  if (next.status === 'archived') next.archived_at = nowIso
  if (evo.action === 'correction') {
    next.has_corrections = true
    next.last_correction_summary = evo.summary
    next.last_correction_at = nowIso
  }
  if (next.is_breaking && !story?.is_breaking) next.breaking_detected_at = nowIso

  let saved
  if (story) {
    next.version = evo.bump ? (story.version || 1) + 1 : story.version || 1
    saved = await db.Story.update(story.id, next)
  } else {
    next.version = 1
    next.is_saved = false
    saved = await db.Story.create(next)
  }

  // Entidades (una por normalized_name), vínculos y relaciones con evidencia.
  const entityInput = { title: lead.title, text: members.map((m) => m.text).join('\n') }
  const entities = extractEntities(entityInput).slice(0, 25)
  const relations = extractRelations(entities, entityInput)
  const { names } = await persistEntities(db, { story: saved, entities, relations, isDemo })

  // Media con procedencia; la principal se elige de forma determinista.
  const imageUrl = await persistMedia(db, { storyId: saved.id, candidates: mediaCandidates(members), isDemo })

  const patch = { entities: names }
  if (imageUrl) patch.image_url = imageUrl
  saved = await db.Story.update(saved.id, patch)

  // Fuentes nuevas de la historia.
  if (newMembers.length) {
    const knownUrls = new Set((await db.StorySource.filter({ story_id: saved.id }, undefined, 500)).map((r) => r.url))
    const rows = newMembers.filter((m) => !knownUrls.has(m.url)).map((m) => sourceRow(m, analysis, saved, lead.url, isDemo))
    if (rows.length) await db.StorySource.bulkCreate(rows)
  }

  // Historial (nunca para duplicados puros ni cambios estáticos sin versión).
  const writeUpdate = !story || evo.bump || ['resolved', 'correction', 'breaking'].includes(evo.action)
  if (writeUpdate) {
    await db.StoryUpdate.create({
      story_id: saved.id,
      timestamp: nowIso,
      source: newMembers.map((m) => m.source_name).filter(Boolean).join(', ') || null,
      action: evo.action,
      change_type: evo.change_type,
      summary_of_change: evo.summary,
      whats_changed: evo.whats_changed,
      fields_changed: evo.fields_changed,
      previous_version: story ? story.version || 1 : null,
      new_version: saved.version,
      previous_confidence_status: story?.confidence_status ?? null,
      new_confidence_status: saved.confidence_status,
      previous_confidence: story?.confidence ?? null,
      new_confidence: saved.confidence,
      previous_score: story?.renivya_score ?? null,
      new_score: saved.renivya_score,
      article_url: newMembers[0]?.url ?? null,
      is_demo: isDemo,
    })
  }

  return { story: saved, created: !story, bumped: Boolean(story && evo.bump), evolution: evo }
}
