/**
 * Contrato de un NewsProvider:
 *   { name: string, isDemo: boolean,
 *     fetch?(opts) → Promise<NewsItem[]>              (proveedores en lote, p. ej. demo)
 *     fetchSource?(source, now) → Promise<{ items, error?, skipped? }>   (proveedores por fuente, p. ej. RSS) }
 * Todo NewsItem producido lleva is_demo y status 'pending'. Nunca se inventa autor ni imagen.
 */
export { createMockNewsProvider } from './MockNewsProvider.js'
export { createRealNewsProvider } from './RealNewsProvider.js'
