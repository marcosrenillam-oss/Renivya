// @ts-nocheck
// Ejecuta las funciones backend reales contra el SDK simulado.
// deno test --allow-read --allow-env --import-map=tests/deno/import_map.json tests/deno/functions.test.ts
import { assert, assertEquals } from 'jsr:@std/assert@1'
import { calls, store } from './fakeSdk.js'
import { createDataAdapter, seedDemo } from '../../base44/shared/news/brain.ts'

const handlers = {}
let current = null
globalThis.Deno.serve = (h) => {
  handlers[current] = h
  return { finished: Promise.resolve(), shutdown() {} }
}
for (const name of ['FetchNewsFeeds', 'ProcessNewsItems', 'TranslateStoryContent', 'CleanOldStories', 'EmbedArticles', 'getWorldReport', 'TestEmbeddingMultilingual', 'TestSemanticIdentity']) {
  current = name
  await import(`../../base44/functions/${name}/entry.ts`)
}

const call = async (name, body = {}, role = 'admin') => {
  const res = await handlers[name](new Request('https://app.test/fn', { method: 'POST', headers: { 'content-type': 'application/json', ...(role ? { 'x-test-role': role } : {}) }, body: JSON.stringify(body) }))
  return { status: res.status, body: await res.json() }
}

Deno.test('autorización: mantenimiento solo admin', async () => {
  assertEquals((await call('ProcessNewsItems', {}, null)).status, 401)
  assertEquals((await call('ProcessNewsItems', {}, 'user')).status, 403)
  assertEquals((await call('CleanOldStories', {}, 'user')).status, 403)
})

Deno.test('ProcessNewsItems procesa demo y getWorldReport agrega', async () => {
  const db = createDataAdapter(store.entities)
  await seedDemo(db, { round: 1 }) // crea NewsItems + Stories
  const { demoNewsItems } = await import('../../base44/shared/news/mock.ts')
  await db.NewsItem.bulkCreate(demoNewsItems(2)) // pendientes para la función
  const r = await call('ProcessNewsItems', { demo: true })
  assertEquals(r.status, 200)
  assert(r.body.stats.storiesUpdated >= 2, JSON.stringify(r.body.stats))
  assertEquals(r.body.stats.errors.length, 0)
  const w = await call('getWorldReport', {}, 'user')
  assertEquals(w.status, 200)
  assert(w.body.report.countries.some((c) => c.code === 'KE'))
})

Deno.test('TranslateStoryContent: LLM solo si falta; después se lee de translations', async () => {
  const [story] = await store.entities.Story.list('-renivya_score', 1)
  assertEquals((await call('TranslateStoryContent', { story_id: story.id, locale: 'xx' }, 'user')).status, 400)
  const before = calls.llm
  const first = await call('TranslateStoryContent', { story_id: story.id, locale: 'en' }, 'user')
  assertEquals(first.status, 200)
  assertEquals(first.body.cached, false)
  const second = await call('TranslateStoryContent', { story_id: story.id, locale: 'en' }, 'user')
  assertEquals(second.body.cached, true)
  assertEquals(calls.llm - before, 1, 'una sola llamada al LLM')
  const saved = await store.entities.Story.get(story.id)
  assertEquals(saved.translations.en.status, 'ready')
  assertEquals(saved.title, story.title, 'el original no se sobrescribe')
  assertEquals(saved.version, story.version, 'traducir no cambia la versión')
})

Deno.test('Diagnósticos y mantenimiento', async () => {
  const id = await call('TestSemanticIdentity')
  assertEquals(id.status, 200)
  assert(id.body.passed, JSON.stringify(id.body.groups.map((g) => g.map((x) => x.expected))))
  const emb = await call('TestEmbeddingMultilingual')
  assert(emb.body.results[0].passed)
  const e = await call('EmbedArticles')
  assertEquals(e.status, 200)
  const clean = await call('CleanOldStories', { days: 30 })
  assertEquals(clean.status, 200)
  assertEquals(clean.body.report.stories, 0, 'nada tiene más de 30 días')
})

Deno.test('FetchNewsFeeds sin fuentes reales activas no falla', async () => {
  const r = await call('FetchNewsFeeds')
  assertEquals(r.status, 200)
  assertEquals(r.body.report.sources, 0)
})
