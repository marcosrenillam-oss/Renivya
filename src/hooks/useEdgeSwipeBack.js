import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { haptic } from '@/lib/haptics'

const standalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

/**
 * Volver atrás deslizando desde el borde izquierdo, como en las apps de iPhone. Solo en la app
 * instalada (en Safari ya existe el gesto del navegador) y fuera de la portada.
 */
export function useEdgeSwipeBack(ref, enabled) {
  const navigate = useNavigate()
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || !standalone()) return undefined
    let s = null
    const reset = () => {
      el.style.transition = 'transform .25s cubic-bezier(.22,1,.36,1)'
      el.style.transform = ''
    }
    const down = (e) => {
      const t = e.touches[0]
      if (e.touches.length === 1 && t.clientX <= 22) s = { x: t.clientX, y: t.clientY, dx: 0, locked: false }
    }
    const move = (e) => {
      if (!s) return
      const t = e.touches[0]
      const dx = t.clientX - s.x
      const dy = t.clientY - s.y
      if (!s.locked) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) {
          s = null
          return
        }
        if (dx > 12) s.locked = true
      }
      if (s.locked) {
        s.dx = Math.max(0, dx)
        el.style.transition = 'none'
        el.style.transform = `translateX(${s.dx * 0.85}px)`
      }
    }
    const up = () => {
      if (!s) return
      const done = s.locked && s.dx > 90
      s = null
      if (!done) return reset()
      haptic()
      el.style.transition = 'transform .18s ease-out'
      el.style.transform = 'translateX(100vw)'
      setTimeout(() => {
        el.style.transition = 'none'
        el.style.transform = ''
        if (window.history.length > 1) navigate(-1)
        else navigate('/')
      }, 170)
    }
    document.addEventListener('touchstart', down, { passive: true })
    document.addEventListener('touchmove', move, { passive: true })
    document.addEventListener('touchend', up, { passive: true })
    document.addEventListener('touchcancel', up, { passive: true })
    return () => {
      document.removeEventListener('touchstart', down)
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', up)
      document.removeEventListener('touchcancel', up)
      el.style.transform = ''
    }
  }, [ref, enabled, navigate])
}
