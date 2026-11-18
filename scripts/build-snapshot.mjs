#!/usr/bin/env node
/**
 * Genera public/data/snapshot.json con las noticias que verá la app.
 *
 *   node scripts/build-snapshot.mjs            # real: feeds RSS (si ninguno responde, demo)
 *   node scripts/build-snapshot.mjs --demo     # solo datos de demostración
 *
 * Variables de entorno:
 *   PREVIOUS_SNAPSHOT_URL  snapshot publicado anterior (para que las historias evolucionen)
 *   SNAPSHOT_OUT           ruta de salida (por defecto public/data/snapshot.json)
 *
 * Lo ejecuta cada hora GitHub Actions (.github/workflows/deploy.yml).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { createLocalClient } from '../src/api/localClient.js'
import { buildSnapshot } from '../engine/snapshot.js'
import { createRealNewsProvider } from '../engine/realIngestion.js'

const OUT = process.env.SNAPSHOT_OUT || 'public/data/snapshot.json'
const DEMO_ONLY = process.argv.includes('--demo')
const log = (...a) => console.log('[snapshot]', ...a)

async function loadPrevious() {
  const url = process.env.PREVIOUS_SNAPSHOT_URL
  if (url) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'cache-control': 'no-cache' } })
      if (res.ok) return await res.json()
      log('snapshot anterior no disponible:', res.status)
    } catch (e) {
      log('snapshot anterior no disponible:', e.message)
    }
  }
  if (existsSync(OUT)) {
    try {
      return JSON.parse(readFileSync(OUT, 'utf8'))
    } catch {
      /* archivo corrupto: empezar de cero */
    }
  }
  return null
}

const snapshot = await buildSnapshot({
  entities: createLocalClient({ memoryOnly: true }).entities,
  previous: DEMO_ONLY ? null : await loadPrevious(),
  provider: DEMO_ONLY ? null : createRealNewsProvider({ timeoutMs: 15000 }),
  log,
})
mkdirSync(dirname(OUT), { recursive: true })
const json = JSON.stringify(snapshot)
writeFileSync(OUT, json)
log(`escrito ${OUT} · modo ${snapshot.mode} · ${snapshot.counts.Story} historias · ${(Buffer.byteLength(json) / 1024).toFixed(0)} KB`)
