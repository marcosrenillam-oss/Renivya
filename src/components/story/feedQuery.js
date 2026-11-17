import { categoryFamily } from '@/lib/categories'

/**
 * Traduce los filtros de la interfaz a una consulta de Base44.
 * params: { category, country, status: 'all'|'live'|'resolved', demo }
 */
export function buildFeedFilter({ category, country, status = 'all' } = {}) {
  const filter = {}
  if (category) {
    // Las categorías padre incluyen a sus hijas (deportes ⊃ fútbol).
    const children = ['football', 'artificial_intelligence', 'business', 'entertainment'].filter((c) => categoryFamily(c).includes(category))
    filter.category = children.length ? { $in: [category, ...children] } : category
  }
  if (country) filter.countries = country
  if (status === 'live') filter.status = { $in: ['developing', 'active', 'updated'] }
  else if (status === 'resolved') filter.status = 'resolved'
  return filter
}

export const FEED_PAGE_SIZE = 20
