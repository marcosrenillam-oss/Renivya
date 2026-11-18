// Paso 5: RENIVYA SCORE (importancia) y CONFIDENCE (solidez). Conceptos distintos.
// Ambos son 100 % deterministas y explicables: NUNCA se calculan con un LLM.
import { foldAccents } from './normalizer.js'
import { COUNTRY_REGION } from './geo.js'
import { clamp, hoursBetween, mean, round, saturate } from './stats.js'
import { extractNumbers } from './analysis.js'

/** Pesos del SCORE. Suman 1. confidence_context tiene solo un 5 %. */
export const SCORE_WEIGHTS = {
  impact: 0.22,
  reach: 0.16,
  international: 0.14,
  magnitude: 0.13,
  development_potential: 0.1,
  audience_relevance: 0.1,
  recency: 0.1,
  confidence_context: 0.05,
}

/** Impacto base por categoría (consecuencias típicas sobre la vida pública). */
const CATEGORY_IMPACT = {
  world: 62, politics: 60, economy: 60, health: 58, environment: 55, business: 48, artificial_intelligence: 52,
  technology: 46, science: 44, society: 46, sports: 34, football: 36, culture: 32, entertainment: 28, travel: 30,
  conflict: 64, disasters: 62, crime: 44, space: 42, markets: 52,
}
/** Interés de audiencia general por categoría (no personalizado: eso lo hace el Digest). */
const CATEGORY_AUDIENCE = {
  world: 60, politics: 58, economy: 56, football: 62, sports: 52, health: 60, technology: 52, artificial_intelligence: 56,
  society: 54, entertainment: 50, environment: 48, business: 44, science: 42, culture: 40, travel: 42,
  conflict: 60, disasters: 60, crime: 56, space: 50, markets: 46,
}

const HIGH_IMPACT_TERMS = [
  'muertos', 'fallecidos', 'victimas', 'killed', 'dead', 'deaths', 'morts', 'mortos', 'guerra', 'war', 'guerre', 'terremoto', 'earthquake',
  'evacuacion', 'evacuation', 'emergencia', 'emergency', 'estado de alarma', 'crisis', 'colapso', 'collapse', 'recesion', 'recession',
  'pandemia', 'pandemic', 'golpe de estado', 'coup', 'dimision', 'resignation', 'demission', 'invasion', 'sanciones', 'sanctions',
]
const DEVELOPMENT_TERMS = [
  'negociacion', 'negotiation', 'talks', 'investigacion', 'investigation', 'enquete', 'se espera', 'expected', 'proximos dias', 'coming days',
  'votacion', 'vote', 'juicio', 'trial', 'escalada', 'escalation', 'ofensiva', 'offensive', 'en curso', 'ongoing', 'continua', 'continues', 'plazo', 'deadline',
]
const BREAKING_TERMS = ['ultima hora', 'urgente', 'breaking', 'en directo', 'live', 'alerta', 'alert', 'derniere minute', 'urgent', 'agora']

function countTerms(text, terms) {
  const f = ` ${foldAccents(String(text || '').toLowerCase())} `
  return terms.reduce((n, t) => n + (f.includes(` ${t}`) ? 1 : 0), 0)
}

/** Magnitud por cifras (víctimas, dinero, porcentajes), escala logarítmica. */
function magnitudeScore(text) {
  const nums = extractNumbers(String(text || '').slice(0, 8000))
  let best = 0
  for (const n of nums) {
    let s = 0
    const ctx = n.context
    if (/muert|fallec|victim|kill|dead|death|mort|herid|injur|bless/.test(ctx)) s = 30 + 14 * Math.log10(Math.max(1, n.value))
    else if (n.value >= 1e6) s = 20 + 8 * Math.log10(n.value / 1e6 + 1) + (n.value >= 1e9 ? 20 : 0)
    else if (n.unit === '%') s = Math.min(60, 20 + n.value)
    else s = Math.min(35, 8 * Math.log10(n.value + 1))
    best = Math.max(best, s)
  }
  return clamp(best)
}

/** Recencia: curva exponencial suave (vida media ~18 h). */
export function recencyScore(publishedAt, now = new Date()) {
  const h = hoursBetween(publishedAt, now)
  if (h == null) return 40
  return clamp(100 * Math.pow(0.5, h / 18))
}

/**
 * RENIVYA SCORE.
 * input: { category, countries, languages, analysis, members, firstPublishedAt, lastPublishedAt, status, text, confidence, now }
 */
export function computeScore(input) {
  const { category, countries = [], languages = [], analysis, text = '', confidence = 50, status, now = new Date() } = input
  const independent = analysis?.independentSources ?? 1
  const regions = new Set(countries.map((c) => COUNTRY_REGION[c]).filter(Boolean))
  const impactTerms = countTerms(text, HIGH_IMPACT_TERMS)

  const impact = clamp((CATEGORY_IMPACT[category] ?? 45) + Math.min(30, impactTerms * 8))
  const reach = clamp(saturate(independent, 3, 85) + Math.min(15, (languages.length - 1) * 6))
  const international = clamp(countries.length <= 1 ? 25 + (countries.length ? 10 : 0) : 30 + saturate(countries.length - 1, 2, 45) + (regions.size > 1 ? 15 : 0))
  const magnitude = magnitudeScore(text)
  const development_potential = clamp(30 + Math.min(45, countTerms(text, DEVELOPMENT_TERMS) * 12) + (status === 'developing' ? 15 : 0))
  const audience_relevance = clamp(CATEGORY_AUDIENCE[category] ?? 45)
  const recency = recencyScore(input.lastPublishedAt || input.firstPublishedAt, now)
  const confidence_context = clamp(confidence)

  const parts = { impact, reach, international, development_potential, audience_relevance, magnitude, recency, confidence_context }
  const final = Object.entries(SCORE_WEIGHTS).reduce((acc, [k, w]) => acc + w * parts[k], 0)
  const breakdown = Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, round(v)]))
  breakdown.final_score = round(clamp(final))

  // Breaking: urgencia + impacto + alcance, solo con evidencia reciente y plural.
  const urgency = clamp(recency * 0.7 + Math.min(30, countTerms(text, BREAKING_TERMS) * 15))
  const breaking_score = round(clamp(0.4 * urgency + 0.35 * impact + 0.25 * reach))
  const ageH = hoursBetween(input.firstPublishedAt, now) ?? 99
  const is_breaking = breaking_score >= 72 && ageH <= 6 && independent >= 2 && impact >= 60

  return { score: breakdown.final_score, breakdown, breaking_score, is_breaking, importance: round(mean([impact, magnitude, international])) }
}

/**
 * CONFIDENCE: fuentes independientes, acuerdo, contradicciones, estado de los hechos,
 * fuente primaria y antigüedad. Devuelve { confidence, status, level, breakdown }.
 */
export function computeConfidence(input) {
  const { analysis, languages = [], firstPublishedAt, lastPublishedAt, insufficientInfo = false, correctedFacts = 0, now = new Date() } = input
  const independent = analysis?.independentSources ?? 0
  const facts = analysis?.factStats ?? { confirmed: 0, reported: 0, unconfirmed: 0, disputed: 0 }
  const agreement = analysis?.agreementRatio
  const majors = analysis?.majorContradictions ?? 0
  const minors = analysis?.minorDiscrepancies ?? 0
  const primary = Boolean(analysis?.primarySource?.found)
  const ageH = hoursBetween(firstPublishedAt, now) ?? 0
  const freshnessH = hoursBetween(lastPublishedAt || firstPublishedAt, now) ?? 0

  let value = [0, 32, 50, 61, 68, 73][Math.min(independent, 5)] + (independent > 5 ? Math.min(7, independent - 5) : 0)
  if (agreement != null) value += (agreement - 60) * 0.2
  value -= majors * 12 + minors * 4
  value += Math.min(10, facts.confirmed * 2)
  value -= Math.min(12, facts.unconfirmed * 3)
  value -= Math.min(10, (facts.disputed || 0) * 3)
  if (primary) value += 8
  if (ageH < 2) value -= 5 // demasiado pronto: la historia aún se está formando
  if (languages.length >= 2 && independent >= 2) value += 3
  if (insufficientInfo) value = Math.min(value, 35)
  const confidence = round(clamp(value, 5, 98))

  let status
  if (insufficientInfo || independent === 0) status = 'pending'
  else if (confidence >= 85 && independent >= 3 && majors === 0) status = 'confirmed'
  else if (confidence >= 70) status = 'high'
  else if (confidence >= 50) status = 'medium'
  else status = 'low'

  let level
  if (status === 'confirmed' || status === 'high') level = 'confirmed'
  else if (ageH < 6 || status === 'medium') level = 'developing'
  else level = 'unconfirmed'

  return {
    confidence,
    status,
    level,
    breakdown: {
      total_sources: analysis?.totalSources ?? 0,
      independent_sources: independent,
      languages,
      agreement_ratio: agreement,
      contradiction_count: majors + minors,
      minor_discrepancies: minors,
      major_contradictions: majors,
      confirmed_facts: facts.confirmed,
      reported_facts: facts.reported,
      unconfirmed_facts: facts.unconfirmed,
      disputed_facts: facts.disputed || 0,
      corrected_facts: correctedFacts,
      recency_hours: round(freshnessH, 1),
      primary_source_present: primary,
      last_evidence_at: lastPublishedAt || firstPublishedAt || null,
    },
  }
}
