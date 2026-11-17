/**
 * Limpieza determinista de titulares. Única implementación compartida con el motor
 * (base44/shared/news/headline.ts), para que frontend y backend den el mismo resultado.
 */
import { cleanHeadline } from '../../base44/shared/news/headline.ts'

export { cleanHeadline }

/** Titular a mostrar: Story.title ya es editorial; se limpia por seguridad. */
export function getHeadline(story) {
  if (!story) return ''
  return cleanHeadline(story.title, (story.sources || []).map((s) => s?.name))
}
