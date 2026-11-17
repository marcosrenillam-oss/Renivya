// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Workflow "Limpieza de noticias": purga > 30 días (Stories no guardadas por nadie, sus relaciones,
// NewsItems y caché de embeddings caducada). Body: { days?: number }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63'
import { cleanOldStories, createDataAdapter, maintainStories } from '../../shared/news/brain.ts'
import { json, readBody, requireAdminOrCron } from '../../shared/news/http.ts'

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req)
    const auth = await requireAdminOrCron(base44, req)
    if (!auth.ok) return auth.response
    const body = await readBody(req)
    const days = Math.max(7, Number(body.days) || 30)
    const service = base44.asServiceRole.entities
    const db = createDataAdapter(service)
    const saved = []
    for (let skip = 0; skip < 20000; skip += 500) {
      const page = await service.SavedStory.list('created_date', 500, skip)
      saved.push(...page)
      if (page.length < 500) break
    }
    const maintenance = await maintainStories(db, { isDemo: false })
    const report = await cleanOldStories(db, { days, savedStoryIds: new Set(saved.map((s) => s.story_id)) })
    return json({ ok: true, maintenance, report })
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 500)
  }
})
