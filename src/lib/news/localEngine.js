import { client } from '@/api/client'
import { createDataAdapter, seedDemo, cleanOldStories, maintainStories } from '../../../engine/brain.js'

/**
 * Ejecuta el motor en el navegador sobre el almacén de este dispositivo.
 * Aquí solo se generan datos DEMO: las noticias reales llegan por snapshot
 * (scripts/build-snapshot.mjs en GitHub Actions).
 */
function db() {
  return createDataAdapter(client.entities)
}

/** Ronda 1: primeras noticias. Ronda 2: evolución (fuentes nuevas, correcciones, última hora). */
export async function runDemoRound(round = 1) {
  return seedDemo(db(), { round })
}

/** Carga completa de demo: ronda 1 "hace 3 h" y ronda 2 ahora, para ver historias evolucionadas. */
export async function loadFullDemo() {
  const now = new Date()
  const r1 = await seedDemo(db(), { round: 1, now: new Date(now.getTime() - 3 * 3_600_000) })
  const r2 = await seedDemo(db(), { round: 2, now })
  return { r1, r2 }
}

export async function runMaintenance() {
  return maintainStories(db(), { isDemo: true })
}

export async function runCleanup(days = 30) {
  return cleanOldStories(db(), { days })
}
