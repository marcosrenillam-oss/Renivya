// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Workflow "Ingesta de noticias": feeds RSS activos → NewsItem(pending) → pipeline → mantenimiento.
// Body opcional: { installSources: true } para dar de alta el catálogo inicial de fuentes reales.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63'
import { createDataAdapter, ensureSources, runIngestionCycle } from '../../shared/news/brain.ts'
import { createRealNewsProvider } from '../../shared/news/realIngestion.ts'
import { createRemoteEmbeddingProvider } from '../../shared/news/embeddingProvider.ts'
import { REAL_SOURCES } from '../../shared/news/sourceCatalog.ts'
import { embeddingApiKey, json, readBody, requireAdminOrCron } from '../../shared/news/http.ts'

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req)
    const auth = await requireAdminOrCron(base44, req)
    if (!auth.ok) return auth.response
    const body = await readBody(req)
    const db = createDataAdapter(base44.asServiceRole.entities)
    if (body.installSources) await ensureSources(db, REAL_SOURCES)
    const report = await runIngestionCycle(db, {
      provider: createRealNewsProvider(),
      embeddingProvider: createRemoteEmbeddingProvider({ apiKey: embeddingApiKey() }),
      maxSources: Number(body.maxSources) || 30,
    })
    return json({ ok: true, via: auth.via, report })
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 500)
  }
})
