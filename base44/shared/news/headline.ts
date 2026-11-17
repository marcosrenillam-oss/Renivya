// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Limpieza determinista de titulares (compartida por motor e interfaz).
const SECTION_PREFIXES = [
  'en directo', 'directo', 'última hora', 'ultima hora', 'breaking', 'live', 'exclusiva', 'exclusive', 'opinión', 'opinion',
  'vídeo', 'video', 'en vivo', 'urgente', 'actualización', 'update', 'última hora', 'dernière minute', 'em direto',
]
const PREFIX_RE = new RegExp(`^\\s*(?:${SECTION_PREFIXES.map((p) => p.replace(/\s/g, '\\s+')).join('|')})\\s*[:|\\-–—]\\s*`, 'i')
const SUFFIX_RE = /\s+[|\-–—]\s+[^|\-–—]{2,40}$/

export function cleanHeadline(raw, sourceNames = []) {
  if (!raw) return ''
  let title = String(raw).replace(/\s+/g, ' ').trim().replace(PREFIX_RE, '')
  for (const name of sourceNames.filter(Boolean)) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const re = new RegExp(`\\s+[|\\-–—]\\s+${escaped}\\s*$`, 'i')
    if (re.test(title)) {
      title = title.replace(re, '')
      break
    }
  }
  const stripped = title.replace(SUFFIX_RE, '')
  if (stripped !== title && stripped.split(' ').length >= 5) title = stripped
  title = title.replace(/^["'«“]+|["'»”]+$/g, '').trim()
  // Tras quitar un prefijo ("Última hora: …") el titular debe empezar en mayúscula.
  return title.charAt(0).toLocaleUpperCase() + title.slice(1)
}
