// Informe de agrupación para el registro de la publicación: cuántas historias juntan varios
// periódicos y qué pares de titulares quedaron justo por debajo del umbral (para ajustarlo).
import { readFileSync } from 'node:fs'
import { DEFAULT_THRESHOLD, keysOf, similarity } from '../engine/clustering.js'
import { localEmbedding } from '../engine/embeddingProvider.js'
import { normalizeEntityName } from '../engine/entities.js'
import { leadOf } from '../engine/pipeline.js'

const snap = JSON.parse(readFileSync(process.argv[2] || 'public/data/snapshot.json', 'utf8'))
const items = (snap.entities?.NewsItem || []).filter((i) => i.story_id && i.status === 'created')
const per = new Map()
for (const i of items) per.set(i.story_id, (per.get(i.story_id) || 0) + 1)
const sizes = [...per.values()]
const hist = { 1: 0, 2: 0, 3: 0, '4+': 0 }
for (const n of sizes) hist[n >= 4 ? '4+' : n]++
console.log(`[agrupación] artículos ${items.length} · historias ${sizes.length} · por tamaño ${JSON.stringify(hist)}`)

const recent = items.sort((a, b) => String(b.published_at).localeCompare(String(a.published_at))).slice(0, 700)
const docs = recent.map((i) => {
  const lead = leadOf(i.cleaned_content || '')
  const ents = i.detected_entities || []
  return {
    i,
    embedding: localEmbedding({ title: i.title, text: lead, entities: ents }),
    entities: new Set(ents.map(normalizeEntityName)),
    keys: keysOf(`${i.title} ${lead}`),
    published_at: i.published_at,
  }
})
const near = []
for (let a = 0; a < docs.length; a++)
  for (let b = a + 1; b < docs.length; b++) {
    const A = docs[a]
    const B = docs[b]
    if (A.i.story_id === B.i.story_id || A.i.source_name === B.i.source_name) continue
    const s = similarity(A, B)
    if (s >= DEFAULT_THRESHOLD - 0.12) near.push([s, A.i, B.i])
  }
near.sort((x, y) => y[0] - x[0])
console.log(`[agrupación] pares de periódicos distintos en historias distintas con similitud ≥ ${(DEFAULT_THRESHOLD - 0.12).toFixed(2)}: ${near.length}`)
for (const [s, a, b] of near.slice(0, 30)) console.log(`  ${s.toFixed(3)} | ${a.source_name}: ${a.title}  <>  ${b.source_name}: ${b.title}`)

// Detalle de los primeros pares: por qué no se juntaron (estado, fechas, tanda).
const storyById = new Map((snap.entities?.Story || []).map((x) => [x.id, x]))
const info = (i) => {
  const st = storyById.get(i.story_id)
  return `pub ${i.published_at} · proc ${i.processed_at} · tanda ${i.ingestion_batch || i.batch_id || '-'} · historia ${i.story_id?.slice(0, 6)} [${st?.status ?? 'NO EXISTE'} · ${per.get(i.story_id)} art · creada ${st?.created_date} · act ${st?.updated_date}]`
}
for (const [s, a, b] of near.slice(0, 4)) {
  console.log(`  · ${s.toFixed(3)}\n      A ${info(a)}\n      B ${info(b)}`)
}
console.log('[agrupación] estados de historia:', JSON.stringify((snap.entities?.Story || []).reduce((acc, x) => ((acc[x.status] = (acc[x.status] || 0) + 1), acc), {})))
