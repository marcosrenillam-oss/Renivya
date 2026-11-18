import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listStories, queryKeys, STORY_SORT } from '@/lib/dataService'
import { useI18n } from '@/lib/i18n/I18nContext'
import { useAuth } from '@/lib/AuthContext'
import { storyInLocale } from '../../../engine/translation.js'
import { storyCountries, storyInEdition } from '../../../engine/editions.js'

export { storyInEdition, storyCountries }

/** Orden de portada: relevancia, con un ligero empuje a lo más reciente. */
export function frontRank(story, now = Date.now()) {
  const at = Date.parse(story.updated_date || story.published_at || '') || now
  const hours = Math.max(0, (now - at) / 3_600_000)
  return (story.renivya_score ?? 0) * (1 / (1 + hours / 36)) + (story.is_breaking ? 12 : 0)
}

export function byFront(a, b) {
  return frontRank(b) - frontRank(a) || String(a.id).localeCompare(String(b.id))
}

/**
 * Todas las historias vivas, ya en el idioma del lector. Las que no están enteras en ese
 * idioma (ni original ni traducción) no aparecen: nunca se mezclan idiomas.
 */
export function useNews() {
  const { locale } = useI18n()
  const q = useQuery({
    queryKey: queryKeys.stories({ scope: 'all' }),
    queryFn: () => listStories({ sort: STORY_SORT.score, limit: 1000 }),
    staleTime: 60_000,
  })
  const stories = useMemo(() => (q.data || []).map((s) => storyInLocale(s, locale)).filter(Boolean), [q.data, locale])
  return { ...q, stories, total: q.data?.length ?? 0 }
}

/** País de la edición del lector (por defecto España). */
export function useEdition() {
  const { user } = useAuth()
  return user?.country || 'ES'
}

/** Historias de la edición del lector (su prensa + lo que ocurre en su país), en orden de portada. */
export function useEditionNews() {
  const edition = useEdition()
  const news = useNews()
  const stories = useMemo(() => news.stories.filter((s) => storyInEdition(s, edition)).sort(byFront), [news.stories, edition])
  return { ...news, edition, stories }
}
