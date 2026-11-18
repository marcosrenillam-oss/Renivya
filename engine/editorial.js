// Paso 6: pieza editorial determinista (titular, entradilla, cuerpo, puntos clave, contexto,
// cronología, contraste) con trazabilidad por párrafo. Un LLM puede pulir el estilo en backend,
// pero nunca inventa hechos ni toca SCORE/CONFIDENCE.
import { splitSentences } from './normalizer.js'
import { jaccard, tokenize } from './semantic.js'
import { cleanHeadline } from './headline.js'
import { stableSort, uniq } from './stats.js'

const MAX_BODY_SENTENCES = 12
const JOURNALISTIC = new Set(['agency', 'newspaper', 'broadcast'])

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
    conflict: 'Tiene consecuencias humanitarias, diplomáticas y de seguridad para la región.',
    disasters: 'Afecta a la población de la zona y puede requerir ayuda de emergencia.',
    crime: 'Afecta a la seguridad ciudadana y queda en manos de policía y tribunales.',
    space: 'Amplía lo que sabemos del espacio y de las misiones que lo exploran.',
    markets: 'Puede mover el valor de ahorros, inversiones y precios.',
  },
  en: {
    economy: 'Its effects may reach prices, jobs or markets.',
    business: 'It may affect workers, shareholders and competitors in the sector.',
    politics: 'It may shift government decisions, majorities or legislative timetables.',
    world: 'It has diplomatic and humanitarian implications beyond a single country.',
    health: 'It may have consequences for patients and health systems.',
    environment: 'It affects land, natural resources and the people exposed.',
    technology: "It may change products, services or users' digital security.",
    artificial_intelligence: 'It shapes how artificial intelligence is developed, regulated and used.',
    science: 'It adds knowledge that other teams will need to test and extend.',
    sports: 'It changes standings, schedules or the course of the competition.',
    football: 'It changes standings, schedules or the course of the competition.',
    culture: 'It matters to the cultural sector and its audience.',
    entertainment: 'It matters to the entertainment industry and its audience.',
    travel: 'It may affect travellers, destinations and tour operators.',
    society: 'It affects the daily life of the people involved.',
    conflict: 'It has humanitarian, diplomatic and security consequences for the region.',
    disasters: 'It affects people in the area and may require emergency aid.',
    crime: 'It concerns public safety and is now in the hands of police and courts.',
    space: 'It expands what we know about space and the missions exploring it.',
    markets: 'It may move the value of savings, investments and prices.',
  },
}

const WHY = {
  es: {
    countries: (n, names, more) => `Implica a ${n} países (${names}${more ? '…' : ''}).`,
    sources: (n) => `La cubren ${n} fuentes independientes.`,
    disagree: 'Las fuentes no coinciden en algunos datos: conviene seguir su evolución.',
    developing: 'Es una historia en desarrollo: pueden aparecer datos nuevos.',
  },
  en: {
    countries: (n, names, more) => `It involves ${n} countries (${names}${more ? '…' : ''}).`,
    sources: (n) => `${n} independent sources are covering it.`,
    disagree: "The sources don't agree on some details: worth following how it develops.",
    developing: 'This is a developing story: new details may emerge.',
  },
}

/** "Por qué importa": frases factuales derivadas de señales medibles (sin opinión). Solo es/en. */
export function whyItMatters({ category, countries, analysis, status, locale = 'es' }) {
  const L = WHY[locale] ? locale : 'es'
  const t = WHY[L]
  const parts = []
  const names = countryNames(countries.slice(0, 4), L)
  if (countries.length > 1) parts.push(t.countries(countries.length, names.join(', '), countries.length > 4))
  const n = analysis.independentSources
  if (n >= 2) parts.push(t.sources(n))
  const consequence = CATEGORY_CONSEQUENCE[L][category]
  if (consequence) parts.push(consequence)
  if (analysis.majorContradictions + analysis.minorDiscrepancies > 0) parts.push(t.disagree)
  else if (status === 'developing') parts.push(t.developing)
  return parts.join(' ')
}

const QUANTITY = {
  es: { deaths: 'víctimas mortales', injured: 'heridos', displaced: 'desplazados o evacuados', area: 'superficie', attendance: 'asistencia', magnitude: 'magnitud' },
  en: { deaths: 'deaths', injured: 'injured', displaced: 'displaced or evacuated', area: 'area', attendance: 'attendance', magnitude: 'magnitude' },
}

function formatQuantity(n, lang) {
  return new Intl.NumberFormat(lang === 'es' ? 'es' : 'en', { maximumFractionDigits: 2 }).format(n)
}

/** Etiqueta de una discrepancia en el idioma del texto (es/en; el resto, en inglés para traducir). */
function differenceLabel(c, lang) {
  if (!c.data) return c.label
  const L = QUANTITY[lang] ? lang : 'en'
  const { klass, lo, hi } = c.data
  return `${QUANTITY[L][klass] || klass}: ${lo.source} ${formatQuantity(lo.value, L)}${lo.unit || ''} / ${hi.source} ${formatQuantity(hi.value, L)}${hi.unit || ''}`
}

function primaryLabel(p, lang) {
  if (!p?.found) return null
  if (lang === 'es') return `${p.source_name}${p.official ? ' (fuente oficial)' : ' cita un comunicado oficial'}`
  return `${p.source_name}${p.official ? ' (official source)' : ' cites an official statement'}`
}

/**
 * members: [{ source_name, url, title, text, published_at, reliability }]
 * Devuelve los campos editoriales de Story + provenance.
 */
export function buildEditorial({ members, analysis, category, countries = [], status = 'active', locale = 'es' }) {
  const ranked = rankMembers(members)
  // Titular y entradilla: fuente periodística en el idioma editorial si la hay; si no, la mejor disponible.
  const lead =
    ranked.find((m) => m.language === locale && JOURNALISTIC.has(m.source_type ?? 'newspaper')) ||
    ranked.find((m) => JOURNALISTIC.has(m.source_type ?? 'newspaper')) ||
    ranked[0]
  // Idioma del texto: el del artículo principal. Todo el texto de la historia sale de artículos
  // en ese idioma, para que nunca se mezclen (las demás lenguas llegan por traducción).
  const lang = lead.language || locale
  const sameLang = (m) => !m.language || m.language === lang
  const factLang = (f) => !f.language || f.language === lang
  const sourceNames = uniq(members.map((m) => m.source_name))
  const title = cleanHeadline(lead.title, sourceNames)
  const src = (m) => ({ name: m.source_name ?? null, url: m.url ?? null })

  // Frases completas: fuera las cortadas por el feed ("…", "[...]") o sin cierre.
  const complete = (t) => !/(\.\.\.|…|\[\s*…?\s*\])\s*$/.test(t) && /[.!?»"”)]$/.test(t.trim())
  const sentencesOf = (m) => splitSentences(m.text).filter(complete)

  // Entradilla: 1–2 primeras frases completas del artículo principal.
  const leadSentences = sentencesOf(lead)
  let summary = leadSentences[0] || splitSentences(lead.text)[0] || title
  if (summary.length < 140 && leadSentences[1]) summary = `${summary} ${leadSentences[1]}`
  if (summary.length > 420) summary = `${summary.slice(0, 417).replace(/\s+\S*$/, '')}…`

  // Cuerpo: cada párrafo sale de un solo periódico (sus frases en orden), sin repetir lo ya dicho.
  // Así se lee seguido y se entiende; primero el artículo principal, luego los demás.
  const said = [new Set(tokenize(summary))]
  const body = []
  const bodyProv = []
  let total = 0
  for (const m of [lead, ...ranked.filter((x) => x !== lead && sameLang(x))]) {
    const para = []
    for (const sentence of sentencesOf(m)) {
      if (total + para.length >= MAX_BODY_SENTENCES) break
      const toks = new Set(tokenize(sentence))
      if (toks.size < 4) continue
      if (said.some((prev) => jaccard(prev, toks) >= 0.4)) continue
      said.push(toks)
      para.push(sentence)
    }
    if (!para.length) continue
    // Párrafos de 2–4 frases.
    for (let i = 0; i < para.length; i += 3) {
      body.push(para.slice(i, i + 3).join(' '))
      bodyProv.push([src(m)])
    }
    total += para.length
    if (total >= MAX_BODY_SENTENCES) break
  }

  // Puntos clave y hechos conocidos (de mayor a menor solidez).
  const facts = analysis.knownFacts.filter(factLang)
  const factual = facts.filter((f) => f.status !== 'context')
  const keyFacts = factual.slice(0, 5)
  const key_points = keyFacts.map((f) => truncate(f.text, 220))
  const keyProv = keyFacts.map((f) => f.sources)
  const known_facts = facts.map((f) => ({ text: f.text, type: f.type, status: f.status, sources: f.sources }))
  const contextFacts = facts.filter((f) => f.status === 'context').slice(0, 2)

  // Cronología solo con suficientes momentos distintos (≥ 3 horas diferentes).
  const byHour = new Map()
  for (const m of stableSort(members.filter(sameLang), (a, b) => String(a.published_at).localeCompare(String(b.published_at)), (m) => m.url)) {
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
    // "Por qué importa" se genera en los dos idiomas de la app (plantillas deterministas).
    why_it_matters: whyItMatters({ category, countries, analysis, status, locale: lang === 'en' ? 'en' : 'es' }),
    why_it_matters_i18n: {
      es: whyItMatters({ category, countries, analysis, status, locale: 'es' }),
      en: whyItMatters({ category, countries, analysis, status, locale: 'en' }),
    },
    context: contextFacts.length ? contextFacts.map((f) => f.text).join(' ') : null,
    timeline,
    contrast: {
      coincidencias: facts.filter((f) => f.status === 'confirmed').slice(0, 5).map((f) => f.text),
      diferencias: analysis.contradictions.slice(0, 5).map((c) => differenceLabel(c, lang)),
      ausencias: analysis.independentSources >= 2
        ? facts.filter((f) => f.status === 'reported' && (f.sources || []).length === 1).slice(0, 5).map((f) => `${f.text} (${f.sources[0]?.name})`)
        : [],
      unconfirmed: facts.filter((f) => f.status === 'unconfirmed').slice(0, 5).map((f) => f.text),
      primary_source: { ...analysis.primarySource, description: primaryLabel(analysis.primarySource, lang) },
    },
    provenance: { body: bodyProv, key_points: keyProv, known_facts: known_facts.map((f) => f.sources) },
    insufficient_info,
    editorial_locale: lang,
    content_language: lang,
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
