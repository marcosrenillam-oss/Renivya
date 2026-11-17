// Paso 7: extracción, normalización y persistencia de entidades + relaciones con evidencia explícita.
// Reglas: una Entity por normalized_name (sin duplicar), StoryEntity idempotente por (story_id, entity_id),
// EntityRelation solo cuando una frase lo dice expresamente. Nada de descripciones o IDs inventados.
import { CITY_GAZETTEER } from './geo.ts'
import { detectCountries, foldAccents, splitSentences } from './normalizer.ts'

/**
 * normalized_name: minúsculas, sin puntuación, espacios colapsados.
 * Puntos y apóstrofos se eliminan sin espacio ("C.F." → "cf"); el resto separa ("Saint-Germain" → "saint germain").
 */
export function normalizeEntityName(name) {
  if (!name) return ''
  return String(name)
    .normalize('NFC')
    .toLowerCase()
    .replace(/[.'’`´]/g, '')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export const ENTITY_TYPES = [
  'person', 'organization', 'country', 'city', 'location', 'sports_team', 'sports_event',
  'political_party', 'company', 'government', 'institution', 'other',
]

/** Organizaciones internacionales conocidas (nombre canónico en español + alias). */
const KNOWN_ORGS = [
  ['Naciones Unidas', 'institution', ['ONU', 'United Nations', 'Nations unies', 'Nações Unidas'], ['ONU', 'UN']],
  ['OTAN', 'organization', ['NATO', 'Organización del Tratado del Atlántico Norte'], ['OTAN', 'NATO']],
  ['Unión Europea', 'institution', ['European Union', 'Union européenne', 'União Europeia'], ['UE', 'EU']],
  ['Comisión Europea', 'institution', ['European Commission', 'Commission européenne'], []],
  ['Parlamento Europeo', 'institution', ['European Parliament', 'Parlement européen'], []],
  ['Banco Central Europeo', 'institution', ['European Central Bank', 'Banque centrale européenne'], ['BCE', 'ECB']],
  ['Reserva Federal', 'institution', ['Federal Reserve'], ['Fed']],
  ['Fondo Monetario Internacional', 'institution', ['International Monetary Fund', 'Fonds monétaire international'], ['FMI', 'IMF']],
  ['Organización Mundial de la Salud', 'institution', ['World Health Organization', 'Organisation mondiale de la santé'], ['OMS', 'WHO']],
  ['Banco Mundial', 'institution', ['World Bank', 'Banque mondiale'], []],
  ['OPEP', 'organization', ['OPEC'], ['OPEP', 'OPEC']],
  ['OCDE', 'organization', ['OECD'], ['OCDE', 'OECD']],
  ['G7', 'organization', [], ['G7']],
  ['G20', 'organization', [], ['G20']],
  ['FIFA', 'organization', [], ['FIFA']],
  ['UEFA', 'organization', [], ['UEFA']],
  ['NASA', 'institution', [], ['NASA']],
  ['Cruz Roja', 'organization', ['Red Cross', 'Croix-Rouge', 'Cruz Vermelha'], []],
  ['Amnistía Internacional', 'organization', ['Amnesty International'], []],
].map(([name, type, aliases, acronyms]) => ({ name, type, aliases, acronyms }))

const CLUB_MARKERS = /\b(FC|CF|C\.F\.|SC|AC|United|City|Real|Atlético|Atletico|Athletic|Sporting|Inter|Olympique|Club|Borussia|Bayern|Juventus|Benfica|Racing|Deportivo|Rayo|Celta|Wanderers|Rovers|Hotspur)\b/
const PARTY_MARKERS = /\b(Partido|Party|Parti|Partito|Partei|Frente|Front)\b/
const GOV_MARKERS = /\b(Gobierno|Government|Gouvernement|Governo|Ministerio|Ministry|Ministère|Ministério|Casa Blanca|White House|Kremlin|Moncloa|Elíseo|Élysée|Downing Street|Ayuntamiento|Generalitat|Junta de)\b/
const INSTITUTION_MARKERS = /\b(Universidad|University|Université|Universidade|Instituto|Institute|Institut|Tribunal|Court|Corte|Banco Central|Agencia|Agency|Agence|Comisión|Commission|Parlamento|Parliament|Parlement|Congreso|Congress|Senado|Senate|Hospital|Museo|Museum|Musée|Observatorio|Observatory|Autoridad|Authority|Fiscalía|Policía|Police|Ejército|Army)\b/
const COMPANY_MARKERS = /\b(S\.A\.|SA|S\.L\.|Inc|Inc\.|Corp|Corporation|Group|Grupo|Holdings?|Ltd|AG|GmbH|Technologies|Tech|Motors|Airlines|Airways|Energía|Energy|Telecom|Systems|Labs|Bank|Banco|Capital|Logistics|Logística|Pharma)\b/
const ORG_MARKERS = /\b(Fundación|Foundation|Fondation|Asociación|Association|Sindicato|Union|Consorcio|Consortium|Alianza|Alliance|ONG|NGO|Federación|Federation|Liga)\b/
const EVENT_MARKERS = /\b(Copa|Cup|Coupe|Mundial|World Cup|Juegos Olímpicos|Olympics|Grand Prix|Gran Premio|Open|Tour de|Liga de Campeones|Champions League|Eurocopa|Euro \d{4}|Cumbre|Summit|COP\d+)\b/
const PERSON_TITLES = /\b(presidente|presidenta|ministro|ministra|primer ministro|primera ministra|líder|lider|director|directora|portavoz|alcalde|alcaldesa|entrenador|jugador|jugadora|consejero delegado|secretario|secretaria|juez|jueza|fiscal|rey|reina|papa|sr\.|sra\.|president|minister|prime minister|leader|ceo|spokesperson|mayor|coach|player|judge|king|queen|mr\.|mrs\.|ms\.|dr\.)\s*$/i
const LOCATION_CUE = /\b(en|in|à|em|desde|from|cerca de|near)\s*$/i

const CAP_STOP = new Set(
  `El La Los Las Un Una Unos Unas Lo Al Del De En Por Para Con Sin Según Tras Este Esta Estos Estas Ese Esa Aquel Hoy Ayer Mañana Pero Y O Sin Como Cuando Donde Desde Hasta Ante
  The A An In On At By For With From After Before This That These Those Today Yesterday But And Or As When Where While However
  Le Les Des Une Un Dans Pour Avec Selon Après Avant Ce Cette Ces Aujourd Hier Mais Et Ou
  O Os As Um Uma Em Por Com Segundo Após Este Esta Hoje Ontem Mas E Ou
  Lunes Martes Miércoles Jueves Viernes Sábado Domingo Monday Tuesday Wednesday Thursday Friday Saturday Sunday
  Enero Febrero Marzo Abril Mayo Junio Julio Agosto Septiembre Octubre Noviembre Diciembre January February March April May June July August September October November December`.split(/\s+/)
)
const CONNECTORS = new Set(['de', 'del', 'la', 'las', 'los', 'of', 'the', 'y', 'and', 'da', 'do', 'dos', 'das', 'des', 'du', 'le', 'van', 'von', 'di'])
const CAP_WORD = /^[A-ZÁÉÍÓÚÑÀ-ÖØ-Þ][\p{L}\p{N}'’.&-]*$/u

function isAcronym(w) {
  return /^[A-ZÁÉÍÓÚÑ]{2,6}$/.test(w)
}

/** Tramos de palabras con mayúscula inicial (candidatos a nombre propio). */
function capitalizedSpans(sentence) {
  const words = sentence.split(/\s+/)
  const spans = []
  let i = 0
  let charPos = 0
  const positions = []
  for (const w of words) {
    const idx = sentence.indexOf(w, charPos)
    positions.push(idx)
    charPos = idx + w.length
  }
  while (i < words.length) {
    const clean = words[i].replace(/^[«"“'(¿¡]+|[»"”',.;:!?)]+$/g, '')
    if (!CAP_WORD.test(clean)) {
      i++
      continue
    }
    const parts = [clean]
    let j = i + 1
    while (j < words.length) {
      const w = words[j].replace(/^[«"“'(]+|[»"”',.;:!?)]+$/g, '')
      const endsPunct = /[,.;:!?)»"”]$/.test(words[j - 1])
      if (endsPunct) break
      if (CAP_WORD.test(w)) {
        parts.push(w)
        j++
      } else if (CONNECTORS.has(w.toLowerCase()) && j + 1 < words.length && CAP_WORD.test(words[j + 1].replace(/^[«"“'(]+|[»"”',.;:!?)]+$/g, ''))) {
        parts.push(w)
        j++
      } else break
    }
    while (parts.length && CAP_STOP.has(parts[0])) parts.shift()
    while (parts.length && CONNECTORS.has(parts[parts.length - 1].toLowerCase())) parts.pop()
    if (parts.length) {
      const text = parts.join(' ')
      const start = sentence.indexOf(text, positions[i])
      spans.push({ text, start, end: start + text.length, atSentenceStart: i === 0, words: parts.length })
    }
    i = j
  }
  return spans
}

function classifySpan(span, sentence) {
  const t = span.text
  const before = sentence.slice(Math.max(0, span.start - 40), span.start)
  if (EVENT_MARKERS.test(t)) return { type: 'sports_event', confidence: 75 }
  if (CLUB_MARKERS.test(t) && span.words >= 2) return { type: 'sports_team', confidence: 80 }
  if (PARTY_MARKERS.test(t)) return { type: 'political_party', confidence: 80 }
  if (GOV_MARKERS.test(t)) return { type: 'government', confidence: 80 }
  if (INSTITUTION_MARKERS.test(t)) return { type: 'institution', confidence: 75 }
  if (COMPANY_MARKERS.test(t)) return { type: 'company', confidence: 75 }
  if (ORG_MARKERS.test(t)) return { type: 'organization', confidence: 70 }
  if (span.words === 1 && isAcronym(t)) return { type: 'organization', confidence: 50 }
  if (span.words >= 2 && span.words <= 3 && t.split(' ').every((w) => /^[\p{Lu}][\p{Ll}'’-]+$/u.test(w))) {
    return { type: 'person', confidence: PERSON_TITLES.test(before) ? 80 : 60 }
  }
  if (LOCATION_CUE.test(before)) return { type: 'location', confidence: 55 }
  return { type: 'other', confidence: 45 }
}

let cityMatchers = null
function getCityMatchers() {
  cityMatchers ??= CITY_GAZETTEER.map((c) => ({
    city: c,
    re: new RegExp(`(?<![\\p{L}])(${[c.name, ...c.aliases].map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}])`, 'gu'),
  }))
  return cityMatchers
}

function countryEntityName(code) {
  try {
    return new Intl.DisplayNames(['es'], { type: 'region' }).of(code) || code
  } catch {
    return code
  }
}

function countryAliases(code) {
  const out = new Set()
  for (const l of ['en', 'fr', 'pt']) {
    try {
      const n = new Intl.DisplayNames([l], { type: 'region' }).of(code)
      if (n) out.add(n)
    } catch {
      /* sin Intl */
    }
  }
  return [...out]
}

/**
 * Extrae entidades de un artículo o grupo.
 * Devuelve [{ name, normalized_name, type, country_code, aliases, mentions, inTitle, confidence }]
 */
export function extractEntities({ title = '', text = '' }) {
  const full = `${title}\n${text}`
  const found = new Map()
  const add = (e, mentions = 1, inTitle = false) => {
    const key = normalizeEntityName(e.name)
    if (!key || key.length < 2) return
    const prev = found.get(key)
    if (prev) {
      prev.mentions += mentions
      prev.inTitle ||= inTitle
      prev.confidence = Math.max(prev.confidence, e.confidence)
      for (const a of e.aliases || []) if (!prev.aliases.includes(a)) prev.aliases.push(a)
      // tipo más específico gana sobre "other"/"location"
      if ((prev.type === 'other' || prev.type === 'location') && e.type !== 'other') prev.type = e.type
    } else {
      found.set(key, { name: e.name, normalized_name: key, type: e.type, country_code: e.country_code ?? null, aliases: [...(e.aliases || [])], mentions, inTitle, confidence: e.confidence })
    }
  }
  const titleFolded = foldAccents(title.toLowerCase())

  // 1. Organizaciones conocidas.
  for (const org of KNOWN_ORGS) {
    let n = 0
    for (const label of [org.name, ...org.aliases]) n += (foldAccents(full.toLowerCase()).match(new RegExp(`(?<![\\p{L}])${foldAccents(label.toLowerCase()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}])`, 'gu')) || []).length
    for (const ac of org.acronyms) n += (full.match(new RegExp(`(?<![\\p{L}])${ac}(?![\\p{L}])`, 'gu')) || []).length
    if (n) add({ name: org.name, type: org.type, aliases: [...org.aliases, ...org.acronyms], confidence: 90 }, n, [org.name, ...org.aliases].some((l) => titleFolded.includes(foldAccents(l.toLowerCase()))) || org.acronyms.some((a) => title.includes(a)))
  }

  // 2. Nombres propios por frase (equipos primero para resolver conflictos ciudad/club).
  const teamRanges = []
  const sentences = [title, ...splitSentences(text)]
  sentences.forEach((sentence, si) => {
    for (const span of capitalizedSpans(sentence)) {
      if (span.words === 1 && span.atSentenceStart && !isAcronym(span.text)) continue
      if (CAP_STOP.has(span.text)) continue
      const { type, confidence } = classifySpan(span, sentence)
      if (type === 'sports_team') teamRanges.push(span.text)
      add({ name: span.text, type, confidence }, 1, si === 0)
    }
  })

  // 3. Ciudades del gazetteer (si no forman parte del nombre de un equipo).
  for (const { city, re } of getCityMatchers()) {
    let count = 0
    for (const sentence of sentences) {
      const matches = [...sentence.matchAll(re)]
      for (const m of matches) {
        const insideTeam = teamRanges.some((team) => team.includes(m[1]) && sentence.includes(team))
        if (!insideTeam) count++
      }
    }
    if (count) add({ name: city.name, type: 'city', country_code: city.country, aliases: city.aliases, confidence: 90 }, count, sentences[0].includes(city.name))
  }

  // 4. Países.
  for (const { code } of detectCountries(full)) {
    add({ name: countryEntityName(code), type: 'country', country_code: code, aliases: countryAliases(code), confidence: 90 }, 1, detectCountries(title).some((c) => c.code === code))
  }

  // Limpieza: tramos "other" sueltos solo si se repiten o están en el titular.
  const knownCityNames = new Set(CITY_GAZETTEER.flatMap((c) => [c.name, ...c.aliases].map(normalizeEntityName)))
  return [...found.values()]
    .filter((e) => {
      if (e.type === 'other' && e.mentions < 2 && !e.inTitle) return false
      // un tramo genérico que coincide con una ciudad conocida se reclasifica como ciudad
      if (e.type !== 'city' && knownCityNames.has(e.normalized_name)) return false
      return true
    })
    .map((e) => ({ ...e, confidence: Math.min(95, e.confidence + Math.min(10, (e.mentions - 1) * 2)) }))
    .sort((a, b) => Number(b.inTitle) - Number(a.inTitle) || b.mentions - a.mentions || a.normalized_name.localeCompare(b.normalized_name))
}

export function roleFor(entity) {
  if (['country', 'city', 'location'].includes(entity.type)) return 'location'
  if (entity.inTitle) return 'subject'
  if (entity.type === 'person') return 'person'
  if (['organization', 'company', 'government', 'institution', 'political_party', 'sports_team'].includes(entity.type)) return 'organization'
  return 'mentioned'
}

/* ---------------- relaciones con evidencia explícita ---------------- */

const ORGISH = new Set(['organization', 'company', 'government', 'institution', 'political_party', 'sports_team', 'country'])
const REL_PATTERNS = [
  { type: 'leads', from: ['person'], to: ORGISH, re: /^,?\s*(?:el |la |the )?(?:presidente|presidenta|primer[ao]? ministr[ao]|líder|lider|director[a]?|ceo|consejer[oa] delegad[oa]|secretari[oa] general|entrenador[a]?|alcalde(?:sa)?|president|prime minister|leader|chief executive|head coach|coach|mayor)\s+(?:de la |del |de |of the |of |du |de l')?$/i },
  { type: 'member_of', from: ['person'], to: new Set(['sports_team', 'political_party', 'organization', 'institution']), re: /^,?\s*(?:el |la )?(?:jugador[a]?|miembro|diputad[oa]|militante|delantero|portero|defensa|player|member|striker|goalkeeper)\s+(?:de la |del |de |of the |of )?$/i },
  { type: 'located_in', from: ['city', 'location'], to: new Set(['country']), re: /^\s*(?:,|\(|,\s*en|\s+en|\s+in)\s*$/i },
  { type: 'opponent_of', from: ['sports_team'], to: new Set(['sports_team']), re: /^\s*(?:vs\.?|v\.?|contra|frente al?|ante|against|-|–|y)\s*(?:el |the )?$/i },
  { type: 'owns', from: ['company', 'organization', 'person'], to: new Set(['company', 'organization', 'sports_team']), re: /^\s*,?\s*(?:propietari[oa] de|dueñ[oa] de|owner of|matriz de|parent company of|compra|adquiere|acquires|buys)\s*(?:la |el |the )?$/i },
  { type: 'operates_in', from: ['company'], to: new Set(['country', 'city']), re: /^\s*,?\s*(?:opera en|operates in|presente en|con sede en|based in|headquartered in)\s*$/i },
  { type: 'participates_in', from: ['sports_team', 'person', 'country'], to: new Set(['sports_event']), re: /^\s*(?:en la|en el|in the|at the|participa en|competes in|disputa)\s*$/i },
  { type: 'affects', from: null, to: null, re: /^\s*(?:afecta a|affects|afectará a|golpea a|hits|azota)\s*(?:la |el |los |las |the )?$/i },
]

/** Relaciones solo cuando el texto entre dos entidades de una misma frase lo afirma. */
export function extractRelations(entities, { title = '', text = '' }) {
  const byName = entities.map((e) => ({ ...e, labels: [e.name, ...(e.aliases || [])] }))
  const out = new Map()
  for (const sentence of [title, ...splitSentences(text)]) {
    const present = []
    for (const e of byName) {
      for (const label of e.labels) {
        const idx = sentence.indexOf(label)
        if (idx >= 0) {
          present.push({ e, start: idx, end: idx + label.length })
          break
        }
      }
    }
    present.sort((a, b) => a.start - b.start)
    for (let i = 0; i < present.length; i++) {
      for (let j = i + 1; j < present.length; j++) {
        const A = present[i]
        const B = present[j]
        if (A.e.normalized_name === B.e.normalized_name) continue
        const between = sentence.slice(A.end, B.start)
        if (between.length > 60) continue
        for (const p of REL_PATTERNS) {
          if (p.from && !p.from.includes(A.e.type)) continue
          if (p.to && !p.to.has(B.e.type)) continue
          if (!p.re.test(between)) continue
          const key = `${A.e.normalized_name}|${p.type}|${B.e.normalized_name}`
          if (!out.has(key)) out.set(key, { source: A.e.normalized_name, target: B.e.normalized_name, relation_type: p.type, confidence: 75, evidence: sentence })
          break
        }
      }
    }
  }
  return [...out.values()]
}

/* ---------------- persistencia ---------------- */

/**
 * Persiste entidades, vínculos y relaciones de una Story.
 * `db` es el adaptador de entidades (SDK de Base44 o adaptador local).
 */
export async function persistEntities(db, { story, entities, relations, isDemo }) {
  if (!entities.length) return { entityIds: [], names: [] }
  const names = [...new Set(entities.map((e) => e.normalized_name))]
  const existing = await db.Entity.filter({ normalized_name: { $in: names } }, 'created_date', names.length * 2)
  const byNorm = new Map()
  for (const row of existing) if (!byNorm.has(row.normalized_name)) byNorm.set(row.normalized_name, row)

  const toCreate = entities.filter((e) => !byNorm.has(e.normalized_name))
  if (toCreate.length) {
    const created = await db.Entity.bulkCreate(
      toCreate.map((e) => ({
        name: e.name,
        normalized_name: e.normalized_name,
        type: e.type,
        country_code: e.country_code ?? null,
        aliases: e.aliases || [],
        description: null,
        external_id: null,
        external_source: null,
        is_demo: isDemo,
      }))
    )
    for (const row of created) byNorm.set(row.normalized_name, row)
  }
  // Alias nuevos (solo añadir; nunca sustituir datos existentes).
  for (const e of entities) {
    const row = byNorm.get(e.normalized_name)
    const missing = (e.aliases || []).filter((a) => !(row.aliases || []).includes(a))
    if (missing.length && row.id) {
      const updated = await db.Entity.update(row.id, { aliases: [...(row.aliases || []), ...missing] })
      byNorm.set(e.normalized_name, updated)
    }
  }

  const links = await db.StoryEntity.filter({ story_id: story.id }, undefined, 500)
  const linked = new Set(links.map((l) => l.entity_id))
  const newLinks = entities
    .map((e) => ({ e, row: byNorm.get(e.normalized_name) }))
    .filter(({ row }) => row && !linked.has(row.id))
    .map(({ e, row }) => ({
      story_id: story.id,
      entity_id: row.id,
      entity_name: row.name,
      entity_type: row.type,
      role: roleFor(e),
      confidence: e.confidence,
      first_seen_version: story.version ?? 1,
      is_demo: isDemo,
    }))
  if (newLinks.length) await db.StoryEntity.bulkCreate(newLinks)

  if (relations.length) {
    const ids = relations.map((r) => byNorm.get(r.source)?.id).filter(Boolean)
    const prev = ids.length ? await db.EntityRelation.filter({ source_entity_id: { $in: [...new Set(ids)] } }, undefined, 1000) : []
    const seen = new Set(prev.map((r) => `${r.source_entity_id}|${r.relation_type}|${r.target_entity_id}`))
    const rows = []
    for (const r of relations) {
      const s = byNorm.get(r.source)?.id
      const t = byNorm.get(r.target)?.id
      if (!s || !t || s === t) continue
      const key = `${s}|${r.relation_type}|${t}`
      if (seen.has(key)) continue
      seen.add(key)
      rows.push({ source_entity_id: s, target_entity_id: t, relation_type: r.relation_type, confidence: r.confidence, story_id: story.id, is_demo: isDemo })
    }
    if (rows.length) await db.EntityRelation.bulkCreate(rows)
  }

  const ordered = entities.map((e) => byNorm.get(e.normalized_name)).filter(Boolean)
  return { entityIds: ordered.map((r) => r.id), names: ordered.map((r) => r.name) }
}
