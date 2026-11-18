// Traduce historias al español y al inglés con la API de Claude (solo en GitHub Actions).
// Necesita el secreto ANTHROPIC_API_KEY; sin él no hace nada y la app muestra cada historia
// solo en el idioma en que está escrita (nunca mezcla idiomas).
//
// Variables (opcionales, en Settings › Secrets and variables › Actions › Variables):
//   TRANSLATE_MODEL  modelo (por defecto claude-opus-5-5)
//   TRANSLATE_MAX    traducciones como máximo por ejecución (por defecto 30)
import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { z } from 'zod'
import { APP_LOCALES, buildTranslation, contentLanguage, needsTranslation, translationPayload } from '../engine/translation.js'

const LANGUAGE_NAME = { es: 'Spanish (Spain)', en: 'English' }

const Result = z.object({
  title: z.string(),
  summary: z.string(),
  body: z.array(z.string()),
  key_points: z.array(z.string()),
  known_facts: z.array(z.string()),
  timeline: z.array(z.string()),
  context: z.string(),
  coincidencias: z.array(z.string()),
  diferencias: z.array(z.string()),
  ausencias: z.array(z.string()),
  unconfirmed: z.array(z.string()),
  primary_source: z.string(),
})

function systemPrompt(locale) {
  const lang = LANGUAGE_NAME[locale]
  return [
    `You translate news stories for RENIVYA, a news app, into ${lang}.`,
    `Write natural, well-edited ${lang} newspaper prose, as a professional editor at a quality paper would. The reader must never notice it was translated.`,
    'Translate faithfully: keep every fact, number, date, name and quotation; add nothing, remove nothing, and add no opinion.',
    'Keep the names of media outlets, people and organisations as they are; use the usual target-language name for countries and cities.',
    'The title is a newspaper headline: concise, informative, no clickbait, no final full stop.',
    'Every list in the output must have exactly the same number of items, in the same order, as the matching list in the input. An empty input string stays an empty string.',
  ].join('\n')
}

async function translateOne(client, model, story, locale) {
  const response = await client.messages.parse({
    model,
    max_tokens: 8000,
    output_config: { effort: 'low', format: zodOutputFormat(Result) },
    system: systemPrompt(locale),
    messages: [
      {
        role: 'user',
        content: `Source language: ${contentLanguage(story)}. Translate into ${LANGUAGE_NAME[locale]}.\n\n${JSON.stringify(translationPayload(story))}`,
      },
    ],
  })
  if (response.stop_reason === 'refusal') return { skipped: 'refusal' }
  if (response.stop_reason === 'max_tokens') return { skipped: 'max_tokens' }
  const tr = buildTranslation(story, locale, response.parsed_output, { model: response.model, at: new Date().toISOString() })
  return tr ? { tr, usage: response.usage } : { skipped: 'invalid' }
}

/**
 * Traduce en el sitio (story.translations[locale]) las historias que lo necesitan, de más a
 * menos relevante, hasta el máximo por ejecución. Devuelve un resumen para el registro.
 */
export async function translateStories(stories, { log = console.log, client: injected = null } = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey && !injected) {
    log('traducción: sin ANTHROPIC_API_KEY, se omite')
    return { done: 0, pending: null }
  }
  const model = process.env.TRANSLATE_MODEL || 'claude-opus-5-5'
  const max = Number(process.env.TRANSLATE_MAX || 30)
  const client = injected || new Anthropic({ apiKey })

  // Primero el español (idioma principal de la app); dentro, por relevancia.
  const jobs = []
  for (const locale of APP_LOCALES) {
    const todo = stories
      .filter((s) => s.status !== 'archived' && !s.is_demo && needsTranslation(s, locale))
      .sort((a, b) => (b.renivya_score ?? 0) - (a.renivya_score ?? 0))
    for (const story of todo) jobs.push({ story, locale })
  }
  const batch = jobs.slice(0, max)
  let done = 0
  const skipped = {}
  let input = 0
  let output = 0
  let stop = false

  const worker = async () => {
    while (batch.length && !stop) {
      const { story, locale } = batch.shift()
      try {
        const r = await translateOne(client, model, story, locale)
        if (r.tr) {
          story.translations = { ...(story.translations || {}), [locale]: r.tr }
          done++
          input += r.usage?.input_tokens ?? 0
          output += r.usage?.output_tokens ?? 0
        } else skipped[r.skipped] = (skipped[r.skipped] || 0) + 1
      } catch (err) {
        if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
          log('traducción: la clave no es válida o no tiene permiso; se detiene')
          stop = true
        } else if (err instanceof Anthropic.RateLimitError) {
          log('traducción: límite de uso alcanzado; se sigue en la próxima ejecución')
          stop = true
        } else {
          skipped.error = (skipped.error || 0) + 1
          log('traducción: error', err?.status ?? '', err?.message ?? err)
        }
      }
    }
  }
  await Promise.all([worker(), worker(), worker(), worker()])
  log(`traducción (${model}): ${done} hechas · pendientes ${Math.max(0, jobs.length - done)} · tokens ${input} entrada / ${output} salida · omitidas ${JSON.stringify(skipped)}`)
  return { done, pending: jobs.length - done }
}
