// Punto de entrada del motor en el frontend.
export * from './scoring.js'
export * from './classifier.js'
export { buildDigest, personalBoost, passesHardFilters } from './digestService.js'
export { buildWorldReport } from './worldMapService.js'
export { loadEntityGraph, layoutGraph } from './networkService.js'
export { loadAnalytics } from './analyticsService.js'
export { runDemoRound, loadFullDemo, runMaintenance, runCleanup } from './localEngine.js'
