/**
 * Limpieza determinista de titulares. Única implementación compartida con el motor
 * (engine/headline.js), para que frontend y backend den el mismo resultado.
 */
import { cleanHeadline } from '../../engine/headline.js'

export { cleanHeadline }

/** Titular a mostrar: Story.title ya es editorial; se limpia por seguridad. */
export function getHeadline(story) {
  if (!story) return ''
  return cleanHeadline(story.title, (story.sources || []).map((s) => s?.name))
}
