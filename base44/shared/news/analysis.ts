// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Paso 4: hechos, coincidencias, diferencias, ausencias y contradicciones entre fuentes. Determinista.
import { foldAccents, splitSentences } from './normalizer.ts'
import { jaccard, shingles, tokenize } from './semantic.ts'

const HEDGES = [
  'segun fuentes', 'presuntamente', 'supuestamente', 'podria', 'podrian', 'no confirmado', 'sin confirmar', 'al parecer', 'se cree',
  'reportedly', 'allegedly', 'unconfirmed', 'could', 'may have', 'might', 'it is believed', 'sources say', 'rumor', 'rumores',
  'selon des sources', 'presumement', 'pourrait', 'non confirme', 'alegadamente', 'nao confirmado', 'poderia',
]
const CONTEXT_MARKERS = [
  'desde', 'hace anos', 'en los ultimos', 'historicamente', 'antecedentes', 'el ano pasado', 'en 20', 'en 19',
  'since', 'last year', 'historically', 'in recent years', 'background', 'depuis', "l'annee derniere", 'desde entao', 'no ano passado',
]
const OFFICIAL_MARKERS = [
  'comunicado oficial', 'nota de prensa', 'boletin oficial', 'segun el ministerio', 'confirmo el gobierno', 'confirmo oficialmente',
  'official statement', 'press release', 'the ministry said', 'officially confirmed', 'communique officiel', 'comunicado oficial do',
]
const CORRECTION_MARKERS = ['rectifica', 'corrige', 'correccion', 'fe de errores', 'correction', 'corrected', 'erratum', 'rectificacao', 'clarification', 'aclaracion']

export const PRIMARY_SOURCE_TYPES = new Set(['official', 'data'])

function has(text, list) {
  const f = ` ${foldAccents(String(text || '').toLowerCase())} `
  return list.some((m) => f.includes(m))
}

export function isHedged(sentence) {
  return has(sentence, HEDGES)
}

export function hasCorrectionMarker(text) {
  return has(text, CORRECTION_MARKERS)
}

/** Clases de magnitud comparables entre fuentes (raíces sin acentos). */
const QUANTITY_CLASSES = {
  deaths: ['muert', 'fallec', 'kill', 'dead', 'death', 'mort', 'victim', 'vitim', 'toll'],
  injured: ['herid', 'injur', 'wound', 'bless', 'ferid'],
  displaced: ['desplaz', 'displac', 'evacu', 'deplac', 'desaloj', 'refugi', 'deslocad'],
  area: ['hectar', 'hectare', 'km2', 'kilometros cuadrados', 'square'],
  attendance: ['espectador', 'aficionad', 'asistent', 'spectator', 'fans', 'attendance'],
  magnitude: ['magnitud', 'magnitude'],
  money: ['euro', 'dolar', 'dollar', 'libra', 'pound'],
}

function quantityClass(sentence, start, end) {
  const before = tokenize(sentence.slice(0, start)).slice(-8).reverse()
  const after = tokenize(sentence.slice(end)).slice(0, 4)
  let best = null
  let bestDist = Infinity
  for (const [cls, stems] of Object.entries(QUANTITY_CLASSES)) {
    const hit = (list, offset) => list.findIndex((t) => stems.some((s) => t.startsWith(s)))
    const a = hit(after)
    const b = hit(before)
    const d = Math.min(a === -1 ? Infinity : a, b === -1 ? Infinity : b + 0.5)
    if (d < bestDist) {
      bestDist = d
      best = cls
    }
  }
  return best
}

/** Números con su clase de magnitud (para detectar cifras en conflicto). */
export function extractNumbers(sentence) {
  const out = []
  const re = /(\d{1,3}(?:[.,\s\u00a0]\d{3})+(?![.,]?\d)|\d+(?:[.,]\d{1,2})?)\s*(%|por ciento|percent|millones|millions|million|milliards|billion|mil millones|mil milhões|mil|k)?/gi
  let m
  while ((m = re.exec(sentence))) {
    const raw = m[1]
    if (/^(19|20)\d{2}$/.test(raw)) continue // años: no son cifras comparables
    const thousands = /^\d{1,3}(?:[.,\s\u00a0]\d{3})+$/.test(raw)
    let value = Number(thousands ? raw.replace(/[.,\s\u00a0]/g, '') : raw.replace(',', '.'))
    const unit = (m[2] || '').toLowerCase()
    if (/millon|million/.test(unit)) value *= 1e6
    else if (/milliard|billion|mil millones|mil milh/.test(unit)) value *= 1e9
    else if (unit === 'mil' || unit === 'k') value *= 1e3
    if (!Number.isFinite(value)) continue
    const isPercent = /%|ciento|percent/.test(unit)
    const after = tokenize(sentence.slice(m.index + m[0].length, m.index + m[0].length + 40)).slice(0, 2)
    out.push({
      value,
      unit: isPercent ? '%' : '',
      klass: isPercent ? 'percent' : quantityClass(sentence, m.index, m.index + m[0].length),
      context: after.join(' '),
    })
  }
  return out
}

/** Frases candidatas a hecho: con cifras, fechas, citas o verbos de declaración. */
function factCandidates(text) {
  return splitSentences(text)
    .filter((s) => s.length <= 360)
    .filter((s) => /\d/.test(s) || /[«"“]/.test(s) || /\b(confirm|anunci|announc|declar|said|dijo|afirm|aprob|approv|firm|sign)/i.test(s))
}

/**
 * Agrupa fuentes que en realidad son el mismo cable (texto copiado casi literal)
 * o el mismo medio. Devuelve Map<memberIndex, groupIndex> y el número de grupos.
 */
export function independenceGroups(members) {
  const parent = members.map((_, i) => i)
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  const union = (a, b) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb)
  }
  const names = members.map((m) => foldAccents(String(m.source_name || '').toLowerCase()).trim())
  const sh = members.map((m) => shingles(`${m.title} ${m.text}`))
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      if (names[i] && names[i] === names[j]) union(i, j)
      else if (sh[i].size > 20 && sh[j].size > 20 && jaccard(sh[i], sh[j]) >= 0.6) union(i, j)
    }
  }
  const roots = new Map()
  const groupOf = new Map()
  members.forEach((_, i) => {
    const r = find(i)
    if (!roots.has(r)) roots.set(r, roots.size)
    groupOf.set(i, roots.get(r))
  })
  return { groupOf, count: roots.size }
}

/**
 * Análisis de contraste de un grupo de artículos.
 * members: [{ source_name, source_type, url, title, text, published_at, language }]
 */
export function analyzeCluster(members) {
  const { groupOf, count: independent } = independenceGroups(members)

  // 1. Hechos por artículo y agrupación de hechos equivalentes entre fuentes.
  const facts = []
  members.forEach((m, mi) => {
    for (const sentence of factCandidates(m.text).slice(0, 12)) {
      facts.push({ text: sentence, tokens: new Set(tokenize(sentence)), numbers: extractNumbers(sentence), member: mi })
    }
  })
  const qkey = (n) => `${n.klass}|${n.value}`
  const clusters = []
  for (const f of facts) {
    let target = null
    let best = 0.34
    const fq = new Set(f.numbers.filter((n) => n.klass).map(qkey))
    for (const c of clusters) {
      const shared = [...fq].some((k) => c.quantities.has(k))
      const s = jaccard(f.tokens, c.tokens) + (shared ? 0.2 : 0)
      if (s > best) {
        best = s
        target = c
      }
    }
    if (target) {
      target.items.push(f)
      for (const t of f.tokens) target.tokens.add(t)
      for (const k of fq) target.quantities.add(k)
    } else clusters.push({ tokens: new Set(f.tokens), quantities: fq, items: [f] })
  }

  // 2. Contradicciones: misma clase de magnitud, valores distintos entre grupos independientes.
  //    Dentro de un mismo grupo (misma fuente o cable) una cifra distinta es actualización, no contradicción.
  const contradictions = []
  const disputedKeys = new Set()
  const disputedValues = new Map()
  const latestByGroup = new Map()
  for (const f of facts) {
    const g = groupOf.get(f.member)
    for (const n of f.numbers) {
      if (!n.klass) continue
      const key = `${n.klass}|${g}`
      const at = members[f.member].published_at || ''
      const prev = latestByGroup.get(key)
      if (!prev || at >= prev.at) latestByGroup.set(key, { ...n, at, group: g, source: members[f.member].source_name })
    }
  }
  const byClass = new Map()
  for (const v of latestByGroup.values()) {
    if (!byClass.has(v.klass)) byClass.set(v.klass, [])
    byClass.get(v.klass).push(v)
  }
  for (const [klass, values] of byClass) {
    if (values.length < 2 || klass === 'money' || klass === 'percent') continue
    const nums = values.map((v) => v.value)
    const min = Math.min(...nums)
    const max = Math.max(...nums)
    if (max === min) continue
    const rel = (max - min) / Math.max(Math.abs(max), 1)
    const lo = values.find((v) => v.value === min)
    const hi = values.find((v) => v.value === max)
    disputedKeys.add(klass)
    disputedValues.set(klass, new Set(nums))
    contradictions.push({
      severity: rel > 0.25 ? 'major' : 'minor',
      label: `${QUANTITY_LABEL[klass] || klass}: ${lo.source} ${formatN(min)}${lo.unit} / ${hi.source} ${formatN(max)}${hi.unit}`,
    })
  }

  // 3. Estado de cada hecho.
  const knownFacts = []
  for (const c of clusters) {
    const groups = new Set(c.items.map((f) => groupOf.get(f.member)))
    const rep = c.items.reduce((a, b) => (b.text.length < a.text.length ? b : a))
    const hedged = c.items.every((f) => isHedged(f.text))
    const context = !rep.numbers.length && has(rep.text, CONTEXT_MARKERS)
    let status = 'reported'
    if (hedged) status = 'unconfirmed'
    else if (context) status = 'context'
    else if (groups.size >= 2) status = 'confirmed'

    const disputed = c.items.some((f) => f.numbers.some((n) => disputedKeys.has(n.klass) && disputedValues.get(n.klass)?.has(n.value)))
    const sources = dedupeSources(c.items.map((f) => members[f.member]))
    knownFacts.push({
      text: rep.text,
      type: status === 'context' ? 'interpretation' : 'fact',
      status: disputed && status === 'confirmed' ? 'reported' : status,
      disputed,
      sources,
      groups: groups.size,
    })
  }

  // Orden: confirmados, reportados, contexto, no confirmados; dentro, más fuentes primero.
  const rank = { confirmed: 0, reported: 1, context: 2, unconfirmed: 3 }
  knownFacts.sort((a, b) => rank[a.status] - rank[b.status] || b.groups - a.groups || a.text.localeCompare(b.text))

  const confirmed = knownFacts.filter((f) => f.status === 'confirmed')
  const multi = independent >= 2
  const comparable = knownFacts.filter((f) => f.groups >= 2)
  const agreementRatio = multi && comparable.length ? Math.round((100 * comparable.filter((f) => !f.disputed).length) / comparable.length) : null

  const primaryMember = members.find((m) => PRIMARY_SOURCE_TYPES.has(m.source_type)) || members.find((m) => has(m.text, OFFICIAL_MARKERS))
  const majors = contradictions.filter((c) => c.severity === 'major')

  return {
    independentSources: independent,
    totalSources: members.length,
    knownFacts: knownFacts.slice(0, 14).map(({ groups, disputed, ...f }) => f),
    factStats: {
      confirmed: confirmed.length,
      reported: knownFacts.filter((f) => f.status === 'reported').length,
      unconfirmed: knownFacts.filter((f) => f.status === 'unconfirmed').length,
      disputed: knownFacts.filter((f) => f.disputed).length,
      context: knownFacts.filter((f) => f.status === 'context').length,
    },
    contradictions,
    majorContradictions: majors.length,
    minorDiscrepancies: contradictions.length - majors.length,
    agreementRatio,
    primarySource: primaryMember
      ? { found: true, description: `${primaryMember.source_name}${PRIMARY_SOURCE_TYPES.has(primaryMember.source_type) ? ' (fuente oficial)' : ' cita un comunicado oficial'}` }
      : { found: false, description: null },
    contrast: {
      coincidencias: confirmed.slice(0, 5).map((f) => f.text),
      diferencias: contradictions.slice(0, 5).map((c) => c.label),
      ausencias: multi ? knownFacts.filter((f) => f.groups === 1 && f.status === 'reported').slice(0, 5).map((f) => `${f.text} (${f.sources[0]?.name})`) : [],
      unconfirmed: knownFacts.filter((f) => f.status === 'unconfirmed').slice(0, 5).map((f) => f.text),
    },
    hasCorrection: members.some((m) => hasCorrectionMarker(`${m.title} ${m.text}`)),
    groupOf,
  }
}

const QUANTITY_LABEL = { deaths: 'víctimas mortales', injured: 'heridos', displaced: 'desplazados o evacuados', area: 'superficie', attendance: 'asistencia', magnitude: 'magnitud' }

function formatN(n) {
  if (Math.abs(n) >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, '')} mil M`
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, '')} M`
  return new Intl.NumberFormat('es').format(Math.round(n * 100) / 100)
}

function dedupeSources(members) {
  const seen = new Map()
  for (const m of members) {
    const key = m.url || m.source_name
    if (!seen.has(key)) seen.set(key, { name: m.source_name ?? null, url: m.url ?? null })
  }
  return [...seen.values()]
}
