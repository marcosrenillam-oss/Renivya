// Paso 2: representación semántica determinista (tokens, conceptos multilingües, firma).
import { foldAccents } from './normalizer.ts'

const STOP = `
a al algo algunos ante antes aquel aqui asi aun cada como con contra cual cuando de del desde donde dos durante e el ella ellos en entre era es esa ese eso esta estan este esto estos fue fueron ha habia han hasta hay la las le les lo los mas me mientras muy ni no nos o otra otro para pero poco por porque que quien se segun ser si sido sin sobre son su sus tambien tan tanto te tiene tienen todo todos tras tu un una uno unos ya yo
about after again all also an and any are as at be because been before being between both but by can could did do does doing during each few for from further had has have having he her here hers him his how i if in into is it its just more most my no nor not now of off on once only or other our out over own same she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your said says
au aux avec ce ces dans des du elle en est et eux il ils je la le les leur lui ma mais me meme mes moi mon ne nos notre nous on ou par pas pour qu que qui sa se ses son sur ta te tes toi ton tu un une vos votre vous ete etre fait plus selon apres
ao aos as com como da das de do dos e ela ele eles em entre era essa esse esta este foi ha isso mais mas na nas no nos o os ou para pela pelo por que se sem ser seu sua suas seus tambem um uma foram apos segundo
der die das und ist nicht mit auf fur ein eine den von zu sich dem nach wurde auch bei
il lo gli della che per con una non sono nel alla dei anche questo stato piu
`.split(/\s+/).filter(Boolean)
export const STOPWORDS = new Set(STOP)

/**
 * Léxico de conceptos: raíces multilingües → id de concepto.
 * Permite que artículos en distintos idiomas compartan rasgos sin LLM.
 */
const CONCEPTS = {
  election: ['eleccion', 'elecciones', 'electoral', 'election', 'elections', 'eleicao', 'eleicoes', 'votacion', 'vote', 'voto', 'votos', 'scrutin', 'urnas', 'ballot'],
  government: ['gobierno', 'government', 'gouvernement', 'governo', 'ejecutivo', 'cabinet', 'gabinete'],
  president: ['presidente', 'president', 'presidenta', 'presidencia', 'presidency', 'presidence'],
  minister: ['ministro', 'ministra', 'minister', 'ministre', 'ministerio', 'ministry', 'ministere'],
  parliament: ['parlamento', 'parliament', 'parlement', 'congreso', 'congress', 'senado', 'senate', 'senat', 'diputados', 'asamblea', 'assembly', 'assemblee'],
  law: ['ley', 'law', 'loi', 'lei', 'legislacion', 'legislation', 'normativa', 'regulation', 'reglamento', 'regulacion', 'reglement', 'regulamento'],
  agreement: ['acuerdo', 'agreement', 'accord', 'acordo', 'pacto', 'pact', 'deal', 'tratado', 'treaty', 'traite'],
  negotiation: ['negociacion', 'negociaciones', 'negotiation', 'negotiations', 'talks', 'conversaciones', 'pourparlers', 'negociacoes'],
  war: ['guerra', 'war', 'guerre', 'conflicto', 'conflict', 'conflit', 'ofensiva', 'offensive'],
  attack: ['ataque', 'attack', 'attaque', 'atentado', 'bombardeo', 'bombing', 'strike', 'ataques', 'attacks'],
  ceasefire: ['tregua', 'ceasefire', 'cessez', 'cessar', 'alto el fuego', 'armisticio'],
  military: ['ejercito', 'army', 'armee', 'exercito', 'militar', 'military', 'militaire', 'tropas', 'troops', 'soldados', 'soldiers'],
  death: ['muertos', 'muertes', 'fallecidos', 'dead', 'deaths', 'killed', 'morts', 'mortos', 'victimas', 'victims', 'victimes', 'vitimas'],
  injured: ['heridos', 'injured', 'wounded', 'blesses', 'feridos'],
  earthquake: ['terremoto', 'earthquake', 'seisme', 'sismo', 'tremblement'],
  flood: ['inundacion', 'inundaciones', 'flood', 'floods', 'flooding', 'inondation', 'inondations', 'cheias', 'riada', 'dana'],
  fire: ['incendio', 'incendios', 'wildfire', 'fire', 'fires', 'incendie', 'incendies', 'fogo'],
  storm: ['tormenta', 'storm', 'tempete', 'tempestade', 'huracan', 'hurricane', 'ouragan', 'tifon', 'typhoon', 'cyclone', 'ciclon', 'borrasca'],
  climate: ['clima', 'climatico', 'climate', 'climat', 'climatique', 'calentamiento', 'warming', 'emisiones', 'emissions', 'carbono', 'carbon'],
  energy: ['energia', 'energy', 'energie', 'electricidad', 'electricity', 'electricite', 'renovable', 'renewable', 'renouvelable', 'solar', 'eolica', 'wind'],
  oil: ['petroleo', 'oil', 'petrole', 'crudo', 'crude', 'brent', 'gas', 'opep', 'opec'],
  economy: ['economia', 'economy', 'economie', 'economico', 'economic', 'economique', 'pib', 'gdp'],
  inflation: ['inflacion', 'inflation', 'inflacao', 'precios', 'prices', 'prix', 'ipc', 'cpi'],
  interest_rates: ['tipos de interes', 'interest rates', 'taux', 'juros', 'tipos', 'rates', 'bce', 'ecb', 'fed'],
  central_bank: ['banco central', 'central bank', 'banque centrale', 'reserva federal', 'federal reserve'],
  market: ['bolsa', 'mercado', 'mercados', 'market', 'markets', 'marche', 'marches', 'stocks', 'acciones', 'bourse', 'ibex', 'nasdaq', 'wall street'],
  company: ['empresa', 'empresas', 'company', 'companies', 'entreprise', 'compania', 'firma', 'corporation', 'grupo'],
  profit: ['beneficio', 'beneficios', 'profit', 'profits', 'benefice', 'lucro', 'ganancias', 'earnings', 'resultados'],
  jobs: ['empleo', 'paro', 'desempleo', 'jobs', 'unemployment', 'emploi', 'chomage', 'desemprego', 'trabajadores', 'workers'],
  strike_labor: ['huelga', 'huelgas', 'strike', 'greve', 'paro laboral', 'walkout'],
  tariff: ['arancel', 'aranceles', 'tariff', 'tariffs', 'droits de douane', 'tarifas', 'comercio', 'trade', 'commerce'],
  technology: ['tecnologia', 'technology', 'technologie', 'tecnologica', 'digital', 'software', 'chip', 'chips', 'semiconductores', 'semiconductors'],
  ai: ['inteligencia artificial', 'artificial intelligence', 'intelligence artificielle', 'ia', 'ai', 'chatbot', 'modelo de lenguaje', 'language model', 'llm', 'aprendizaje automatico', 'machine learning'],
  cyber: ['ciberataque', 'cyberattack', 'ciberseguridad', 'cybersecurity', 'hackers', 'ransomware', 'cyberattaque'],
  space: ['espacio', 'espacial', 'space', 'spatial', 'satelite', 'satellite', 'cohete', 'rocket', 'nasa', 'esa', 'luna', 'moon', 'marte', 'mars'],
  science: ['cientificos', 'scientists', 'scientifiques', 'investigadores', 'researchers', 'estudio', 'study', 'etude', 'investigacion', 'research', 'recherche'],
  health: ['salud', 'health', 'sante', 'saude', 'sanitario', 'hospital', 'hospitales', 'hospitals', 'medicos', 'doctors', 'pacientes', 'patients'],
  disease: ['virus', 'brote', 'outbreak', 'epidemia', 'epidemic', 'pandemia', 'pandemic', 'enfermedad', 'disease', 'maladie', 'doenca', 'vacuna', 'vaccine', 'vaccin'],
  migration: ['migrantes', 'migrants', 'inmigracion', 'immigration', 'refugiados', 'refugees', 'refugies', 'asilo', 'asylum', 'frontera', 'border', 'frontiere'],
  justice: ['tribunal', 'court', 'juez', 'judge', 'juge', 'juicio', 'trial', 'proces', 'sentencia', 'ruling', 'verdict', 'condena', 'fiscal', 'prosecutor', 'fiscalia'],
  police: ['policia', 'police', 'detenidos', 'arrested', 'arrestation', 'detencion', 'arrest', 'investigacion policial'],
  corruption: ['corrupcion', 'corruption', 'corrupcao', 'soborno', 'bribery', 'fraude', 'fraud'],
  protest: ['protesta', 'protestas', 'protest', 'protests', 'manifestacion', 'manifestation', 'manifestantes', 'protesters', 'manifestacao'],
  football: ['futbol', 'football', 'soccer', 'futebol', 'gol', 'goles', 'goal', 'goals', 'but', 'liga', 'league', 'champions', 'partido', 'match', 'estadio', 'stadium'],
  sport: ['deporte', 'sport', 'sports', 'desporto', 'campeonato', 'championship', 'olimpicos', 'olympic', 'olympiques', 'medalla', 'medal', 'torneo', 'tournament'],
  culture: ['cultura', 'culture', 'museo', 'museum', 'musee', 'exposicion', 'exhibition', 'libro', 'book', 'livre', 'novela', 'novel', 'arte', 'art'],
  film: ['pelicula', 'film', 'movie', 'cine', 'cinema', 'festival', 'serie', 'series', 'oscar', 'oscars', 'actor', 'actriz', 'actress'],
  music: ['musica', 'music', 'musique', 'concierto', 'concert', 'album', 'cancion', 'song', 'gira', 'tour'],
  tourism: ['turismo', 'tourism', 'tourisme', 'turistas', 'tourists', 'viajeros', 'travellers', 'aerolinea', 'airline', 'vuelos', 'flights', 'vols', 'aeropuerto', 'airport'],
  education: ['educacion', 'education', 'escuela', 'school', 'ecole', 'universidad', 'university', 'universite', 'estudiantes', 'students'],
  housing: ['vivienda', 'housing', 'logement', 'alquiler', 'rent', 'loyer', 'hipoteca', 'mortgage'],
  port: ['puerto', 'port', 'porto', 'portuario', 'naviera', 'shipping', 'contenedores', 'containers'],
  transport: ['transporte', 'transport', 'tren', 'train', 'ferrocarril', 'railway', 'metro', 'carretera', 'road', 'autobus'],
  water: ['agua', 'water', 'eau', 'sequia', 'drought', 'secheresse', 'seca', 'embalse', 'reservoir'],
  resolution: ['resuelto', 'resolved', 'concluye', 'concluded', 'fin', 'end', 'ends', 'termina', 'finaliza', 'final'],
}

const conceptIndex = new Map()
const conceptPhrases = []
for (const [concept, terms] of Object.entries(CONCEPTS)) {
  for (const t of terms) {
    const folded = foldAccents(t.toLowerCase())
    if (folded.includes(' ')) conceptPhrases.push([folded, concept])
    else conceptIndex.set(folded, concept)
  }
}

/** Raíz ligera multilingüe (plurales y sufijos frecuentes). */
export function lightStem(token) {
  let t = token
  if (t.length > 6) t = t.replace(/(mente|ement|ments|ciones|cions|ções|coes|sions|tions)$/, '')
  if (t.length > 4) t = t.replace(/(es|s)$/, '')
  return t
}

/** Tokens normalizados (minúsculas, sin acentos, sin palabras vacías). */
export function tokenize(text) {
  const folded = foldAccents(String(text || '').toLowerCase())
  return (folded.match(/[a-z0-9][a-z0-9'-]*[a-z0-9]|[a-z]/g) || [])
    .map((t) => t.replace(/^[l|d]'/, '').replace(/'s$/, ''))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t) && !/^\d+$/.test(t))
}

/** Conceptos multilingües presentes en el texto (con repeticiones). */
export function extractConcepts(text) {
  const folded = ` ${foldAccents(String(text || '').toLowerCase()).replace(/[^a-z0-9 ]+/g, ' ')} `
  const out = []
  for (const [phrase, concept] of conceptPhrases) if (folded.includes(` ${phrase} `)) out.push(concept)
  for (const tok of folded.split(/\s+/)) {
    const c = conceptIndex.get(tok)
    if (c) out.push(c)
  }
  return out
}

/** Palabras clave por frecuencia (título pesa doble). */
export function extractKeywords(title, body, n = 8) {
  const freq = new Map()
  for (const t of tokenize(title)) freq.set(t, (freq.get(t) || 0) + 2)
  for (const t of tokenize(body).slice(0, 800)) freq.set(t, (freq.get(t) || 0) + 1)
  return [...freq.entries()]
    .filter(([t]) => t.length >= 4)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, n)
    .map(([t]) => t)
}

/** Firma semántica legible: conceptos + raíces dominantes, ordenados. */
export function semanticSignature(title, body, entityNames = []) {
  const concepts = [...new Set(extractConcepts(`${title} ${body}`))].slice(0, 6).map((c) => `c:${c}`)
  const ents = entityNames.slice(0, 4).map((e) => `e:${foldAccents(e.toLowerCase())}`)
  const kws = extractKeywords(title, body, 6).map(lightStem)
  return [...new Set([...concepts, ...ents, ...kws])].sort().join('|')
}

export function jaccard(a, b) {
  const A = a instanceof Set ? a : new Set(a)
  const B = b instanceof Set ? b : new Set(b)
  if (!A.size && !B.size) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return inter / (A.size + B.size - inter)
}

export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0
}

/** Shingles de palabras (para detectar cables copiados entre medios). */
export function shingles(text, size = 4) {
  const toks = foldAccents(String(text || '').toLowerCase()).match(/[a-z0-9]+/g) || []
  const out = new Set()
  for (let i = 0; i + size <= toks.length; i++) out.add(toks.slice(i, i + size).join(' '))
  return out
}
