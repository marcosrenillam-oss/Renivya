// Una sola tarjeta por noticia en las listas de la app.
const STOP = new Set('el la los las un una unos unas de del al a en y o que por para con sin sobre tras su sus se es son ha han the of to in and for on with at by from is are was after over as its'.split(' '))
const titleTokens = (t) =>
  new Set(String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9ñ]+/).filter((w) => w.length > 2 && !STOP.has(w)))

/**
 * Una sola tarjeta por noticia: si dos historias son casi la misma (titulares muy parecidos y
 * del mismo día), se queda la más relevante y la otra se le adjunta como "también contada".
 */
export function mergeNearDuplicates(stories) {
  const kept = []
  const sorted = [...stories].sort((a, b) => (b.renivya_score ?? 0) - (a.renivya_score ?? 0))
  for (const s of sorted) {
    const toks = titleTokens(s.title)
    const at = Date.parse(s.published_at || s.updated_date || 0)
    const twin = kept.find((k) => {
      if (Math.abs(Date.parse(k.published_at || k.updated_date || 0) - at) > 36 * 3_600_000) return false
      let inter = 0
      for (const w of toks) if (k._toks.has(w)) inter++
      const union = toks.size + k._toks.size - inter
      return union > 0 && inter / union >= 0.5 && inter >= 3
    })
    if (twin) twin.duplicates = [...(twin.duplicates || []), s.id]
    else kept.push(Object.assign(Object.create(null), s, { _toks: toks }))
  }
  return kept.map(({ _toks, ...s }) => s)
}

