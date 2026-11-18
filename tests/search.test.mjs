import { test } from 'node:test'
import assert from 'node:assert/strict'
import { searchStoriesDetailed } from '../src/components/search/searchStories.js'

const stories = [
  { id: 'a', title: 'Zelensky pide más defensas aéreas a la OTAN', summary: 'Ucrania sufre nuevos ataques.', renivya_score: 60 },
  { id: 'b', title: 'Estados Unidos y Venezuela firman un acuerdo militar', summary: 'Hegseth viaja a Caracas.', renivya_score: 55 },
  { id: 'c', title: 'La inteligencia artificial llega a los colegios', summary: 'Nuevas normas de uso.', renivya_score: 40 },
  { id: 'd', title: 'El Barça gana en Múnich', summary: 'Victoria azulgrana en Champions.', renivya_score: 50 },
]
const ids = (q) => searchStoriesDetailed(stories, q).results.map((s) => s.id)

test('búsqueda: a medio escribir, sin acentos y con faltas', () => {
  assert.deepEqual(ids('ucra'), ['a'])
  assert.deepEqual(ids('zelenski'), ['a'])
  assert.deepEqual(ids('munich'), ['d'])
})

test('búsqueda: equivalencias (EE. UU., IA, Barça)', () => {
  assert.deepEqual(ids('eeuu venezuela'), ['b'])
  assert.deepEqual(ids('usa'), ['b'])
  assert.deepEqual(ids('IA colegios'), ['c'])
  assert.deepEqual(ids('barcelona'), ['d'])
})

test('búsqueda: sin todas las palabras, devuelve lo más parecido marcado como parcial', () => {
  const r = searchStoriesDetailed(stories, 'venezuela petróleo')
  assert.equal(r.partial, true)
  assert.deepEqual(r.results.map((s) => s.id), ['b'])
})
