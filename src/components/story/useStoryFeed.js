import { useInfiniteQuery } from '@tanstack/react-query'
import { listStories, STORY_SORT } from '@/lib/dataService'
import { buildFeedFilter, FEED_PAGE_SIZE } from '@/components/story/feedQuery'

/** Feed paginado (skip/limit) con filtros. sort: 'score' | 'recent'. */
export function useStoryFeed({ category = null, country = null, status = 'all', sort = 'score' } = {}) {
  const filter = buildFeedFilter({ category, country, status })
  return useInfiniteQuery({
    queryKey: ['stories', 'feed', { category, country, status, sort }],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      listStories({ filter, sort: sort === 'recent' ? STORY_SORT.recent : STORY_SORT.score, limit: FEED_PAGE_SIZE, skip: pageParam }),
    getNextPageParam: (last, pages) => (last.length < FEED_PAGE_SIZE ? undefined : pages.length * FEED_PAGE_SIZE),
  })
}
