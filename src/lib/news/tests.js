/**
 * Autotest del motor ejecutable desde el navegador (página Brain).
 * Corre sobre un cliente local EN MEMORIA: no toca los datos del usuario.
 */
import { createLocalClient } from '@/api/localClient'
import { createDataAdapter, seedDemo } from '../../../base44/shared/news/brain.ts'
import { classifyCategory } from '../../../base44/shared/news/classifier.ts'
import { computeConfidence, computeScore, SCORE_WEIGHTS } from '../../../base44/shared/news/scoring.ts'
import { canonicalUrl, detectCountries, detectLanguage } from '../../../base44/shared/news/normalizer.ts'
import { normalizeEntityName } from '../../../base44/shared/news/entities.ts'

function check(name, fn) {
  const started = performance.now()
  return Promise.resolve()
    .then(fn)
    .then(
      (detail) => ({ name, ok: true, detail: detail ?? null, ms: Math.round(performance.now() - started) }),
      (error) => ({ name, ok: false, detail: String(error?.message || error), ms: Math.round(performance.now() - started) })
    )
}

function assert(cond, message) {
  if (!cond) throw new Error(message)
}

export async function runEngineTests() {
  return Promise.all([
    check('Pesos del SCORE (confianza = 5 %)', () => {
      const total = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0)
      assert(Math.abs(total - 1) < 1e-9 && SCORE_WEIGHTS.confidence_context === 0.05, 'pesos incorrectos')
    }),
    check('Clasificador determinista multilingüe', () => {
      const cases = [
        ['El Real Valmar CF gana la final de la Copa', 'football'],
        ['Lumen Labs lance un modèle d’intelligence artificielle', 'artificial_intelligence'],
        ['Earthquake strikes southern Chile', 'world'],
      ]
      for (const [title, expected] of cases) assert(classifyCategory({ title }).category === expected, `${title} → ${classifyCategory({ title }).category}`)
      return `${cases.length} casos`
    }),
    check('Normalización (URL, idioma, país)', () => {
      assert(canonicalUrl('http://www.a.com/x/?utm_source=1') === 'https://a.com/x', 'URL canónica')
      assert(detectLanguage('Les inondations ont fait au moins 18 morts selon les autorités').language === 'fr', 'idioma')
      assert(detectCountries('El equipo gana en Sevilla')[0]?.code === 'ES', 'país (sin falso Ghana)')
      assert(normalizeEntityName('Real Valmar C.F.') === 'real valmar cf', 'normalized_name')
    }),
    check('SCORE y CONFIDENCE independientes', () => {
      const analysis = { independentSources: 3, totalSources: 3, factStats: { confirmed: 2, reported: 1, unconfirmed: 0, disputed: 0 }, agreementRatio: 90, majorContradictions: 0, minorDiscrepancies: 0, primarySource: { found: true } }
      const now = new Date()
      const first = new Date(now - 5 * 3600e3).toISOString()
      const a = computeScore({ category: 'world', countries: ['KE'], languages: ['en'], analysis, text: '', confidence: 95, firstPublishedAt: first, now })
      const b = computeScore({ category: 'world', countries: ['KE'], languages: ['en'], analysis, text: '', confidence: 5, firstPublishedAt: first, now })
      assert(a.score - b.score <= 5, 'la confianza domina el SCORE')
      const c1 = computeConfidence({ analysis, languages: ['en'], firstPublishedAt: first, now })
      const c2 = computeConfidence({ analysis: { ...analysis, majorContradictions: 2 }, languages: ['en'], firstPublishedAt: first, now })
      assert(c2.confidence < c1.confidence, 'las contradicciones no restan confianza')
      return `SCORE ${a.score} · confianza ${c1.confidence} → ${c2.confidence}`
    }),
    check('Pipeline completo y evolución (demo en memoria)', async () => {
      const db = createDataAdapter(createLocalClient({ memoryOnly: true }).entities)
      const now = new Date()
      await seedDemo(db, { round: 1, now: new Date(now - 3 * 3600e3) })
      const r2 = await seedDemo(db, { round: 2, now })
      assert(!r2.stats.errors.length, r2.stats.errors.join('; '))
      const stories = await db.Story.list()
      const bumped = stories.filter((s) => s.version > 1).length
      const entities = await db.Entity.list()
      assert(new Set(entities.map((e) => e.normalized_name)).size === entities.length, 'entidades duplicadas')
      assert(stories.every((s) => s.is_demo), 'demo sin is_demo')
      return `${stories.length} historias · ${bumped} con nueva versión · ${entities.length} entidades`
    }),
  ])
}
