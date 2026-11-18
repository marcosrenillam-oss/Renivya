// Fotos de las noticias: URL limpias y absolutas, y la imagen de portada del artículo
// (og:image / twitter:image) cuando el feed no trae ninguna. Nunca se inventa una imagen.
import { decodeEntities } from './normalizer.js'

const NOT_PHOTO = /\.(mp4|mp3|m3u8|svg|gif)(\?|$)|(^|\/)(logo|favicon|sprite|placeholder|blank|pixel)[^/]*\.(png|jpe?g|webp)/i

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
