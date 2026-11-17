import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPreference, listStories, queryKeys, STORY_SORT } from '@/lib/dataService'
import { buildDigest } from '@/lib/news/digestService'
import { useAuth } from '@/lib/AuthContext'

/**
 * Datos de portada: historias vivas + preferencias → digest determinista.
 * `mode` fuerza 'world' (global) o 'personal'; por defecto, el de las preferencias.
 */
export function useBriefing(mode = null) {
  const { user } = useAuth()
  const stories = useQuery({
    queryKey: queryKeys.stories({ scope: 'digest' }),
    queryFn: () => listStories({ filter: { status: { $in: ['developing', 'active', 'updated', 'resolved'] } }, sort: STORY_SORT.score, limit: 200 }),
    refetchInterval: 5 * 60 * 1000,
  })
  const preference = useQuery({ queryKey: queryKeys.preference(user?.id), queryFn: getPreference, enabled: Boolean(user) })

  const effectivePref = useMemo(() => {
    if (!preference.data) return null
    if (mode === 'world') return { ...preference.data, world_mode_enabled: true }
    if (mode === 'personal') return { ...preference.data, world_mode_enabled: false }
    return preference.data
  }, [preference.data, mode])

  const digest = useMemo(() => (stories.data ? buildDigest(stories.data, effectivePref) : null), [stories.data, effectivePref])

  return {
    digest,
    preference: preference.data,
    isLoading: stories.isLoading || preference.isLoading,
    isError: stories.isError,
    error: stories.error,
    refetch: stories.refetch,
    isEmpty: stories.isSuccess && stories.data.length === 0,
  }
}
