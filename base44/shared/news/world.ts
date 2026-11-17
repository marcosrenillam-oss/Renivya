// Informe mundial: agregación por país y región (lo usan getWorldReport y la vista World).
import { COUNTRY_REGION, REGIONS } from './geo.ts'

const LIVE = new Set(['developing', 'active', 'updated'])

/** stories: [{ id, title, category, countries, renivya_score, status, is_breaking, updated_date, published_at }] */
export function buildWorldReport(stories) {
  const byCountry = new Map()
  for (const s of stories) {
    if (s.status === 'archived') continue
    for (const code of s.countries || []) {
      if (!byCountry.has(code)) byCountry.set(code, { code, region: COUNTRY_REGION[code] ?? null, count: 0, live: 0, breaking: 0, weight: 0, categories: {}, stories: [], lastUpdated: null })
      const c = byCountry.get(code)
      c.count++
      if (LIVE.has(s.status)) c.live++
      if (s.is_breaking) c.breaking++
      c.weight += s.renivya_score ?? 40
      c.categories[s.category] = (c.categories[s.category] || 0) + 1
      c.stories.push(s)
      const at = s.updated_date || s.published_at
      if (at && (!c.lastUpdated || at > c.lastUpdated)) c.lastUpdated = at
    }
  }
  const countries = [...byCountry.values()]
  const maxWeight = Math.max(1, ...countries.map((c) => c.weight))
  for (const c of countries) {
    c.intensity = Math.round((c.weight / maxWeight) * 100) / 100
    c.stories.sort((a, b) => (b.renivya_score ?? 0) - (a.renivya_score ?? 0) || String(a.id).localeCompare(String(b.id)))
    const top = c.stories[0]
    c.topStory = top ? { id: top.id, title: top.title, category: top.category } : null
    c.storyIds = c.stories.map((s) => s.id)
    c.dominantCategory = Object.entries(c.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
    delete c.stories
  }
  countries.sort((a, b) => b.weight - a.weight || a.code.localeCompare(b.code))
  const regions = REGIONS.map((region) => {
    const list = countries.filter((c) => c.region === region)
    return { region, count: list.reduce((n, c) => n + c.count, 0), countries: list.map((c) => c.code) }
  })
  return {
    countries,
    regions,
    totals: { stories: stories.filter((s) => s.status !== 'archived').length, countries: countries.length, breaking: stories.filter((s) => s.is_breaking).length },
  }
}
