import { useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listSavedStoryLinks, queryKeys, toggleSavedStory } from '@/lib/dataService'
import { useAuth } from '@/lib/AuthContext'

/** Ids guardados del usuario + alternar con actualización optimista. */
export function useSavedStories() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const key = queryKeys.saved(user?.id)
  const query = useQuery({ queryKey: key, queryFn: listSavedStoryLinks, enabled: Boolean(user) })
  const ids = useMemo(() => new Set((query.data || []).map((l) => l.story_id)), [query.data])

  const mutation = useMutation({
    mutationFn: (storyId) => toggleSavedStory(storyId),
    onMutate: async (storyId) => {
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData(key)
      const has = (prev || []).some((l) => l.story_id === storyId)
      qc.setQueryData(key, has ? (prev || []).filter((l) => l.story_id !== storyId) : [...(prev || []), { id: `tmp-${storyId}`, story_id: storyId, created_date: new Date().toISOString() }])
      return { prev }
    },
    onError: (_e, _id, ctx) => qc.setQueryData(key, ctx?.prev),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key })
      qc.invalidateQueries({ queryKey: ['saved-stories'] })
    },
  })

  const toggle = useCallback((storyId) => mutation.mutate(storyId), [mutation])
  return { ids, isSaved: (id) => ids.has(id), toggle, isLoading: query.isLoading }
}
