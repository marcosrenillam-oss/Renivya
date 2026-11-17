// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Diagnóstico: agrupa los artículos de demostración y mide la pureza frente a los sucesos esperados
// (el suceso esperado va en la ruta de la URL de demo). No escribe en la base de datos.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63'
import { demoNewsItems } from '../../shared/news/mock.ts'
import { normalizeNewsItem } from '../../shared/news/normalizer.ts'
import { extractEntities } from '../../shared/news/entities.ts'
import { createLocalEmbeddingProvider } from '../../shared/news/embeddingProvider.ts'
import { clusterDocuments } from '../../shared/news/clustering.ts'
import { json, requireAdminOrCron } from '../../shared/news/http.ts'

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req)
    const auth = await requireAdminOrCron(base44, req)
    if (!auth.ok) return auth.response
    const items = [...demoNewsItems(1), ...demoNewsItems(2)]
    const provider = createLocalEmbeddingProvider()
    const docs = items.map((it) => {
      const n = normalizeNewsItem(it)
      const ents = extractEntities({ title: n.title, text: n.cleaned_content }).slice(0, 12)
      return { ...n, published_at: it.published_at, entities: new Set(ents.map((e) => e.normalized_name)), expected: new URL(it.url).pathname.split('/')[1] }
    })
    const vectors = await provider.embed(docs.map((d) => ({ title: d.title, text: d.cleaned_content, entities: [...d.entities] })))
    docs.forEach((d, i) => (d.embedding = vectors[i]))
    const clusters = clusterDocuments(docs)
    const expectedEvents = new Set(docs.map((d) => d.expected))
    const pure = clusters.filter((c) => new Set(c.map((i) => docs[i].expected)).size === 1).length
    return json({
      ok: true,
      clusters: clusters.length,
      expected: expectedEvents.size,
      purity: Math.round((pure / clusters.length) * 100),
      passed: clusters.length === expectedEvents.size && pure === clusters.length,
      groups: clusters.map((c) => c.map((i) => ({ expected: docs[i].expected, title: docs[i].title }))),
    })
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 500)
  }
})
