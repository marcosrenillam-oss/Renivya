// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Precalcula embeddings (caché ArticleEmbedding por content_hash) de artículos ya normalizados.
// Body: { limit?: number }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63'
import { createDataAdapter } from '../../shared/news/brain.ts'
import { createRemoteEmbeddingProvider, getEmbeddings } from '../../shared/news/embeddingProvider.ts'
import { normalizeNewsItem } from '../../shared/news/normalizer.ts'
import { embeddingApiKey, json, readBody, requireAdminOrCron } from '../../shared/news/http.ts'

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req)
    const auth = await requireAdminOrCron(base44, req)
    if (!auth.ok) return auth.response
    const body = await readBody(req)
    const db = createDataAdapter(base44.asServiceRole.entities)
    const items = await db.NewsItem.filter({ status: { $in: ['normalized', 'created'] } }, '-processed_at', Math.min(500, Number(body.limit) || 200))
    const docs = items.map((it) => {
      const n = normalizeNewsItem({ ...it, content: it.cleaned_content, description: '' })
      return { content_hash: n.content_hash, title: n.title, text: n.cleaned_content, entities: it.detected_entities || [], source_name: it.source_name, url: it.url, language: n.normalized_language }
    })
    const { model, cachedCount } = await getEmbeddings(docs, { provider: createRemoteEmbeddingProvider({ apiKey: embeddingApiKey() }), cache: db.ArticleEmbedding })
    return json({ ok: true, model, items: docs.length, cached: cachedCount, computed: docs.length - cachedCount })
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 500)
  }
})
