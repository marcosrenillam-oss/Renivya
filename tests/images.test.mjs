import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanImageUrl, extractPageImage } from '../engine/images.js'
import { parseFeed } from '../engine/rss.js'
import { createLocalClient } from '../src/api/localClient.js'
import { createDataAdapter, enrichImages } from '../engine/brain.js'

test('URL de foto: absoluta, https, sin entidades y sin logos', () => {
  assert.equal(cleanImageUrl('http://cdn.x.com/a.jpg?w=1&amp;h=2'), 'https://cdn.x.com/a.jpg?w=1&h=2')
  assert.equal(cleanImageUrl('//cdn.x.com/a.jpg'), 'https://cdn.x.com/a.jpg')
  assert.equal(cleanImageUrl('/img/a.jpg', 'https://diario.es/noticia'), 'https://diario.es/img/a.jpg')
  assert.equal(cleanImageUrl('https://diario.es/static/logo.png'), null)
  assert.equal(cleanImageUrl('https://diario.es/v.mp4'), null)
})

test('foto de portada de la página (og:image, en cualquier orden de atributos)', () => {
  assert.equal(extractPageImage('<head><meta property="og:image" content="https://a.com/f.jpg"></head>', 'https://a.com/n'), 'https://a.com/f.jpg')
  assert.equal(extractPageImage('<meta content="/f2.jpg" name="twitter:image">', 'https://a.com/n'), 'https://a.com/f2.jpg')
  assert.equal(extractPageImage('<html><head><title>x</title></head></html>', 'https://a.com/n'), null)
})

test('RSS: media:group, media:content más ancha y enclosure sin type', () => {
  const xml = `<rss><channel>
    <item><title>A</title><link>https://n.com/a</link><media:group><media:content url="https://n.com/s.jpg" width="200" medium="image"/><media:content url="https://n.com/l.jpg" width="1200" medium="image"/></media:group></item>
    <item><title>B</title><link>https://n.com/b</link><enclosure url="http://n.com/b.jpeg" length="1"/></item>
  </channel></rss>`
  const [a, b] = parseFeed(xml)
  assert.equal(a.image_url, 'https://n.com/l.jpg')
  assert.equal(b.image_url, 'https://n.com/b.jpeg')
})

test('noticias sin foto en el feed: se busca la de su página una sola vez', async () => {
  const db = createDataAdapter(createLocalClient({ memoryOnly: true }).entities)
  await db.NewsItem.bulkCreate([
    { url: 'https://n.com/1', title: 'Uno', status: 'pending', is_demo: false, image_url: null, published_at: '2026-11-18T09:00:00Z' },
    { url: 'https://n.com/2', title: 'Dos', status: 'pending', is_demo: false, image_url: 'https://n.com/2.jpg', published_at: '2026-11-18T09:00:00Z' },
  ])
  let calls = 0
  const provider = { fetchArticleImage: async (url) => (calls++, `${url}.jpg`) }
  assert.deepEqual(await enrichImages(db, provider), { checked: 1, found: 1 })
  assert.deepEqual(await enrichImages(db, provider), { checked: 0, found: 0 })
  assert.equal(calls, 1)
  const [one] = await db.NewsItem.filter({ url: 'https://n.com/1' })
  assert.equal(one.image_url, 'https://n.com/1.jpg')
})
