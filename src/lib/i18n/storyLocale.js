import { base44 } from '@/api/base44Client'

/**
 * Lectura de una Story en un idioma.
 *
 * Regla: la traducción se LEE de Story.translations[locale]. Solo si falta se
 * invoca el LLM (función backend TranslateStoryContent), y NUNCA desde el feed:
 * `getStoryInLocale` es puro y no dispara llamadas; `requestStoryTranslation`
 * solo debe usarse en vistas de detalle por acción explícita.
 */

const TRANSLATABLE_FIELDS = ['summary', 'body', 'key_points', 'why_it_matters', 'context', 'timeline', 'keywords', 'contrast']

export function getOriginalLocale(story) {
  return story?.editorial_locale || 'es'
}

/** Devuelve la traducción lista para `locale`, o null si no existe o no está lista. */
export function getReadyTranslation(story, locale) {
  const tr = story?.translations?.[locale]
  if (!tr) return null
  if (tr.status && tr.status !== 'ready') return null
  return tr
}

/**
 * Story fusionada con su traducción (si existe). Nunca modifica el original.
 * Devuelve { story, locale, isTranslated, needsTranslation }.
 */
export function getStoryInLocale(story, locale) {
  if (!story) return { story: null, locale, isTranslated: false, needsTranslation: false }
  const original = getOriginalLocale(story)
  if (!locale || locale === original) {
    return { story, locale: original, isTranslated: false, needsTranslation: false }
  }
  const tr = getReadyTranslation(story, locale)
  if (!tr) {
    return { story, locale: original, isTranslated: false, needsTranslation: true }
  }
  const merged = { ...story }
  if (tr.headline) merged.title = tr.headline
  TRANSLATABLE_FIELDS.forEach((field) => {
    const value = tr[field]
    const present = Array.isArray(value) ? value.length > 0 : value != null && value !== ''
    if (present) merged[field] = value
  })
  return { story: merged, locale, isTranslated: true, needsTranslation: false }
}

/** Solo para el DETALLE. Pide la traducción al backend (consume créditos). */
export async function requestStoryTranslation(storyId, locale) {
  if (!storyId || !locale) throw new Error('storyId y locale son obligatorios')
  return base44.functions.invoke('TranslateStoryContent', { story_id: storyId, locale })
}
