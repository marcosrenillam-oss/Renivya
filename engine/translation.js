// Traducción de historias (es/en). Este módulo es puro: prepara qué traducir y aplica el
// resultado. La llamada al modelo vive en scripts/translate-stories.mjs (solo en GitHub Actions).
// Regla: una historia se muestra en un idioma SOLO si su texto está entero en ese idioma
// (original o traducción completa). Nunca se mezclan idiomas en una misma pantalla.

export const APP_LOCALES = ['es', 'en']

/** Idioma en que está escrito el texto de la historia. */
export function contentLanguage(story) {
  return story?.content_language || story?.editorial_locale || 'es'
}

/** Texto traducible de la historia, en su idioma original. */
export function translationPayload(story) {
  const c = story.contrast || {}
  return {
    title: story.title || '',
    summary: story.summary || '',
    body: story.body || [],
    key_points: story.key_points || [],
    known_facts: (story.known_facts || []).map((f) => f.text),
    timeline: (story.timeline || []).map((t) => t.event),
    context: story.context || '',
    coincidencias: c.coincidencias || [],
    diferencias: c.diferencias || [],
    ausencias: c.ausencias || [],
    unconfirmed: c.unconfirmed || [],
    primary_source: c.primary_source?.description || '',
  }
}

const LIST_FIELDS = ['body', 'key_points', 'known_facts', 'timeline', 'coincidencias', 'diferencias', 'ausencias', 'unconfirmed']

/** ¿Hace falta (re)traducir la historia a `locale`? */
export function needsTranslation(story, locale) {
  if (contentLanguage(story) === locale) return false
  const tr = story.translations?.[locale]
  return !tr || tr.status !== 'ready' || (tr.version || 0) < (story.version || 1)
}

/**
 * Valida el resultado del modelo contra el original (mismas listas, mismo número de elementos,
 * nada vacío donde el original tenía texto). Devuelve la traducción lista o null.
 */
export function buildTranslation(story, locale, result, meta = {}) {
  const src = translationPayload(story)
  if (!result || typeof result !== 'object') return null
  if (!String(result.title || '').trim() || (src.summary && !String(result.summary || '').trim())) return null
  for (const f of LIST_FIELDS) {
    const a = src[f]
    const b = result[f]
    if (!Array.isArray(b) || b.length !== a.length || b.some((x, i) => a[i] && !String(x || '').trim())) return null
  }
  return {
    status: 'ready',
    locale,
    version: story.version || 1,
    from: contentLanguage(story),
    model: meta.model ?? null,
    translated_at: meta.at ?? new Date().toISOString(),
    title: result.title.trim(),
    summary: String(result.summary || '').trim(),
    body: result.body,
    key_points: result.key_points,
    known_facts: result.known_facts,
    timeline: result.timeline,
    context: String(result.context || '').trim() || null,
    contrast: {
      coincidencias: result.coincidencias,
      diferencias: result.diferencias,
      ausencias: result.ausencias,
      unconfirmed: result.unconfirmed,
      primary_source: String(result.primary_source || '').trim() || null,
    },
  }
}

/**
 * Historia leída en `locale`, o null si no puede mostrarse entera en ese idioma.
 * Nunca rellena huecos con el texto original.
 */
export function storyInLocale(story, locale) {
  if (!story) return null
  const why = story.why_it_matters_i18n?.[locale] ?? null
  if (contentLanguage(story) === locale) {
    return { ...story, why_it_matters: why ?? story.why_it_matters, display_locale: locale, is_translated: false }
  }
  const tr = story.translations?.[locale]
  if (!tr || tr.status !== 'ready' || !tr.title) return null
  const facts = story.known_facts || []
  const timeline = story.timeline || []
  return {
    ...story,
    title: tr.title,
    summary: tr.summary,
    body: tr.body || [],
    key_points: tr.key_points || [],
    known_facts: (tr.known_facts || []).map((text, i) => ({ ...(facts[i] || {}), text })),
    timeline: (tr.timeline || []).map((event, i) => ({ ...(timeline[i] || {}), event })),
    context: tr.context,
    why_it_matters: why,
    contrast: {
      ...(story.contrast || {}),
      coincidencias: tr.contrast?.coincidencias || [],
      diferencias: tr.contrast?.diferencias || [],
      ausencias: tr.contrast?.ausencias || [],
      unconfirmed: tr.contrast?.unconfirmed || [],
      primary_source: { ...(story.contrast?.primary_source || {}), description: tr.contrast?.primary_source ?? null },
    },
    display_locale: locale,
    is_translated: true,
  }
}
