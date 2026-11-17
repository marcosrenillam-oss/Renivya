import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Vuelve arriba al cambiar de ruta (salvo navegación a un ancla). */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, hash])
  return null
}
