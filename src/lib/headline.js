/**
 * Limpieza determinista de titulares (sin LLM).
 * Quita sufijos de medio ("… - El País", "… | Reuters"), prefijos de sección
 * ("EN DIRECTO:", "ÚLTIMA HORA |") y espacios/comillas sobrantes.
 */

const SECTION_PREFIXES = [
  'en directo', 'directo', 'última hora', 'ultima hora', 'breaking', 'live', 'exclusiva', 'exclusive',
  'opinión', 'opinion', 'vídeo', 'video', 'en vivo', 'urgente', 'actualización', 'update',
]

const PREFIX_RE = new RegExp(`^\\s*(?:${SECTION_PREFIXES.map((p) => p.replace(/\s/g, '\\s+')).join('|')})\\s*[:|\\-–—]\\s*`, 'i')
const SUFFIX_RE = /\s+[|\-–—]\s+[^|\-–—]{2,40}$/

export function cleanHeadline(raw, sourceNames = []) {
  if (!raw) return ''
  let title = String(raw).replace(/\s+/g, ' ').trim()
  title = title.replace(PREFIX_RE, '')

  // Sufijo con el nombre de una fuente conocida (prioritario y exacto).
  for (const name of sourceNames.filter(Boolean)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\s+[|\\-–—]\\s+${escaped}\\s*$`, 'i')
    if (re.test(title)) {
      title = title.replace(re, '')
      break
    }
  }
  // Sufijo genérico corto tras " | " o " - " (solo si deja un titular sustancial).
  const stripped = title.replace(SUFFIX_RE, '')
  if (stripped !== title && stripped.split(' ').length >= 5) title = stripped

  title = title.replace(/^["'«“]+|["'»”]+$/g, '').trim()
  return title
}

/** Titular a mostrar: Story.title ya es editorial; se limpia por seguridad. */
export function getHeadline(story) {
  if (!story) return ''
  const sources = (story.sources || []).map((s) => s?.name)
  return cleanHeadline(story.title, sources)
}
