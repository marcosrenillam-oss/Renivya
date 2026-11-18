#!/usr/bin/env node
/**
 * Genera las noticias que verá la app:
 *   public/data/snapshot.json  estado completo del motor (lo lee la próxima ejecución)
 *   public/data/app.json       versión ligera para el móvil (historias + traducciones)
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
import { appView } from '../engine/appView.js'
import { translateStories } from './translate-stories.mjs'
import { sendAlerts } from './notify.mjs'

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

const previous = DEMO_ONLY ? null : await loadPrevious()
const snapshot = await buildSnapshot({
  entities: createLocalClient({ memoryOnly: true }).entities,
  previous,
  provider: DEMO_ONLY ? null : createRealNewsProvider({ timeoutMs: 15000 }),
  log,
})
if (snapshot.mode === 'real') {
  await translateStories(snapshot.entities.Story, { log: (...a) => log(...a) })
  // Avisos de última hora (recuerda qué se ha avisado ya para no repetir).
  snapshot.notified = await sendAlerts(snapshot, { previousNotified: previous?.notified || [], log: (...a) => log(...a), appUrl: process.env.APP_URL })
}

mkdirSync(dirname(OUT), { recursive: true })
const json = JSON.stringify(snapshot)
writeFileSync(OUT, json)
const appOut = process.env.APP_DATA_OUT || OUT.replace(/snapshot\.json$/, 'app.json')
const appJson = JSON.stringify(appView(snapshot))
writeFileSync(appOut, appJson)
const kb = (t) => `${(Buffer.byteLength(t) / 1024).toFixed(0)} KB`
log(`escrito ${OUT} (${kb(json)}) y ${appOut} (${kb(appJson)}) · modo ${snapshot.mode} · ${snapshot.counts.Story} historias`)
