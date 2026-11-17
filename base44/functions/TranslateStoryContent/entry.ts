// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Traducción bajo demanda (solo desde el detalle). Lee Story.translations[locale]; el LLM solo se
// invoca si falta. Nunca sobrescribe el original ni cambia la versión de la Story.
// Body: { story_id, locale }
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.63'
import { createAIProvider } from '../../shared/news/aiProvider.ts'
import { json, readBody, requireUser } from '../../shared/news/http.ts'

const LOCALES = new Set(['es', 'en', 'fr', 'pt', 'de', 'it'])
const PENDING_TTL_MS = 2 * 60 * 1000

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req)
    const auth = await requireUser(base44)
    if (!auth.ok) return auth.response
    const { story_id, locale } = await readBody(req)
    if (!story_id || !LOCALES.has(locale)) return json({ error: 'invalid_params' }, 400)

    const Story = base44.asServiceRole.entities.Story
    const story = await Story.get(story_id)
    const source = story.editorial_locale || 'es'
    if (locale === source) return json({ ok: true, cached: true, translation: null })

    const existing = story.translations?.[locale]
    if (existing?.status === 'ready') return json({ ok: true, cached: true, translation: existing })
    if (existing?.status === 'pending' && Date.now() - new Date(existing.translated_at || 0).getTime() < PENDING_TTL_MS) {
      return json({ ok: true, pending: true }, 202) // otra petición la está generando: no gastar créditos dos veces
    }

    const now = new Date().toISOString()
    await Story.update(story_id, { translations: { ...(story.translations || {}), [locale]: { status: 'pending', translated_at: now, source_locale: source } } })

    const ai = createAIProvider({ invokeLLM: (params) => base44.asServiceRole.integrations.Core.InvokeLLM(params) })
    try {
      const translated = await ai.translateStory(story, locale)
      const entry = { ...translated, translated_at: new Date().toISOString(), source_locale: source, status: 'ready' }
      const fresh = await Story.get(story_id)
      await Story.update(story_id, { translations: { ...(fresh.translations || {}), [locale]: entry } })
      return json({ ok: true, cached: false, translation: entry })
    } catch (error) {
      const fresh = await Story.get(story_id)
      await Story.update(story_id, { translations: { ...(fresh.translations || {}), [locale]: { status: 'rejected', translated_at: new Date().toISOString(), source_locale: source } } })
      return json({ ok: false, error: String(error?.message || error) }, 502)
    }
  } catch (error) {
    return json({ ok: false, error: String(error?.message || error) }, 500)
  }
})
