import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listStories, queryKeys, STORY_SORT } from '@/lib/dataService'
import { buildWorldReport } from '@/lib/news/worldMapService'
import { categoryFamily } from '@/lib/categories'
import { COUNTRY_REGION } from '@/lib/countries'

/**
 * Informe mundial (misma agregación que la función backend getWorldReport, calculada
 * aquí sobre las historias ya cargadas para no duplicar peticiones).
 */
export function useWorldReport({ category = null, region = null } = {}) {
  const q = useQuery({
    queryKey: queryKeys.stories({ scope: 'world' }),
    queryFn: () => listStories({ sort: STORY_SORT.score, limit: 400 }),
    refetchInterval: 5 * 60 * 1000,
  })
  const report = useMemo(() => {
    if (!q.data) return null
    const filtered = q.data
      .filter((s) => !category || categoryFamily(s.category).includes(category))
      .map((s) => (region ? { ...s, countries: (s.countries || []).filter((c) => COUNTRY_REGION[c] === region) } : s))
    return buildWorldReport(filtered)
  }, [q.data, category, region])
  return { ...q, report, stories: q.data || [] }
}
