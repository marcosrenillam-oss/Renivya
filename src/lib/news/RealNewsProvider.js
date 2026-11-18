// Proveedor real por RSS/Atom (se ejecuta en backend: los feeds no admiten CORS).
export { createRealNewsProvider, REAL_PROVIDER } from '../../../engine/realIngestion.js'
export { parseFeed } from '../../../engine/rss.js'
export { REAL_SOURCES } from '../../../engine/sourceCatalog.js'
