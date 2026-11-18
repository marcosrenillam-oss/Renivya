// Fotos de las noticias: URL limpias y absolutas, y la imagen de portada del artículo
// (og:image / twitter:image) cuando el feed no trae ninguna. Nunca se inventa una imagen.
import { decodeEntities } from './normalizer.js'

const NOT_PHOTO = /\.(mp4|mp3|m3u8|svg|gif|ico)(\?|$)|(^|[\/_-])(logo|logos|favicon|sprite|placeholder|blank|pixel|default|fallback|no[-_]?image|noimage|avatar|icon|brand|share[-_]?image|og[-_]?default|social[-_]?default)[^/]*\.(png|jpe?g|webp)/i

/** Absoluta, https y sin entidades HTML. null si no parece una foto. */
export function cleanImageUrl(raw, base = null) {
  if (!raw) return null
  let value = decodeEntities(String(raw).trim()).split(/\s+/)[0]
  if (value.startsWith('//')) value = `https:${value}`
  try {
    const u = new URL(value, base || undefined)
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
    u.protocol = 'https:'
    const out = u.toString()
    return NOT_PHOTO.test(out) ? null : out
  } catch {
    return null
  }
}

function metaContent(html, key) {
  const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`, 'i')
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, 'i')
  return html.match(re1)?.[1] || html.match(re2)?.[1] || null
}

/** Imagen de portada declarada por la página del artículo. */
export function extractPageImage(html, pageUrl) {
  const head = String(html || '').slice(0, 400_000)
  for (const key of ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']) {
    const url = cleanImageUrl(metaContent(head, key), pageUrl)
    if (url) return url
  }
  const link = head.match(/<link[^>]+rel=["']image_src["'][^>]*href=["']([^"']+)["']/i)?.[1]
  return cleanImageUrl(link, pageUrl)
}

/**
 * Fotos genéricas: la misma imagen en artículos distintos de historias distintas suele ser el
 * logotipo o la «foto por defecto» del medio, no una foto de la noticia. Devuelve esas URL.
 */
export function genericImageUrls(items, { minStories = 2 } = {}) {
  const seen = new Map()
  for (const it of items) {
    if (!it.image_url) continue
    const key = it.image_url
    if (!seen.has(key)) seen.set(key, new Set())
    seen.get(key).add(it.story_id || it.url || it.title)
  }
  return new Set([...seen.entries()].filter(([, owners]) => owners.size >= minStories).map(([url]) => url))
}

/** Objetos de datos estructurados (JSON-LD) de la página, aplanados (@graph, listas). */
function jsonLdObjects(html) {
  const out = []
  for (const m of String(html || '').matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1].trim())
      const stack = Array.isArray(data) ? [...data] : [data]
      while (stack.length) {
        const o = stack.shift()
        if (!o || typeof o !== 'object') continue
        out.push(o)
        if (Array.isArray(o['@graph'])) stack.push(...o['@graph'])
      }
    } catch {
      /* JSON-LD roto: se ignora */
    }
  }
  return out
}

const MAX_ARTICLE = 3200

/**
 * Texto del artículo: primero `articleBody` de los datos estructurados (lo publican casi todos
 * los periódicos); si no, los párrafos dentro de <article>. Limpio y recortado en una frase.
 */
export function extractArticleText(html, clean = (t) => t) {
  const body = jsonLdObjects(html).map((o) => o.articleBody).find((b) => typeof b === 'string' && b.length > 200)
  let text = body ? clean(body) : ''
  if (!text) {
    const scope = String(html || '').match(/<article[\s\S]*?<\/article>/i)?.[0] || ''
    const paras = [...scope.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => clean(m[1])).filter((p) => p.length > 60)
    text = paras.join('\n')
  }
  text = text.replace(/\s*\n\s*/g, '\n').trim()
  if (text.length > MAX_ARTICLE) {
    const cut = text.slice(0, MAX_ARTICLE)
    const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.\n'))
    text = end > 800 ? cut.slice(0, end + 1) : cut
  }
  return text.length >= 200 ? text : ''
}
