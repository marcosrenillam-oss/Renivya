// Pruebas del motor en Node (node --test tests/). Usa el adaptador local en memoria.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLocalClient } from '../src/api/localClient.js'
import { createDataAdapter, seedDemo } from '../base44/shared/news/brain.ts'
import { classifyCategory } from '../base44/shared/news/classifier.ts'
import { computeScore, computeConfidence, SCORE_WEIGHTS } from '../base44/shared/news/scoring.ts'
import { canonicalUrl, detectLanguage, detectCountries } from '../base44/shared/news/normalizer.ts'
import { normalizeEntityName, extractEntities, extractRelations } from '../base44/shared/news/entities.ts'
import { localEmbedding } from '../base44/shared/news/embeddingProvider.ts'
import { cosine } from '../base44/shared/news/semantic.ts'
import { parseFeed } from '../base44/shared/news/rss.ts'

const NOW = new Date('2026-11-17T12:00:00Z')

test('pesos del SCORE suman 1 y confidence_context es 5 %', () => {
  const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0)
  assert.equal(Math.round(total * 1000), 1000)
  assert.equal(SCORE_WEIGHTS.confidence_context, 0.05)
})

test('clasificador determinista y multilingüe', () => {
  assert.equal(classifyCategory({ title: 'El Real Valmar CF gana la final de la Copa', text: 'goles del delantero en el estadio de fútbol' }).category, 'football')
  assert.equal(classifyCategory({ title: 'Lumen Labs lanza un modelo de inteligencia artificial', text: '' }).category, 'artificial_intelligence')
  assert.equal(classifyCategory({ title: 'La inflation recule en zone euro', text: 'la banque centrale maintient ses taux' }).category, 'economy')
  const a = classifyCategory({ title: 'Floods displace thousands', text: 'Red Cross shelters' })
  const b = classifyCategory({ title: 'Floods displace thousands', text: 'Red Cross shelters' })
  assert.deepEqual(a, b)
})

test('normalización: URL canónica, idioma y país', () => {
  assert.equal(canonicalUrl('http://www.Example.com/a/b/?utm_source=x&id=2#frag'), 'https://example.com/a/b?id=2')
  assert.equal(detectLanguage('Les inondations dans la région ont fait au moins 18 morts selon les autorités et la Croix-Rouge').language, 'fr')
  assert.equal(detectCountries('Las inundaciones en Kenia dejan miles de desplazados')[0].code, 'KE')
  assert.equal(detectCountries('Floods in Kenya displace thousands')[0].code, 'KE')
})

test('normalized_name exacto y conflicto ciudad/club', () => {
  assert.equal(normalizeEntityName('  Real Valmar C.F. '), 'real valmar cf')
  const ents = extractEntities({ title: 'El Real Valmar CF gana en Sevilla', text: 'El Real Valmar CF contra el Atlético Norte en Sevilla. Marta Ibarra, entrenadora del Real Valmar CF, celebró el título.' })
  const byName = Object.fromEntries(ents.map((e) => [e.normalized_name, e.type]))
  assert.equal(byName['real valmar cf'], 'sports_team')
  assert.equal(byName['sevilla'], 'city')
  assert.equal(byName['marta ibarra'], 'person')
  // Una pista de empresa posterior corrige una primera lectura como persona (titular).
  const helios = extractEntities({ title: 'Helios Grid abre en Portugal un parque solar', text: 'El consorcio Helios Grid ha inaugurado la planta.' })
  assert.equal(helios.find((e) => e.normalized_name === 'helios grid')?.type, 'company')
  const rels = extractRelations(ents, { title: '', text: 'El Real Valmar CF contra el Atlético Norte terminó 3-1. Marta Ibarra, entrenadora del Real Valmar CF, celebró.' })
  const types = rels.map((r) => `${r.source}>${r.relation_type}>${r.target}`)
  assert.ok(types.includes('real valmar cf>opponent_of>atlético norte'), types.join(' | '))
  assert.ok(types.includes('marta ibarra>leads>real valmar cf'), types.join(' | '))
})

test('embeddings locales: mismo suceso en dos idiomas más cerca que sucesos distintos', () => {
  const es = localEmbedding({ title: 'Inundaciones en Kenia dejan 12 muertos', text: 'Las inundaciones obligan a desplazarse a miles de personas; la Cruz Roja abre albergues.' })
  const en = localEmbedding({ title: 'Floods in Kenya kill 12', text: 'Floods displaced thousands of people; the Red Cross opened shelters.' })
  const other = localEmbedding({ title: 'Lumen Labs lanza un modelo de inteligencia artificial', text: 'La empresa presenta un modelo de lenguaje abierto.' })
  assert.ok(cosine(es, en) > cosine(es, other) + 0.1, `${cosine(es, en)} vs ${cosine(es, other)}`)
})

test('SCORE y CONFIDENCE deterministas e independientes', () => {
  const analysis = { independentSources: 3, totalSources: 3, factStats: { confirmed: 3, reported: 1, unconfirmed: 0, disputed: 0 }, agreementRatio: 90, majorContradictions: 0, minorDiscrepancies: 0, primarySource: { found: true } }
  const c1 = computeConfidence({ analysis, languages: ['es', 'en'], firstPublishedAt: '2026-11-17T02:00:00Z', lastPublishedAt: '2026-11-17T08:00:00Z', now: NOW })
  const c2 = computeConfidence({ analysis, languages: ['es', 'en'], firstPublishedAt: '2026-11-17T02:00:00Z', lastPublishedAt: '2026-11-17T08:00:00Z', now: NOW })
  assert.deepEqual(c1, c2)
  const contradicted = computeConfidence({ analysis: { ...analysis, majorContradictions: 2 }, languages: ['es'], firstPublishedAt: '2026-11-17T02:00:00Z', now: NOW })
  assert.ok(contradicted.confidence < c1.confidence)
  const s = computeScore({ category: 'world', countries: ['KE'], languages: ['en'], analysis, text: '12 muertos', confidence: c1.confidence, firstPublishedAt: '2026-11-17T02:00:00Z', now: NOW })
  const sLowConf = computeScore({ category: 'world', countries: ['KE'], languages: ['en'], analysis, text: '12 muertos', confidence: 10, firstPublishedAt: '2026-11-17T02:00:00Z', now: NOW })
  assert.ok(s.score - sLowConf.score <= 5, 'la confianza no domina el SCORE')
})

test('RSS y Atom', () => {
  const rss = '<rss><channel><item><title><![CDATA[Titular &amp; más]]></title><link>https://a.example/1</link><description>&lt;p&gt;Hola&lt;/p&gt;</description><pubDate>Tue, 17 Nov 2026 10:00:00 GMT</pubDate><media:content url="https://img.example/1.jpg" medium="image"/></item></channel></rss>'
  const [item] = parseFeed(rss)
  assert.equal(item.title, 'Titular & más')
  assert.equal(item.image_url, 'https://img.example/1.jpg')
  assert.equal(item.author, null)
  const atom = '<feed><entry><title>Atom title</title><link href="https://b.example/2"/><updated>2026-11-17T10:00:00Z</updated><summary>x</summary></entry></feed>'
  assert.equal(parseFeed(atom)[0].url, 'https://b.example/2')
})

test('pipeline de demo: agrupa, versiona, contradicciones y sin atribución inventada', async () => {
  const db = createDataAdapter(createLocalClient({ memoryOnly: true }).entities)
  const r1 = await seedDemo(db, { round: 1, now: new Date(NOW.getTime() - 3 * 3_600_000) })
  assert.equal(r1.stats.errors.length, 0, r1.stats.errors.join('\n'))
  const stories1 = await db.Story.list()
  const titles = stories1.map((s) => `${s.category}: ${s.title} [${s.source_count}]`)
  // 16 artículos → 7 acontecimientos
  assert.equal(stories1.length, 7, titles.join('\n'))
  assert.ok(stories1.every((s) => s.is_demo === true && s.ingestion_batch === null))
  const lumen = stories1.find((s) => /Lumen/.test(s.title))
  assert.equal(lumen.source_count, 3)
  assert.equal(lumen.category, 'artificial_intelligence')
  assert.equal(new Set(lumen.languages).size, 3)
  const kesra = stories1.find((s) => (s.countries || []).includes('KE'))
  assert.ok(kesra.contradiction_flags.length >= 1, 'cifras de muertos en conflicto')
  const copa = stories1.find((s) => /Copa/.test(s.title))
  assert.equal(copa.category, 'football')

  const r2 = await seedDemo(db, { round: 2, now: NOW })
  assert.equal(r2.stats.errors.length, 0, r2.stats.errors.join('\n'))
  const stories2 = await db.Story.list()
  assert.equal(stories2.length, 8, 'aparece el terremoto como historia nueva')
  const valdecruz = stories2.find((s) => /Valdecruz/.test(s.title))
  assert.ok(valdecruz.version >= 2, 'la historia sube de versión')
  assert.equal(valdecruz.has_corrections, true)
  const updates = await db.StoryUpdate.filter({ story_id: valdecruz.id })
  assert.ok(updates.some((u) => u.action === 'created') && updates.some((u) => u.action === 'correction'))
  for (const u of updates) for (const line of u.whats_changed || []) assert.ok(!/\d+\s*\/\s*100|score|confianza \d/i.test(line), line)

  // Entidades sin duplicados por normalized_name y StoryEntity idempotente.
  const entities = await db.Entity.list()
  const norms = entities.map((e) => e.normalized_name)
  assert.equal(new Set(norms).size, norms.length)
  const links = await db.StoryEntity.list()
  const pairs = links.map((l) => `${l.story_id}|${l.entity_id}`)
  assert.equal(new Set(pairs).size, pairs.length)
  assert.ok(entities.every((e) => e.description === null && e.external_id === null))

  // Reprocesar sin artículos nuevos no cambia nada (idempotencia por URL canónica).
  const r3 = await seedDemo(db, { round: 2, now: NOW })
  assert.equal(r3.ingest.created, 0)
  assert.equal((await db.Story.list()).length, 8)
})
