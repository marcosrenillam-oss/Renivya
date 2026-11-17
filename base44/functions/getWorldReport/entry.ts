// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Informe mundial agregado por país y región (misma lógica que la vista Mundo).
// Body/query: { category?, demo? }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63'
import { buildWorldReport } from '../../shared/news/world.ts'
import { json, readBody, requireUser } from '../../shared/news/http.ts'

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req)
    const auth = await requireUser(base44)
    if (!auth.ok) return auth.response
    const body = await readBody(req)
    const query = { status: { $ne: 'archived' } }
    if (body.category) query.category = body.category
    if (body.demo === false || body.demo === 'false') query.is_demo = false
    const stories = await base44.entities.Story.filter(query, '-renivya_score', 400)
    const slim = stories.map(({ id, title, category, countries, renivya_score, status, is_breaking, updated_date, published_at }) => ({ id, title, category, countries, renivya_score, status, is_breaking, updated_date, published_at }))
    return json({ ok: true, report: buildWorldReport(slim), generated_at: new Date().toISOString() })
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 500)
  }
})
