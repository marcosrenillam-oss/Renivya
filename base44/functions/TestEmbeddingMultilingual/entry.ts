// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Diagnóstico: el mismo suceso en idiomas distintos debe quedar más cerca que sucesos diferentes.
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63'
import { createLocalEmbeddingProvider, createRemoteEmbeddingProvider } from '../../shared/news/embeddingProvider.ts'
import { cosine } from '../../shared/news/semantic.ts'
import { embeddingApiKey, json, requireAdminOrCron } from '../../shared/news/http.ts'

const PAIRS = [
  ['Inundaciones en Kenia dejan 12 muertos y miles de desplazados', 'Floods in Kenya kill 12 and displace thousands'],
  ['Un terremoto de magnitud 6,1 sacude el sur de Chile', 'Magnitude 6.1 earthquake strikes southern Chile'],
  ['Lumen Labs lanza un modelo de inteligencia artificial abierto', "Lumen Labs dévoile un modèle d'intelligence artificielle ouvert"],
  ['El banco central sube los tipos de interés', 'O banco central sobe as taxas de juro'],
]

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req)
    const auth = await requireAdminOrCron(base44, req)
    if (!auth.ok) return auth.response
    const providers = [createLocalEmbeddingProvider(), createRemoteEmbeddingProvider({ apiKey: embeddingApiKey() })].filter(Boolean)
    const results = []
    for (const p of providers) {
      const docs = PAIRS.flatMap(([a, b]) => [{ title: a, text: '' }, { title: b, text: '' }])
      const v = await p.embed(docs)
      const rows = PAIRS.map((pair, i) => {
        const same = cosine(v[2 * i], v[2 * i + 1])
        const hardest = Math.max(...PAIRS.map((_, j) => (j === i ? -1 : cosine(v[2 * i], v[2 * j + 1]))))
        return { pair, same: Math.round(same * 100) / 100, hardest: Math.round(hardest * 100) / 100, ok: same > hardest }
      })
      results.push({ model: p.model, passed: rows.every((r) => r.ok), rows })
    }
    return json({ ok: true, results })
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 500)
  }
})
