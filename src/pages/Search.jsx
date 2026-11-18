import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Check, Plus, Search as SearchIcon, X } from 'lucide-react'
import SearchDiscovery from '@/components/search/SearchDiscovery'
import { searchStoriesDetailed } from '@/components/search/searchStories'
import { storyInLocale } from '../../engine/translation.js'
import NewsRow from '@/components/front/NewsRow'
import FeedError from '@/components/story/FeedError'
import Spinner from '@/components/common/Spinner'
import { listStories, queryKeys, STORY_SORT } from '@/lib/dataService'
import { useI18n } from '@/lib/i18n/I18nContext'
import { rememberSearch, useTopics } from '@/lib/preferences'
import { haptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'

/** Buscar: como el índice de un periódico. Tolera faltas, palabras a medias y siglas. */
export default function SearchPage() {
  const { t, locale } = useI18n()
  const [params, setParams] = useSearchParams()
  const [input, setInput] = useState(params.get('q') || '')
  const q = params.get('q') || ''
  const { isFollowed, toggle, markSeen } = useTopics()
  const pool = useQuery({
    queryKey: queryKeys.stories({ scope: 'search-pool' }),
    queryFn: () => listStories({ sort: STORY_SORT.recent, limit: 600, includeArchived: true }),
  })

  useEffect(() => setInput(q), [q])
  // Búsqueda mientras se escribe (con pequeña espera), reflejada en la URL.
  useEffect(() => {
    const id = setTimeout(() => {
      if (input.trim() !== q) setParams(input.trim() ? { q: input.trim() } : {}, { replace: true })
    }, 250)
    return () => clearTimeout(id)
  }, [input]) // eslint-disable-line react-hooks/exhaustive-deps

  const localized = useMemo(() => (pool.data || []).map((s) => storyInLocale(s, locale)).filter(Boolean), [pool.data, locale])
  const { results, partial } = useMemo(() => (q ? searchStoriesDetailed(localized, q) : { results: [], partial: false }), [localized, q])

  // Se recuerda la búsqueda cuando se queda quieta un momento y encuentra algo.
  useEffect(() => {
    if (!q || !results.length) return undefined
    const id = setTimeout(() => rememberSearch(q), 1200)
    return () => clearTimeout(id)
  }, [q, results.length])
  // Mirar un tema seguido lo marca como visto (se reinicia el contador de nuevas).
  useEffect(() => {
    if (q && isFollowed(q)) markSeen(q)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const following = q && isFollowed(q)

  return (
    <div className="space-y-6">
      <header className="pt-1">
        <div className="rule-thick" />
        <h1 className="py-1 font-display text-[36px] font-black leading-[1.05]">{t('page.search.title')}</h1>
        <p className="border-t border-foreground pt-1.5 font-serif-text text-[15px] italic text-muted-foreground">{t('search.subtitle')}</p>
      </header>

      <div className="relative border-b-2 border-foreground">
        <SearchIcon className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/70" aria-hidden="true" />
        <input
          autoFocus
          type="search"
          enterKeyHint="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          placeholder={t('search.placeholder')}
          aria-label={t('page.search.title')}
          className="h-14 w-full bg-transparent pl-8 pr-9 font-display text-[21px] placeholder:font-serif-text placeholder:text-[16px] placeholder:italic placeholder:text-muted-foreground focus:outline-none [&::-webkit-search-cancel-button]:hidden"
        />
        {input && (
          <button onClick={() => setInput('')} aria-label={t('common.close')} className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {pool.isLoading ? (
        <Spinner label={t('common.loading')} />
      ) : pool.isError ? (
        <FeedError onRetry={pool.refetch} />
      ) : !q ? (
        <SearchDiscovery stories={localized} onPick={(term) => setInput(term)} />
      ) : results.length ? (
        <div>
          <div className="flex items-center justify-between gap-3 pb-2">
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{results.length === 1 ? t('search.resultsOne') : t('search.results', { count: results.length })}</p>
            <button
              type="button"
              onClick={() => {
                haptic()
                toggle(q)
              }}
              className={cn(
                'flex items-center gap-1.5 border px-2.5 py-1 text-[11.5px] font-bold uppercase tracking-[0.1em] transition',
                following ? 'border-foreground bg-foreground text-background' : 'border-foreground text-foreground'
              )}
            >
              {following ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {following ? t('search.following') : t('search.follow')}
            </button>
          </div>
          {partial && <p className="border-t border-foreground pt-2 font-serif-text text-[14px] italic text-muted-foreground">{t('search.partial')}</p>}
          <div className="divide-y divide-foreground border-y border-foreground">
            {results.map((s) => (
              <NewsRow key={s.id} story={s} />
            ))}
          </div>
        </div>
      ) : (
        <div className="border-t border-foreground py-12 text-center">
          <p className="font-display text-[22px] font-bold">{t('search.noResults', { q })}</p>
          <p className="mt-2 font-serif-text text-[15px] italic text-muted-foreground">{t('search.noResultsHint')}</p>
        </div>
      )}
    </div>
  )
}
