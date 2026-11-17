// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Procesa los NewsItem pendientes (normalización → clustering → análisis → scoring → editorial → entidades → media → evolución).
// Body: { demo?: boolean, limit?: number }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63'
import { createDataAdapter, newBatchId } from '../../shared/news/brain.ts'
import { runPipeline } from '../../shared/news/pipeline.ts'
import { createRemoteEmbeddingProvider } from '../../shared/news/embeddingProvider.ts'
import { embeddingApiKey, json, readBody, requireAdminOrCron } from '../../shared/news/http.ts'

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req)
    const auth = await requireAdminOrCron(base44, req)
    if (!auth.ok) return auth.response
    const body = await readBody(req)
    const isDemo = body.demo === true || body.demo === 'true'
    const stats = await runPipeline(createDataAdapter(base44.asServiceRole.entities), {
      isDemo,
      batchId: isDemo ? null : newBatchId(),
      embeddingProvider: createRemoteEmbeddingProvider({ apiKey: embeddingApiKey() }),
      limit: Math.min(500, Number(body.limit) || 200),
    })
    return json({ ok: true, stats })
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 500)
  }
})
