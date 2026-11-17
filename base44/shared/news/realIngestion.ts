// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// RealNewsProvider: lee Source.is_active + feed_url (RSS/Atom) y produce NewsItems pendientes.
import { parseFeed } from './rss.ts'

export const REAL_PROVIDER = 'RealNewsProvider'
const MIN_MINUTES_BETWEEN_FETCHES = 15

export function createRealNewsProvider({ fetchImpl = fetch, userAgent = 'RENIVYA-NewsBot/1.0', timeoutMs = 12000 } = {}) {
  return {
    name: REAL_PROVIDER,
    isDemo: false,
    /** Descarga un feed. Respeta un intervalo mínimo por fuente (last_fetched_at). */
    async fetchSource(source, now = new Date()) {
      if (!source.feed_url || source.is_active === false) return { items: [], skipped: 'inactive' }
      if (source.last_fetched_at && (now.getTime() - new Date(source.last_fetched_at).getTime()) / 60000 < MIN_MINUTES_BETWEEN_FETCHES) {
        return { items: [], skipped: 'rate_limited' }
      }
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetchImpl(source.feed_url, { headers: { 'user-agent': userAgent, accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml' }, signal: controller.signal })
        if (!res.ok) return { items: [], error: `HTTP ${res.status}` }
        const entries = parseFeed(await res.text())
        const retrieved = now.toISOString()
        return {
          items: entries.slice(0, 40).map((e) => ({
            provider: REAL_PROVIDER,
            source_name: source.name,
            url: e.url,
            title: e.title,
            description: e.description,
            content: e.content || e.description,
            author: e.author, // tal cual lo da el feed; null si no hay
            image_url: e.image_url,
            published_at: e.published_at || retrieved,
            retrieved_at: retrieved,
            language: source.language ?? null,
            country: source.country ?? null,
            status: 'pending',
            is_demo: false,
          })),
        }
      } catch (error) {
        return { items: [], error: String(error?.message || error) }
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
