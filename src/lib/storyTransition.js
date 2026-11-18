import { flushSync } from 'react-dom'
import { haptic } from '@/lib/haptics'

/**
 * Abrir una noticia con transición de foto: la foto de la tarjeta "vuela" y crece hasta la foto
 * de la noticia (View Transitions API). Sin soporte, se navega con normalidad.
 */
let active = false
export const isViewTransitionActive = () => active

function waitFor(selector, ms) {
  return new Promise((resolve) => {
    const start = performance.now()
    const tick = () => {
      // Con temporizadores: durante la transición el navegador no pinta (sin requestAnimationFrame).
      if (document.querySelector(selector) || performance.now() - start > ms) resolve()
      else setTimeout(tick, 16)
    }
    tick()
  })
}

export function openStory(event, navigate, id, sourceEl = null) {
  haptic()
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduced) {
    if (!event) navigate(`/story/${id}`)
    return
  }
  event?.preventDefault()
  const photo = sourceEl || event?.currentTarget?.querySelector('img')
  if (photo) photo.style.viewTransitionName = 'story-photo'
  active = true
  const vt = document.startViewTransition(async () => {
    flushSync(() => navigate(`/story/${id}`))
    window.scrollTo(0, 0)
    await waitFor('[data-vt="story-photo"]', 900)
  })
  vt.finished.finally(() => {
    active = false
    if (photo) photo.style.viewTransitionName = ''
  })
}
