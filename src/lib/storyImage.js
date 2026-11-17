/**
 * Selección de imagen de una Story para la interfaz.
 * Prioridad: Media primaria activa → Story.image_url → null.
 * Nunca se inventa crédito: solo `credit`/`author`/`source_name` reales.
 */

export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/** Crédito visible: crédito editorial > autor > fuente. null si no hay nada. */
export function getMediaCredit(media) {
  if (!media) return null
  return media.credit || media.author || media.source_name || null
}

export function getStoryImage(story, mediaList = []) {
  const primary = mediaList.find((m) => m?.is_primary && m?.status !== 'unavailable' && m?.status !== 'rejected' && isValidImageUrl(m.url))
  if (primary) {
    return {
      url: primary.url,
      alt: primary.alt_text || story?.title || '',
      credit: getMediaCredit(primary),
      sourceName: primary.source_name ?? null,
      sourceUrl: primary.source_article_url ?? null,
    }
  }
  if (isValidImageUrl(story?.image_url)) {
    return { url: story.image_url, alt: story?.title || '', credit: null, sourceName: null, sourceUrl: null }
  }
  return null
}
