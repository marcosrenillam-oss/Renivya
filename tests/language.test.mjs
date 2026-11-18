import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createLocalClient } from '../src/api/localClient.js'
import { createDataAdapter, seedDemo } from '../engine/brain.js'
import { buildTranslation, contentLanguage, needsTranslation, storyInLocale, translationPayload } from '../engine/translation.js'
import { storyInEdition } from '../engine/editions.js'
import { appView } from '../engine/appView.js'
import { buildSnapshot } from '../engine/snapshot.js'

const NOW = new Date('2026-11-18T10:00:00Z')

async function demoStories() {
  const entities = createLocalClient({ memoryOnly: true }).entities
  const db = createDataAdapter(entities)
  await seedDemo(db, { round: 1, now: NOW })
  return { db, stories: await db.Story.filterAll({}, undefined, 1000) }
}

test('el texto de una historia está en un solo idioma y "por qué importa" existe en es y en', async () => {
  const { stories } = await demoStories()
  for (const s of stories) {
    assert.ok(['es', 'en', 'pt', 'fr', 'de'].includes(contentLanguage(s)))
    assert.ok(s.why_it_matters_i18n.es && s.why_it_matters_i18n.en)
    assert.ok(Array.isArray(s.source_countries) && s.source_countries.length > 0)
  }
  const en = stories.find((s) => contentLanguage(s) === 'en')
  assert.ok(en, 'hay una historia en inglés')
  // La versión inglesa no lleva plantillas en español.
  assert.doesNotMatch(storyInLocale(en, 'en').why_it_matters, /fuentes|países/)
})

test('sin traducción completa, la historia no se muestra en otro idioma (nunca mezcla)', async () => {
  const { stories } = await demoStories()
  const es = stories.find((s) => contentLanguage(s) === 'es')
  assert.ok(storyInLocale(es, 'es'))
  assert.equal(storyInLocale(es, 'en'), null)
  assert.equal(needsTranslation(es, 'en'), true)
  assert.equal(needsTranslation(es, 'es'), false)

  // Traducción incompleta (falta un párrafo): se rechaza.
  const payload = translationPayload(es)
  const bad = { ...payload, title: 'Title', body: payload.body.slice(1) }
  if (payload.body.length) assert.equal(buildTranslation(es, 'en', bad), null)

  // Traducción completa: se acepta y sustituye todo el texto.
  const good = Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, Array.isArray(v) ? v.map((x, i) => `EN ${k} ${i}`) : v ? `EN ${k}` : '']))
  const tr = buildTranslation(es, 'en', good, { model: 'test', at: NOW.toISOString() })
  assert.ok(tr)
  const shown = storyInLocale({ ...es, translations: { en: tr } }, 'en')
  assert.equal(shown.title, 'EN title')
  assert.ok(shown.body.every((p) => p.startsWith('EN ')))
  assert.ok(shown.known_facts.every((f) => f.text.startsWith('EN ')))
  assert.equal(shown.why_it_matters, es.why_it_matters_i18n.en)
  // Si la historia cambia de versión, la traducción se rehace.
  assert.equal(needsTranslation({ ...es, version: (es.version || 1) + 1, translations: { en: tr } }, 'en'), true)
})

test('ediciones por país: prensa del país + lo que ocurre allí', () => {
  assert.equal(storyInEdition({ source_countries: ['ES'], countries: ['CL'] }, 'ES'), true)
  assert.equal(storyInEdition({ source_countries: ['US'], countries: ['ES'] }, 'ES'), true)
  assert.equal(storyInEdition({ source_countries: ['US'], countries: ['MX'] }, 'ES'), false)
})

test('app.json ligero: sin artículos ni entidades, con historias y fuentes', async () => {
  const snap = await buildSnapshot({ entities: createLocalClient({ memoryOnly: true }).entities, now: NOW })
  const app = appView(snap)
  assert.deepEqual(Object.keys(app.entities).sort(), ['Media', 'Source', 'Story', 'StorySource', 'StoryUpdate'])
  assert.ok(app.entities.Story.length > 0)
  assert.ok(app.entities.Story.every((s) => !('provenance' in s)))
  assert.ok(JSON.stringify(app).length < JSON.stringify(snap).length)
})

test('cuenta: alta sin códigos, contraseña solo como hash, entrada y error con clave mala', async () => {
  const c = createLocalClient({ memoryOnly: true })
  const { user } = await c.auth.register({ name: 'Ana', email: 'Ana@Gmail.com ', password: 'secreto1', country: 'ES', locale: 'es' })
  assert.equal(user.email, 'ana@gmail.com')
  assert.equal(user.full_name, 'Ana')
  assert.equal(user.country, 'ES')
  c.auth.logout()
  await assert.rejects(() => c.auth.loginViaEmailPassword('ana@gmail.com', 'otra'), /incorrectos/)
  const { user: again } = await c.auth.loginViaEmailPassword('ana@gmail.com', 'secreto1')
  assert.equal(again.id, user.id)
  await assert.rejects(() => c.auth.register({ name: 'X', email: 'ana@gmail.com', password: 'secreto1' }), /ya tiene cuenta/)
  await assert.rejects(() => c.auth.register({ name: 'X', email: 'no-es-correo', password: 'secreto1' }), /no válido/)
})
