/** Fuentes (nombres únicos) de una historia, en orden editorial. */
export function sourceNames(story) {
  const names = (story?.sources || []).map((s) => s?.name).filter(Boolean)
  return [...new Set(names)]
}

/** "El País, ABC y 2 más" / "El País". */
export function sourcesLabel(story, t, max = 2) {
  const names = sourceNames(story)
  if (!names.length) return ''
  if (names.length <= max) return names.join(', ')
  return t('home.andMore', { name: names.slice(0, max).join(', '), n: names.length - max })
}

export function readingMinutes(story) {
  const words = [story?.summary, ...(story?.body || [])].join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}
