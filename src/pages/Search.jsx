import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search as SearchIcon, X } from 'lucide-react'
import SectionHeader from '@/components/common/SectionHeader'
import SearchDiscovery from '@/components/search/SearchDiscovery'
import { searchStories } from '@/components/search/searchStories'
import StoryListItem from '@/components/story/StoryListItem'
import FeedError from '@/components/story/FeedError'
import Spinner from '@/components/common/Spinner'
import { listStories, queryKeys, STORY_SORT } from '@/lib/dataService'
import { useI18n } from '@/lib/i18n/I18nContext'

export default function SearchPage() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const [input, setInput] = useState(params.get('q') || '')
  const q = params.get('q') || ''
  const pool = useQuery({
    queryKey: queryKeys.stories({ scope: 'search-pool' }),
    queryFn: () => listStories({ sort: STORY_SORT.recent, limit: 400, includeArchived: true }),
  })

  useEffect(() => setInput(q), [q])
  // Búsqueda mientras se escribe (con pequeña espera), reflejada en la URL.
  useEffect(() => {
    const id = setTimeout(() => {
      if (input.trim() !== q) setParams(input.trim() ? { q: input.trim() } : {}, { replace: true })
    }, 250)
    return () => clearTimeout(id)
  }, [input]) // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => (pool.data && q ? searchStories(pool.data, q) : []), [pool.data, q])

  return (
    <div className="space-y-8">
      <SectionHeader as="h1" size="display" title={t('page.search.title')} />
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('search.placeholder')}
          aria-label={t('page.search.title')}
          className="h-14 w-full rounded-2xl border bg-card/70 pl-12 pr-12 font-heading text-lg placeholder:font-body placeholder:text-base placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
        {input && (
          <button onClick={() => setInput('')} aria-label={t('common.close')} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {pool.isLoading ? (
        <Spinner label={t('common.loading')} />
      ) : pool.isError ? (
        <FeedError onRetry={pool.refetch} />
      ) : !q ? (
        <SearchDiscovery stories={pool.data} onPick={(term) => setInput(term)} />
      ) : results.length ? (
        <div>
          <p className="type-caption mb-2 text-muted-foreground">{t('search.results', { count: results.length })}</p>
          <div className="divide-y">
            {results.map((s) => (
              <StoryListItem key={s.id} story={s} />
            ))}
          </div>
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="type-h2 mb-2">{t('search.noResults', { q })}</p>
          <p className="type-small text-muted-foreground">{t('search.noResultsHint')}</p>
        </div>
      )}
    </div>
  )
}
