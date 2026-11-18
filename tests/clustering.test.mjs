import { test } from 'node:test'
import assert from 'node:assert/strict'
import { keysOf, similarity, DEFAULT_THRESHOLD } from '../engine/clustering.js'
import { localEmbedding } from '../engine/embeddingProvider.js'
import { extractEntities } from '../engine/entities.js'

const doc = (title, text, h = 0) => {
  const ents = extractEntities({ title, text }).slice(0, 12)
  return {
    embedding: localEmbedding({ title, text, entities: ents.map((e) => e.name) }),
    entities: new Set(ents.map((e) => e.normalized_name)),
    published_at: new Date(Date.UTC(2026, 10, 18, 9 + h)).toISOString(),
    keys: keysOf(`${title} ${text}`),
  }
}

test('keysOf: nombres y cifras sin palabras vacías', () => {
  const k = keysOf('Los blancos ganan 2-1 al Barça; el BCE baja los tipos al 2 %')
  assert.ok(k.has('2-1') && k.has('2%') && k.has('barcelona') && k.has('bce'))
  assert.ok(!k.has('los'))
})

test('mismo suceso contado por dos periódicos se agrupa; sucesos distintos no', () => {
  const a = doc('Un terremoto de magnitud 6,8 sacude Japón y activa la alerta de tsunami', 'Un fuerte sismo de magnitud 6,8 sacudió este miércoles la costa noreste de Japón, según la Agencia Meteorológica japonesa, que activó la alerta de tsunami.')
  const b = doc('Fuerte seísmo en el noreste de Japón: alerta por posible tsunami', 'La Agencia Meteorológica de Japón emitió una alerta de tsunami después de que un terremoto de 6,8 grados golpeara la región de Tohoku.', 1)
  const c = doc('El BCE baja los tipos de interés al 2%', 'El Banco Central Europeo ha recortado este jueves los tipos de interés en un cuarto de punto, hasta el 2%, ante la moderación de la inflación en la eurozona.')
  assert.ok(similarity(a, b) > DEFAULT_THRESHOLD)
  assert.ok(similarity(a, c) < DEFAULT_THRESHOLD)
})

test('dos grupos abiertos para el mismo suceso se unen al final', async () => {
  const { clusterDocuments } = await import('../engine/clustering.js')
  const at = (deg, h) => ({ embedding: [Math.cos((deg * Math.PI) / 180), Math.sin((deg * Math.PI) / 180)], entities: new Set(), published_at: new Date(Date.UTC(2026, 10, 18, h)).toISOString() })
  // a y b llegan primero y no se parecen lo bastante; c (entre ambos) los une.
  const groups = clusterDocuments([at(0, 1), at(63.3, 2), at(31.7, 3), at(170, 4)])
  assert.equal(groups.length, 2)
  assert.deepEqual(groups.find((g) => g.includes(0)).sort(), [0, 1, 2])
})
