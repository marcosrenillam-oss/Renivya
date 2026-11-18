import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { syncSnapshot } from '@/lib/snapshotSync'

/**
 * Noticias al día: se descargan cada vez que abres la app o vuelves a ella (y cada 10 minutos
 * si la tienes abierta). Devuelve el estado para mostrar un aviso discreto.
 */
export function useSnapshotSync() {
  const qc = useQueryClient()
  const [state, setState] = useState('idle') // idle | syncing | updated
  useEffect(() => {
    let last = 0
    let busy = false
    let hide = 0
    const run = async () => {
      if (busy || document.visibilityState !== 'visible' || Date.now() - last < 15_000) return
      busy = true
      last = Date.now()
      setState('syncing')
      try {
        const { updated } = await syncSnapshot()
        if (updated) {
          await qc.invalidateQueries()
          setState('updated')
          clearTimeout(hide)
          hide = setTimeout(() => setState('idle'), 2200)
        } else setState('idle')
      } catch {
        setState('idle') // sin red: se sigue mostrando lo que ya hay en el dispositivo
      } finally {
        busy = false
      }
    }
    run()
    const onVisible = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('pageshow', run)
    window.addEventListener('focus', run)
    const id = setInterval(run, 10 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pageshow', run)
      window.removeEventListener('focus', run)
      clearInterval(id)
      clearTimeout(hide)
    }
  }, [qc])
  return state
}
