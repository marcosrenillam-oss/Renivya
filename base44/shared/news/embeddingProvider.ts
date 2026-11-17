// Embeddings con caché por content_hash. Proveedor local determinista + proveedor remoto opcional.
import { hash32 } from './stats.ts'
import { extractConcepts, lightStem, tokenize } from './semantic.ts'

export const LOCAL_MODEL = 'renivya-hash-v1'
export const LOCAL_DIMENSIONS = 384

function l2normalize(vec) {
  let n = 0
  for (const x of vec) n += x * x
  n = Math.sqrt(n) || 1
  return vec.map((x) => Math.round((x / n) * 1e6) / 1e6)
}

/**
 * Embedding local por "hashing trick": conceptos multilingües (peso 3),
 * entidades (peso 3), raíces (peso 1) y bigramas (0.5). Sin red, sin coste.
 */
export function localEmbedding({ title = '', text = '', entities = [] }, dims = LOCAL_DIMENSIONS) {
  const vec = new Array(dims).fill(0)
  const add = (feature, weight) => {
    const h = hash32(feature)
    const idx = h % dims
    const sign = (h >>> 31) & 1 ? -1 : 1
    vec[idx] += sign * weight
  }
  const full = `${title}\n${title}\n${text}`
  for (const c of extractConcepts(full)) add(`c:${c}`, 3)
  for (const e of entities) add(`e:${String(e).toLowerCase()}`, 3)
  const toks = tokenize(full).slice(0, 600).map(lightStem)
  toks.forEach((t, i) => {
    add(`t:${t}`, 1)
    if (i > 0) add(`b:${toks[i - 1]}_${t}`, 0.5)
  })
  return l2normalize(vec)
}

export function createLocalEmbeddingProvider() {
  return {
    model: LOCAL_MODEL,
    dimensions: LOCAL_DIMENSIONS,
    async embed(docs) {
      return docs.map((d) => localEmbedding(d))
    },
  }
}

/**
 * Proveedor remoto compatible con la API de embeddings de OpenAI.
 * Solo backend (clave en variable de entorno). Si falla, el pipeline cae al local.
 */
export function createRemoteEmbeddingProvider({ apiKey, model = 'text-embedding-3-small', endpoint = 'https://api.openai.com/v1/embeddings', fetchImpl = fetch } = {}) {
  if (!apiKey) return null
  return {
    model,
    dimensions: null,
    async embed(docs) {
      const input = docs.map((d) => `${d.title}\n${d.text}`.slice(0, 8000))
      const res = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, input }),
      })
      if (!res.ok) throw new Error(`embeddings HTTP ${res.status}`)
      const json = await res.json()
      return json.data.map((d) => d.embedding)
    },
  }
}

/**
 * Obtiene embeddings usando la caché ArticleEmbedding (clave: content_hash + model).
 * `docs`: [{ content_hash, title, text, entities, source_name, url, language }]
 */
export async function getEmbeddings(docs, { provider, cache, isDemo = false, fallback = createLocalEmbeddingProvider() } = {}) {
  const active = provider || fallback
  const result = new Map()
  let cached = []
  if (cache && docs.length) {
    const hashes = [...new Set(docs.map((d) => d.content_hash))]
    cached = await cache.filter({ content_hash: { $in: hashes }, model: active.model }, undefined, hashes.length)
    for (const row of cached) result.set(row.content_hash, row.embedding)
  }
  const missing = docs.filter((d) => !result.has(d.content_hash))
  const unique = [...new Map(missing.map((d) => [d.content_hash, d])).values()]
  const usedModel = active.model
  if (unique.length) {
    let vectors
    try {
      vectors = await active.embed(unique)
    } catch (error) {
      // Nunca mezclar modelos en un mismo lote: se recalcula TODO con el proveedor local.
      if (active === fallback) throw error
      return getEmbeddings(docs, { provider: fallback, cache, isDemo, fallback })
    }
    unique.forEach((d, i) => result.set(d.content_hash, vectors[i]))
    if (cache) {
      await cache.bulkCreate(
        unique.map((d, i) => ({
          content_hash: d.content_hash,
          model: usedModel,
          dimensions: vectors[i].length,
          embedding: vectors[i],
          source_name: d.source_name ?? null,
          url: d.url ?? null,
          language: d.language ?? null,
          is_demo: isDemo,
        }))
      )
    }
  }
  return { vectors: docs.map((d) => result.get(d.content_hash)), model: usedModel, cachedCount: cached.length }
}
