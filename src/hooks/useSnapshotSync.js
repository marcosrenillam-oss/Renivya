import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { syncSnapshot } from '@/lib/snapshotSync'

/** Al abrir la app y al volver a ella: trae las noticias nuevas si las hay. */
export function useSnapshotSync() {
  const qc = useQueryClient()
  useEffect(() => {
    let last = 0
    const run = async () => {
      if (Date.now() - last < 60_000) return
      last = Date.now()
      try {
        const { updated } = await syncSnapshot()
        if (updated) qc.invalidateQueries()
      } catch {
        /* sin red: se sigue mostrando lo que ya hay en el dispositivo */
      }
    }
    run()
    const onVisible = () => document.visibilityState === 'visible' && run()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [qc])
}
