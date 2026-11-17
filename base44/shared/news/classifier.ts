// Clasificador de categorías DETERMINISTA y multilingüe. Tiene prioridad sobre cualquier LLM:
// el LLM solo puede sugerir categoría cuando aquí no hay señal (method === 'fallback').
import { foldAccents } from './normalizer.ts'

export const CATEGORY_ORDER = [
  'artificial_intelligence', 'football', 'politics', 'economy', 'business', 'technology', 'science',
  'health', 'environment', 'sports', 'culture', 'entertainment', 'travel', 'society', 'world',
]

/** Léxico ponderado: [término (sin acentos, minúsculas), peso]. Frases con espacios permitidas. */
const LEXICON = {
  artificial_intelligence: [
    ['inteligencia artificial', 5], ['artificial intelligence', 5], ['intelligence artificielle', 5], ['ia generativa', 5], ['generative ai', 5],
    ['chatbot', 3], ['modelo de lenguaje', 4], ['language model', 4], ['llm', 4], ['machine learning', 4], ['aprendizaje automatico', 4],
    ['red neuronal', 3], ['neural network', 3], ['openai', 4], ['deepmind', 4], ['algoritmo', 1], ['ai act', 5], ['ley de ia', 5],
  ],
  football: [
    ['futbol', 4], ['football', 3], ['soccer', 4], ['futebol', 4], ['laliga', 5], ['la liga', 4], ['premier league', 5], ['champions', 4],
    ['champions league', 5], ['uefa', 4], ['fifa', 4], ['mundial de clubes', 5], ['gol', 2], ['goles', 2], ['goal', 1], ['delantero', 3],
    ['striker', 3], ['entrenador', 2], ['penalti', 3], ['penalty', 2], ['derbi', 3], ['derby', 2], ['estadio', 1], ['fichaje', 4], ['transfer', 1],
  ],
  politics: [
    ['elecciones', 4], ['election', 4], ['elections', 4], ['electoral', 3], ['eleicoes', 4], ['parlamento', 3], ['parliament', 3], ['congreso', 3],
    ['senado', 3], ['gobierno', 2], ['government', 2], ['gouvernement', 2], ['presidente', 2], ['primer ministro', 4], ['prime minister', 4],
    ['partido', 1], ['oposicion', 3], ['opposition', 3], ['coalicion', 3], ['coalition', 3], ['votacion', 3], ['ley', 1], ['decreto', 2], ['diputados', 3],
    ['cumbre', 2], ['summit', 2], ['diplomatico', 3], ['diplomatic', 3], ['sanciones', 3], ['sanctions', 3], ['referendum', 4], ['moción de censura', 5],
  ],
  economy: [
    ['economia', 4], ['economy', 4], ['economie', 4], ['inflacion', 5], ['inflation', 5], ['pib', 5], ['gdp', 5], ['tipos de interes', 5],
    ['interest rates', 5], ['banco central', 5], ['central bank', 5], ['bce', 4], ['ecb', 4], ['reserva federal', 5], ['federal reserve', 5],
    ['desempleo', 4], ['unemployment', 4], ['paro', 2], ['deuda', 3], ['debt', 3], ['presupuestos', 3], ['budget', 2], ['aranceles', 4],
    ['tariffs', 4], ['recesion', 5], ['recession', 5], ['mercados', 2], ['bolsa', 3], ['euribor', 5], ['fmi', 4], ['imf', 4], ['impuestos', 2], ['taxes', 2],
  ],
  business: [
    ['empresa', 2], ['company', 2], ['beneficio', 3], ['beneficios', 3], ['profit', 3], ['ingresos', 2], ['revenue', 3], ['fusion', 3], ['merger', 4],
    ['adquisicion', 3], ['acquisition', 4], ['opa', 4], ['takeover', 4], ['consejero delegado', 4], ['ceo', 3], ['accionistas', 3], ['shareholders', 3],
    ['resultados trimestrales', 5], ['quarterly results', 5], ['startup', 3], ['salida a bolsa', 5], ['ipo', 4], ['despidos', 2], ['layoffs', 3],
  ],
  technology: [
    ['tecnologia', 3], ['technology', 3], ['technologie', 3], ['software', 3], ['smartphone', 4], ['iphone', 4], ['android', 3], ['semiconductores', 5],
    ['semiconductors', 5], ['chips', 3], ['ciberataque', 4], ['cyberattack', 4], ['ciberseguridad', 4], ['cybersecurity', 4], ['hackers', 3],
    ['internet', 2], ['redes sociales', 3], ['social media', 3], ['app', 1], ['5g', 3], ['quantum', 3], ['cuantica', 3], ['apple', 2], ['google', 2], ['microsoft', 2],
  ],
  science: [
    ['cientificos', 4], ['scientists', 4], ['scientifiques', 4], ['investigadores', 3], ['researchers', 3], ['estudio publicado', 4], ['study published', 4],
    ['revista nature', 5], ['nature', 1], ['science', 1], ['descubrimiento', 3], ['discovery', 3], ['nasa', 4], ['esa', 2], ['telescopio', 4], ['telescope', 4],
    ['astronomos', 4], ['astronomers', 4], ['especie', 2], ['species', 2], ['fosil', 4], ['fossil', 4], ['genoma', 4], ['genome', 4], ['mision espacial', 5], ['space mission', 5],
  ],
  health: [
    ['salud', 3], ['health', 3], ['sante', 3], ['hospital', 3], ['hospitales', 3], ['pacientes', 3], ['patients', 3], ['virus', 3], ['vacuna', 4],
    ['vaccine', 4], ['brote', 4], ['outbreak', 4], ['epidemia', 4], ['pandemia', 4], ['pandemic', 4], ['oms', 4], ['who', 1], ['cancer', 4],
    ['enfermedad', 3], ['disease', 3], ['medicamento', 4], ['drug', 1], ['sanidad', 4], ['tratamiento', 2], ['treatment', 2],
  ],
  environment: [
    ['clima', 3], ['climate', 4], ['climatico', 4], ['cambio climatico', 5], ['climate change', 5], ['emisiones', 4], ['emissions', 4], ['co2', 4],
    ['sequia', 4], ['drought', 4], ['incendio forestal', 5], ['wildfire', 5], ['inundaciones', 4], ['floods', 4], ['biodiversidad', 5], ['biodiversity', 5],
    ['contaminacion', 4], ['pollution', 4], ['renovables', 3], ['renewable', 3], ['cop', 2], ['ola de calor', 5], ['heatwave', 5], ['deforestacion', 5], ['oceano', 2],
  ],
  sports: [
    ['deporte', 3], ['sport', 2], ['sports', 3], ['tenis', 4], ['tennis', 4], ['baloncesto', 4], ['basketball', 4], ['nba', 4], ['formula 1', 5],
    ['formula one', 5], ['f1', 3], ['ciclismo', 4], ['cycling', 4], ['tour de france', 5], ['juegos olimpicos', 5], ['olympics', 5], ['atletismo', 4],
    ['athletics', 4], ['medalla', 3], ['medal', 3], ['campeonato', 2], ['championship', 2], ['motogp', 5], ['golf', 3], ['rugby', 4],
  ],
  culture: [
    ['cultura', 3], ['culture', 3], ['museo', 4], ['museum', 4], ['exposicion', 3], ['exhibition', 3], ['libro', 3], ['book', 2], ['novela', 4], ['novel', 3],
    ['premio nobel de literatura', 5], ['escritor', 3], ['writer', 3], ['arte', 2], ['pintura', 3], ['teatro', 3], ['theatre', 3], ['patrimonio', 3], ['heritage', 3],
  ],
  entertainment: [
    ['pelicula', 4], ['film', 2], ['movie', 4], ['cine', 3], ['cinema', 3], ['serie', 2], ['netflix', 4], ['hollywood', 4], ['oscar', 4], ['oscars', 4],
    ['festival', 2], ['concierto', 3], ['concert', 3], ['album', 3], ['cantante', 3], ['singer', 3], ['actor', 2], ['actriz', 3], ['actress', 3], ['gira', 2], ['taquilla', 4], ['box office', 4],
  ],
  travel: [
    ['turismo', 4], ['tourism', 4], ['turistas', 4], ['tourists', 4], ['viajeros', 3], ['travellers', 3], ['aerolinea', 3], ['airline', 3], ['vuelos', 3],
    ['flights', 3], ['aeropuerto', 2], ['airport', 2], ['hotel', 3], ['destino', 2], ['destination', 2], ['crucero', 4], ['cruise', 4], ['visado', 3], ['visa', 2],
  ],
  society: [
    ['sociedad', 3], ['society', 2], ['vivienda', 3], ['housing', 3], ['educacion', 3], ['education', 3], ['escuela', 2], ['school', 2], ['inmigracion', 3],
    ['immigration', 3], ['migrantes', 3], ['migrants', 3], ['igualdad', 3], ['equality', 3], ['violencia de genero', 5], ['pensiones', 3], ['pensions', 3],
    ['protesta', 2], ['protest', 2], ['huelga', 3], ['strike', 1], ['tribunal', 2], ['court', 2], ['policia', 2], ['police', 2], ['sucesos', 3],
  ],
  world: [
    ['internacional', 2], ['international', 2], ['onu', 4], ['united nations', 4], ['naciones unidas', 4], ['otan', 4], ['nato', 4], ['guerra', 4],
    ['war', 4], ['conflicto', 3], ['conflict', 3], ['refugiados', 3], ['refugees', 3], ['frontera', 2], ['border', 2], ['ataque', 2], ['attack', 2],
    ['tregua', 4], ['ceasefire', 4], ['embajada', 3], ['embassy', 3], ['crisis humanitaria', 5], ['humanitarian', 3],
  ],
}

const COMPILED = Object.fromEntries(
  Object.entries(LEXICON).map(([cat, terms]) => [
    cat,
    terms.map(([term, weight]) => ({ weight, re: new RegExp(`(?<![a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z0-9])`, 'g') })),
  ])
)

/**
 * Clasifica un texto. Título ×2. Devuelve { category, method, scores, margin }.
 * method: 'lexicon' (señal clara) | 'fallback' (sin señal suficiente).
 */
export function classifyCategory({ title = '', text = '', countries = [] }) {
  const t = foldAccents(String(title).toLowerCase())
  const b = foldAccents(String(text).toLowerCase()).slice(0, 6000)
  const scores = {}
  for (const [cat, terms] of Object.entries(COMPILED)) {
    let s = 0
    for (const { re, weight } of terms) {
      const inTitle = (t.match(re) || []).length
      const inBody = Math.min((b.match(re) || []).length, 3)
      s += weight * (inTitle * 2 + inBody)
    }
    scores[cat] = s
  }
  const ranked = CATEGORY_ORDER.map((c) => [c, scores[c] || 0]).sort((a, b2) => b2[1] - a[1])
  const [best, bestScore] = ranked[0]
  const second = ranked[1][1]
  if (bestScore < 4) {
    return { category: countries.length > 1 ? 'world' : 'society', method: 'fallback', scores, margin: 0 }
  }
  return { category: best, method: 'lexicon', scores, margin: bestScore - second }
}

/** Clasificación de un grupo de artículos: suma de puntuaciones de todos los miembros. */
export function classifyCluster(docs, countries = []) {
  const total = {}
  for (const d of docs) {
    const { scores } = classifyCategory(d)
    for (const [k, v] of Object.entries(scores)) total[k] = (total[k] || 0) + v
  }
  const ranked = CATEGORY_ORDER.map((c) => [c, total[c] || 0]).sort((a, b) => b[1] - a[1])
  if (!ranked.length || ranked[0][1] < 4 * Math.max(1, docs.length * 0.5)) {
    return { category: countries.length > 1 ? 'world' : 'society', method: 'fallback', scores: total }
  }
  return { category: ranked[0][0], method: 'lexicon', scores: total }
}
