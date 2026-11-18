/**
 * Lectura de una Story en un idioma (ver engine/translation.js). Las listas deben filtrar
 * antes con storyInLocale(): una historia sin versión completa en el idioma no se muestra.
 */
import { contentLanguage, storyInLocale } from '../../../engine/translation.js'

export { storyInLocale }

export function getOriginalLocale(story) {
  return contentLanguage(story)
}

export function getStoryInLocale(story, locale) {
  const localized = storyInLocale(story, locale)
  return { story: localized ?? story, locale, isTranslated: Boolean(localized?.is_translated), needsTranslation: !localized }
}
