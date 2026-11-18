import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pickAlerts, readPushConfig, sendAlerts } from '../scripts/notify.mjs'

const NOW = new Date('2026-11-18T10:00:00Z')
const story = (id, extra = {}) => ({
  id, title: `Titular ${id}`, summary: 'Resumen.', is_breaking: true, is_demo: false, status: 'active',
  content_language: 'es', source_countries: ['ES'], countries: ['ES'], renivya_score: 80,
  breaking_detected_at: '2026-11-18T09:40:00Z', ...extra,
})

test('avisos: solo última hora reciente, de la edición, en el idioma y sin repetir', () => {
  const stories = [
    story('a'),
    story('b', { breaking_detected_at: '2026-11-18T05:00:00Z' }), // antigua
    story('c', { source_countries: ['US'], countries: ['US'] }), // otra edición
    story('d', { content_language: 'en' }), // sin traducción al español
    story('e', { is_breaking: false }),
    story('f'),
  ]
  const ids = pickAlerts(stories, { edition: 'ES', locale: 'es', notified: new Set(['f']), now: NOW }).map((s) => s.id)
  assert.deepEqual(ids, ['a'])
})

test('avisos: el código de la app se lee y los enviados se recuerdan', async () => {
  const sub = { endpoint: 'https://push.example/abc', keys: { p256dh: 'x', auth: 'y' } }
  const cfg = { v: 1, sub, pub: 'P', priv: 'Q', edition: 'ES', locale: 'es' }
  process.env.RENIVYA_AVISOS = Buffer.from(JSON.stringify(cfg)).toString('base64')
  assert.equal(readPushConfig().edition, 'ES')
  const sent = []
  const realNow = Date.now
  Date.now = () => NOW.getTime()
  try {
    const crypto = await import('node:crypto')
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const pub = Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url')
    const jwk = publicKey.export({ format: 'jwk' })
    const raw = Buffer.concat([Buffer.from([4]), Buffer.from(jwk.x, 'base64url'), Buffer.from(jwk.y, 'base64url')]).toString('base64url')
    process.env.RENIVYA_AVISOS = Buffer.from(JSON.stringify({ ...cfg, pub: raw, priv: privateKey.export({ format: 'jwk' }).d })).toString('base64')
    void pub
    const snapshot = { entities: { Story: [story('a', { breaking_detected_at: new Date().toISOString() })] } }
    const notified = await sendAlerts(snapshot, { log: () => {}, appUrl: 'https://x.github.io/R/', send: async (s, p) => sent.push(JSON.parse(p)) })
    assert.deepEqual(notified, ['a'])
    assert.equal(sent[0].url, 'https://x.github.io/R/story/a')
    assert.match(sent[0].title, /^Última hora · Titular a/)
    const again = await sendAlerts(snapshot, { previousNotified: notified, log: () => {}, send: async () => assert.fail('no debe repetirse') })
    assert.deepEqual(again, ['a'])
  } finally {
    Date.now = realNow
    delete process.env.RENIVYA_AVISOS
  }
})

test('resumen semanal: historias de la semana, de la edición y en el idioma, con portada e índice enlazado', async () => {
  const { weeklyStories, buildHtml } = await import('../scripts/weekly-digest.mjs')
  const s = (id, extra) => ({ id, title: `T${id}`, summary: 'S.', status: 'active', content_language: 'es', source_countries: ['ES'], countries: ['ES'], first_detected_at: '2026-11-16T09:00:00Z', renivya_score: 50, category: 'economy', sources: [{ name: 'El País', url: `https://elpais.com/${id}` }], ...extra })
  const stories = [s(1, { renivya_score: 90 }), s(2), s(3), s(4), s(5), s(6, { source_countries: ['US'], countries: ['US'] }), s(7, { first_detected_at: '2026-10-01T00:00:00Z' })]
  const week = weeklyStories(stories, { edition: 'ES', locale: 'es', now: NOW })
  assert.deepEqual(week.map((x) => x.id), [1, 2, 3, 4, 5])
  const html = buildHtml(week, { now: NOW })
  assert.match(html, /class="title">Renivya</)
  assert.match(html, /href="#sec-economy"/)
  assert.match(html, /href="https:\/\/elpais\.com\/1"/)
})
