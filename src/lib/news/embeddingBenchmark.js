/**
 * Banco de pruebas de embeddings: pares del mismo suceso en idiomas distintos deben
 * quedar más cerca que sucesos diferentes (identidad semántica multilingüe).
 */
import { localEmbedding } from '../../../engine/embeddingProvider.js'
import { cosine } from '../../../engine/semantic.js'

const PAIRS = [
  ['Inundaciones en Kenia dejan 12 muertos y miles de desplazados', 'Floods in Kenya kill 12 and displace thousands'],
  ['Un terremoto de magnitud 6,1 sacude el sur de Chile', 'Magnitude 6.1 earthquake strikes southern Chile'],
  ['Lumen Labs lanza un modelo de inteligencia artificial abierto', 'Lumen Labs dévoile un modèle d’intelligence artificielle ouvert'],
  ['El banco central sube los tipos de interés', 'O banco central sobe as taxas de juro'],
]

export function runEmbeddingBenchmark() {
  const vec = PAIRS.map(([a, b]) => [localEmbedding({ title: a }), localEmbedding({ title: b })])
  return PAIRS.map(([a, b], i) => {
    const same = cosine(vec[i][0], vec[i][1])
    const others = vec.filter((_, j) => j !== i).map((v) => cosine(vec[i][0], v[1]))
    const hardest = Math.max(...others)
    return { name: `${a} ↔ ${b}`, ok: same > hardest, same: Math.round(same * 100) / 100, hardest: Math.round(hardest * 100) / 100 }
  })
}
