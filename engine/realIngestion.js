// RealNewsProvider: lee Source.is_active + feed_url (RSS/Atom) y produce NewsItems pendientes.
import { parseFeed } from './rss.js'
import { extractArticleText, extractPageImage } from './images.js'
import { cleanText } from './normalizer.js'

export const REAL_PROVIDER = 'RealNewsProvider'
const MIN_MINUTES_BETWEEN_FETCHES = 10

/** Texto del feed con la codificación que declara (cabecera HTTP o prólogo XML), no siempre UTF-8. */
export async function decodeBody(res) {
  const buf = new Uint8Array(await res.arrayBuffer())
  const header = (res.headers?.get?.('content-type') || '').match(/charset=([\w-]+)/i)?.[1]
  const head = new TextDecoder('latin1').decode(buf.slice(0, 300))
  const prolog = head.match(/encoding=["']([\w-]+)["']/i)?.[1]
  const charset = (prolog || header || 'utf-8').toLowerCase()
  try {
    return new TextDecoder(charset === 'iso-8859-1' || charset === 'latin1' ? 'windows-1252' : charset).decode(buf)
  } catch {
    return new TextDecoder('utf-8').decode(buf)
  }
}

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
        const entries = parseFeed(await decodeBody(res))
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
    /** Visita la página del artículo: su foto de portada (og:image) y su texto completo. */
    async fetchArticle(url) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 8000))
      try {
        const res = await fetchImpl(url, { headers: { 'user-agent': `Mozilla/5.0 (compatible; ${userAgent})`, accept: 'text/html' }, signal: controller.signal, redirect: 'follow' })
        if (!res.ok) return null
        const html = await decodeBody(res)
        return { image: extractPageImage(html, res.url || url), text: extractArticleText(html, cleanText) }
      } catch {
        return null
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
