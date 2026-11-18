// Pruebas del motor en Node (node --test tests/). Usa el adaptador local en memoria.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLocalClient } from '../src/api/localClient.js'
import { createDataAdapter, seedDemo } from '../engine/brain.js'
import { classifyCategory } from '../engine/classifier.js'
import { computeScore, computeConfidence, SCORE_WEIGHTS } from '../engine/scoring.js'
import { canonicalUrl, detectLanguage, detectCountries } from '../engine/normalizer.js'
import { normalizeEntityName, extractEntities, extractRelations } from '../engine/entities.js'
import { localEmbedding } from '../engine/embeddingProvider.js'
import { cosine } from '../engine/semantic.js'
import { parseFeed } from '../engine/rss.js'

const NOW = new Date('2026-11-17T12:00:00Z')

test('pesos del SCORE suman 1 y confidence_context es 5 %', () => {
  const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0)
  assert.equal(Math.round(total * 1000), 1000)
  assert.equal(SCORE_WEIGHTS.confidence_context, 0.05)
})

test('clasificador determinista y multilingüe', () => {
  assert.equal(classifyCategory({ title: 'El Real Valmar CF gana la final de la Copa', text: 'goles del delantero en el estadio de fútbol' }).category, 'football')
  assert.equal(classifyCategory({ title: 'Lumen Labs lanza un modelo de inteligencia artificial', text: '' }).category, 'artificial_intelligence')
  assert.equal(classifyCategory({ title: 'El Real Valmar CF gana la final de la Copa' }).category, 'football')
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

test('ingesta real: RSS → NewsItems (sin duplicar) → Stories con fiabilidad provisional', async () => {
  const { runIngestionCycle, ensureSources } = await import('../engine/brain.js')
  const { createRealNewsProvider } = await import('../engine/realIngestion.js')
  const db = createDataAdapter(createLocalClient({ memoryOnly: true }).entities)
  await ensureSources(db, [{ name: 'Feed Prueba', feed_url: 'https://feed.test/rss', country: 'ES', language: 'es', type: 'newspaper', reliability: null, is_active: true, is_demo: false }])
  const rss = `<rss><channel>
    <item><title>Un terremoto sacude el sur de Chile</title><link>https://feed.test/a?utm_source=x</link>
      <description>Un terremoto de magnitud 6,1 ha sacudido el sur de Chile este jueves según el servicio sismológico nacional. Las autoridades evacuaron varias localidades costeras de forma preventiva.</description>
      <pubDate>Tue, 17 Nov 2026 10:00:00 GMT</pubDate><media:content url="https://img.test/1.jpg" medium="image"/></item>
    <item><title>Un terremoto sacude el sur de Chile</title><link>https://feed.test/a</link><description>duplicado</description></item>
  </channel></rss>`
  const provider = createRealNewsProvider({ fetchImpl: async () => new Response(rss, { status: 200 }) })
  const report = await runIngestionCycle(db, { provider, now: NOW })
  assert.equal(report.created, 1, 'la URL con utm es la misma URL canónica')
  assert.equal(report.pipeline.storiesCreated, 1)
  const [story] = await db.Story.list()
  assert.equal(story.is_demo, false)
  assert.ok(story.ingestion_batch?.startsWith('batch_'))
  const [media] = await db.Media.list()
  assert.equal(media.url, 'https://img.test/1.jpg')
  assert.equal(media.author, null)
  assert.equal(media.license, null)
  // Segundo ciclo inmediato: la fuente está limitada por last_fetched_at.
  const again = await runIngestionCycle(db, { provider, now: NOW })
  assert.equal(again.created, 0)
})

test('snapshot horario: el estado pasa de una ejecución a la siguiente y la historia evoluciona', async () => {
  const { buildSnapshot } = await import('../engine/snapshot.js')
  const { createRealNewsProvider } = await import('../engine/realIngestion.js')
  const sources = [
    { name: 'Diario A', feed_url: 'https://a.test/rss', country: 'ES', language: 'es', type: 'newspaper', reliability: null, is_active: true, is_demo: false },
    { name: 'Agencia B', feed_url: 'https://b.test/rss', country: 'ES', language: 'es', type: 'agency', reliability: null, is_active: true, is_demo: false },
  ]
  const item = (url, title, text, date) => `<item><title>${title}</title><link>${url}</link><description>${text}</description><pubDate>${new Date(date).toUTCString()}</pubDate></item>`
  const feeds = {
    'https://a.test/rss': [item('https://a.test/1', 'Un terremoto de magnitud 6,1 sacude el sur de Chile', 'Un terremoto de magnitud 6,1 ha sacudido el sur de Chile según el servicio sismológico nacional. Varias localidades costeras fueron evacuadas de forma preventiva y no hay víctimas.', '2026-11-17T09:00:00Z')],
    'https://b.test/rss': [],
  }
  const provider = createRealNewsProvider({ fetchImpl: async (url) => new Response(`<rss><channel>${feeds[url].join('')}</channel></rss>`) })
  const t1 = new Date('2026-11-17T10:00:00Z')
  const s1 = await buildSnapshot({ entities: createLocalClient({ memoryOnly: true }).entities, provider, sources, now: t1 })
  assert.equal(s1.mode, 'real')
  assert.equal(s1.counts.Story, 1)
  assert.ok(s1.entities.Story.every((s) => !s.is_demo))

  // Una hora después, otra fuente publica sobre el mismo suceso.
  feeds['https://b.test/rss'] = [item('https://b.test/9', 'Terremoto de magnitud 6,1 en el sur de Chile: evacuaciones preventivas', 'El terremoto de magnitud 6,1 que sacudió el sur de Chile obligó a evacuar localidades costeras. El servicio sismológico nacional no informa de víctimas.', '2026-11-17T10:30:00Z')]
  const t2 = new Date('2026-11-17T11:00:00Z')
  const s2 = await buildSnapshot({ entities: createLocalClient({ memoryOnly: true }).entities, previous: JSON.parse(JSON.stringify(s1)), provider, sources, now: t2 })
  assert.equal(s2.counts.Story, 1, 'se agrupa con la historia existente, no crea otra')
  const story = s2.entities.Story[0]
  assert.equal(story.id, s1.entities.Story[0].id, 'misma historia (mismo id)')
  assert.equal(story.source_count, 2)
  assert.ok(story.version >= 2, 'sube de versión')
  assert.ok(s2.entities.StoryUpdate.length >= 2)

  // Si ningún feed responde y no hay estado previo: demostración, nunca vacío.
  const down = createRealNewsProvider({ fetchImpl: async () => { throw new Error('offline') } })
  const s3 = await buildSnapshot({ entities: createLocalClient({ memoryOnly: true }).entities, provider: down, sources, now: t2 })
  assert.equal(s3.mode, 'demo')
  assert.ok(s3.counts.Story > 0)
})
