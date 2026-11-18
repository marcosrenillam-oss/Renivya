import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cleanText, decodeEntities, fixMojibake } from '../engine/normalizer.js'
import { parseFeed } from '../engine/rss.js'
import { decodeBody } from '../engine/realIngestion.js'

test('entidades: tildes, eñes, dobles y numéricas', () => {
  assert.equal(decodeEntities('Espa&ntilde;a aprob&oacute; el 3&ordm; &laquo;plan&raquo; &amp;eacute; &#8220;ya&#8221;'), 'España aprobó el 3º «plan» é “ya”')
})

test('codificación rota (UTF-8 leído como Latin-1) se repara; texto sano no se toca', () => {
  assert.equal(fixMojibake('EspaÃ±a gana el tÃ­tulo â€œhoyâ€\u009d'), 'España gana el título “hoy”')
  assert.equal(fixMojibake('Texto sano: niño “hoy”'), 'Texto sano: niño “hoy”')
})

test('coletillas de los feeds fuera', () => {
  assert.equal(cleanText('<p>Llueve en Madrid.</p> The post Llueve appeared first on Diario X.'), 'Llueve en Madrid.')
  assert.equal(cleanText('Sube el paro en octubre [&#8230;]'), 'Sube el paro en octubre')
  assert.equal(cleanText('El Gobierno aprueba la ley. Seguir leyendo'), 'El Gobierno aprueba la ley.')
})

test('feed en ISO-8859-1 se lee con su codificación', async () => {
  const xml = '<?xml version="1.0" encoding="ISO-8859-1"?><rss><channel><item><title>Espa\xf1a y Le\xf3n</title><link>https://a.es/1</link></item></channel></rss>'
  const items = parseFeed(await decodeBody(new Response(Uint8Array.from(xml, (c) => c.charCodeAt(0)))))
  assert.equal(items[0].title, 'España y León')
})
