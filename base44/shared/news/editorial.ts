// Paso 6: pieza editorial determinista (titular, entradilla, cuerpo, puntos clave, contexto,
// cronología, contraste) con trazabilidad por párrafo. Un LLM puede pulir el estilo en backend,
// pero nunca inventa hechos ni toca SCORE/CONFIDENCE.
import { splitSentences } from './normalizer.ts'
import { jaccard, tokenize } from './semantic.ts'
import { cleanHeadline } from './headline.ts'
import { stableSort, uniq } from './stats.ts'

const MAX_BODY_SENTENCES = 18

/** Orden editorial de los miembros: fiabilidad, extensión y antigüedad. */
export function rankMembers(members) {
  return stableSort(
    members,
    (a, b) =>
      (b.reliability ?? 60) - (a.reliability ?? 60) ||
      (b.text?.length ?? 0) - (a.text?.length ?? 0) ||
      String(a.published_at || '').localeCompare(String(b.published_at || '')),
    (m) => m.url || m.source_name
  )
}

function countryNames(codes, locale) {
  let dn = null
  try {
    dn = new Intl.DisplayNames([locale], { type: 'region' })
  } catch {
    /* sin Intl */
  }
  return codes.map((c) => (dn ? dn.of(c) : c))
}

const CATEGORY_CONSEQUENCE = {
  es: {
    economy: 'Sus efectos pueden trasladarse a precios, empleo o mercados.',
    business: 'Puede afectar a trabajadores, accionistas y competidores del sector.',
    politics: 'Puede modificar decisiones de gobierno, mayorías o calendarios legislativos.',
    world: 'Tiene implicaciones diplomáticas y humanitarias más allá de un solo país.',
    health: 'Puede tener consecuencias para pacientes y sistemas sanitarios.',
    environment: 'Afecta a territorios, recursos naturales y a la población expuesta.',
    technology: 'Puede cambiar productos, servicios o la seguridad digital de los usuarios.',
    artificial_intelligence: 'Influye en cómo se desarrolla, regula y usa la inteligencia artificial.',
    science: 'Aporta conocimiento que otros equipos deberán contrastar y ampliar.',
    sports: 'Altera clasificaciones, calendarios o el rumbo de la competición.',
    football: 'Altera clasificaciones, calendarios o el rumbo de la competición.',
    culture: 'Tiene repercusión en el sector cultural y su público.',
    entertainment: 'Tiene repercusión en la industria del entretenimiento y su público.',
    travel: 'Puede afectar a viajeros, destinos y operadores turísticos.',
    society: 'Afecta a la vida cotidiana de la población implicada.',
  },
}

/** "Por qué importa": frases factuales derivadas de señales medibles (sin opinión). */
export function whyItMatters({ category, countries, analysis, status, locale = 'es' }) {
  const parts = []
  const names = countryNames(countries.slice(0, 4), locale)
  if (countries.length > 1) parts.push(`Implica a ${countries.length} países (${names.join(', ')}${countries.length > 4 ? '…' : ''}).`)
  const n = analysis.independentSources
  if (n >= 2) parts.push(`La cubren ${n} fuentes independientes.`)
  const consequence = CATEGORY_CONSEQUENCE[locale]?.[category] ?? CATEGORY_CONSEQUENCE.es[category]
  if (consequence) parts.push(consequence)
  if (analysis.majorContradictions + analysis.minorDiscrepancies > 0) parts.push('Las fuentes no coinciden en algunos datos: conviene seguir su evolución.')
  else if (status === 'developing') parts.push('Es una historia en desarrollo: pueden aparecer datos nuevos.')
  return parts.join(' ')
}

/**
 * members: [{ source_name, url, title, text, published_at, reliability }]
 * Devuelve los campos editoriales de Story + provenance.
 */
export function buildEditorial({ members, analysis, category, countries = [], status = 'active', locale = 'es' }) {
  const ranked = rankMembers(members)
  const lead = ranked[0]
  const sourceNames = uniq(members.map((m) => m.source_name))
  const title = cleanHeadline(lead.title, sourceNames)
  const src = (m) => ({ name: m.source_name ?? null, url: m.url ?? null })

  // Entradilla: 1–2 primeras frases del artículo principal.
  const leadSentences = splitSentences(lead.text)
  let summary = leadSentences[0] || lead.text || title
  if (summary.length < 140 && leadSentences[1]) summary = `${summary} ${leadSentences[1]}`
  if (summary.length > 420) summary = `${summary.slice(0, 417).replace(/\s+\S*$/, '')}…`

  // Cuerpo: frases de todas las fuentes, sin repeticiones, con su procedencia.
  const chosen = []
  const summaryTokens = new Set(tokenize(summary))
  for (const m of ranked) {
    for (const s of splitSentences(m.text)) {
      const toks = new Set(tokenize(s))
      if (toks.size < 4) continue
      if (jaccard(toks, summaryTokens) >= 0.5) continue
      if (chosen.some((c) => jaccard(c.tokens, toks) >= 0.5)) continue
      chosen.push({ text: s, tokens: toks, source: src(m) })
      if (chosen.length >= MAX_BODY_SENTENCES) break
    }
    if (chosen.length >= MAX_BODY_SENTENCES) break
  }
  const paragraphsTarget = Math.max(chosen.length >= 4 ? 2 : 1, Math.min(6, Math.ceil(chosen.length / 3)))
  const perParagraph = Math.max(1, Math.ceil(chosen.length / paragraphsTarget))
  const body = []
  const bodyProv = []
  for (let i = 0; i < chosen.length; i += perParagraph) {
    const chunk = chosen.slice(i, i + perParagraph)
    body.push(chunk.map((c) => c.text).join(' '))
    bodyProv.push(uniqBy(chunk.map((c) => c.source)))
  }

  // Puntos clave y hechos conocidos (de mayor a menor solidez).
  const factual = analysis.knownFacts.filter((f) => f.status !== 'context')
  const keyFacts = factual.slice(0, 5)
  const key_points = keyFacts.map((f) => truncate(f.text, 220))
  const keyProv = keyFacts.map((f) => f.sources)
  const known_facts = analysis.knownFacts.map((f) => ({ text: f.text, type: f.type, status: f.status, sources: f.sources }))
  const contextFacts = analysis.knownFacts.filter((f) => f.status === 'context').slice(0, 2)

  // Cronología solo con suficientes momentos distintos (≥ 3 horas diferentes).
  const byHour = new Map()
  for (const m of stableSort(members, (a, b) => String(a.published_at).localeCompare(String(b.published_at)), (m) => m.url)) {
    if (!m.published_at) continue
    const hour = String(m.published_at).slice(0, 13)
    if (!byHour.has(hour)) byHour.set(hour, { date: m.published_at, event: `${m.source_name}: ${cleanHeadline(m.title, sourceNames)}` })
  }
  const timeline = byHour.size >= 3 ? [...byHour.values()] : []

  const words = members.reduce((n, m) => n + String(m.text || '').split(/\s+/).filter(Boolean).length, 0)
  const insufficient_info = words < 50

  return {
    title,
    summary,
    body,
    key_points,
    known_facts,
    why_it_matters: whyItMatters({ category, countries, analysis, status, locale }),
    context: contextFacts.length ? contextFacts.map((f) => f.text).join(' ') : null,
    timeline,
    contrast: { ...analysis.contrast, primary_source: analysis.primarySource },
    provenance: { body: bodyProv, key_points: keyProv, known_facts: known_facts.map((f) => f.sources) },
    insufficient_info,
    editorial_locale: locale,
  }
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : text
}

function uniqBy(sources) {
  const seen = new Map()
  for (const s of sources) if (!seen.has(s.url || s.name)) seen.set(s.url || s.name, s)
  return [...seen.values()]
}
