import { useEffect, useState } from 'react'
import { applyUpdate, hasNewVersion } from '@/lib/appUpdate'

const EVERY_MS = 5 * 60 * 1000

/** Comprueba versión nueva al abrir, al volver a la app y cada 5 minutos. */
export function useAutoUpdate() {
  const [updating, setUpdating] = useState(false)
  useEffect(() => {
    let busy = false
    const check = async () => {
      if (busy || document.visibilityState !== 'visible') return
      busy = true
      try {
        if (await hasNewVersion()) {
          setUpdating(true)
          setTimeout(() => applyUpdate().then((done) => !done && setUpdating(false)), 600)
        }
      } catch {
        /* sin red: se sigue con la versión actual */
      } finally {
        busy = false
      }
    }
    check()
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', check)
    window.addEventListener('focus', check)
    const id = setInterval(check, EVERY_MS)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', check)
      window.removeEventListener('focus', check)
      clearInterval(id)
    }
  }, [])
  return updating
}
