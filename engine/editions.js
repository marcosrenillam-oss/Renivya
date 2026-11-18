// Ediciones por país: qué historias pertenecen a la portada de cada país.

/** Una historia es de la edición X si la cuenta la prensa de X o si ocurre en X. */
export function storyInEdition(story, code) {
  if (!code || !story) return false
  return (story.source_countries || []).includes(code) || (story.countries || []).includes(code)
}

/** Países "de" una historia para la sección Mundo: dónde ocurre y quién la cuenta. */
export function storyCountries(story) {
  return [...new Set([...(story.countries || []), ...(story.source_countries || [])])]
}
