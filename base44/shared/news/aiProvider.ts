// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Proveedor LLM (solo backend). Usos permitidos: traducción y, opcionalmente, sugerir categoría
// cuando el clasificador determinista no tiene señal. NUNCA calcula SCORE ni CONFIDENCE.

const TRANSLATABLE = ['headline', 'summary', 'body', 'key_points', 'why_it_matters', 'context', 'timeline', 'keywords']

const LANG_NAME = { es: 'español', en: 'English', fr: 'français', pt: 'português', de: 'Deutsch', it: 'italiano' }

/** `invokeLLM` = base44.asServiceRole.integrations.Core.InvokeLLM */
export function createAIProvider({ invokeLLM }) {
  if (typeof invokeLLM !== 'function') return null
  return {
    async translateStory(story, locale) {
      const original = {
        headline: story.title,
        summary: story.summary,
        body: story.body || [],
        key_points: story.key_points || [],
        why_it_matters: story.why_it_matters || '',
        context: story.context || '',
        timeline: story.timeline || [],
        keywords: story.keywords || [],
      }
      const prompt = [
        `Traduce al ${LANG_NAME[locale] || locale} este contenido periodístico en JSON.`,
        'Reglas: traducción fiel, sin añadir, quitar ni interpretar información; conserva cifras, nombres propios y fechas;',
        'no traduzcas nombres de medios ni de personas; devuelve exactamente las mismas claves.',
        JSON.stringify(original),
      ].join('\n')
      const result = await invokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            headline: { type: 'string' },
            summary: { type: 'string' },
            body: { type: 'array', items: { type: 'string' } },
            key_points: { type: 'array', items: { type: 'string' } },
            why_it_matters: { type: 'string' },
            context: { type: 'string' },
            timeline: { type: 'array', items: { type: 'object', properties: { date: { type: 'string' }, event: { type: 'string' } } } },
            keywords: { type: 'array', items: { type: 'string' } },
          },
          required: ['headline', 'summary'],
        },
      })
      const out = {}
      for (const k of TRANSLATABLE) if (result?.[k] != null) out[k] = result[k]
      // Las fechas de la cronología no se traducen: se conservan las originales.
      if (Array.isArray(out.timeline)) out.timeline = out.timeline.map((e, i) => ({ date: original.timeline[i]?.date ?? e.date, event: e.event }))
      return out
    },
  }
}
