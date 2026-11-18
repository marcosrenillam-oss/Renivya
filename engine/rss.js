// Parser RSS 2.0 / RDF / Atom sin dependencias (Deno no trae DOMParser). Determinista.
import { decodeEntities, stripHtml } from './normalizer.js'
import { cleanImageUrl } from './images.js'

function tag(block, name) {
  const re = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, 'i')
  const m = block.match(re)
  return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : null
}

function attr(block, name, attribute) {
  const re = new RegExp(`<${name}\\s[^>]*${attribute}=["']([^"']+)["'][^>]*\\/?>`, 'i')
  const m = block.match(re)
  return m ? decodeEntities(m[1]) : null
}

function allBlocks(xml, name) {
  return xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${name}>`, 'gi')) || []
}

function toIso(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

/** Imagen del feed: enclosure de imagen, media:content/thumbnail (también dentro de media:group),
 *  <image>, itunes:image o la primera <img> del HTML. Siempre absoluta y en https. */
function imageOf(block, html, base) {
  const candidates = []
  for (const enc of block.match(/<enclosure\s[^>]*>/gi) || []) {
    if (/type=["']image\//i.test(enc) || /\.(jpe?g|png|webp)(\?|["'])/i.test(enc)) candidates.push(attr(enc, 'enclosure', 'url'))
  }
  // media:content: la de mayor anchura si hay varias.
  const media = (block.match(/<media:content\s[^>]*>/gi) || [])
    .filter((m) => !/medium=["'](video|audio)["']/i.test(m) && !/type=["'](video|audio)\//i.test(m))
    .map((m) => ({ url: attr(m, 'media:content', 'url'), w: Number(attr(m, 'media:content', 'width')) || 0 }))
    .sort((x, y) => y.w - x.w)
  candidates.push(...media.map((m) => m.url))
  candidates.push(attr(block, 'media:thumbnail', 'url'), tag(block, 'image')?.match(/<url>([^<]+)<\/url>/i)?.[1] ?? (/^https?:/.test(tag(block, 'image') || '') ? tag(block, 'image') : null))
  candidates.push(attr(block, 'itunes:image', 'href'))
  const img = String(html || '').match(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/i)
  if (img) candidates.push(img[1])
  for (const c of candidates) {
    const url = cleanImageUrl(c, base)
    if (url) return url
  }
  return null
}

/** Devuelve [{ title, url, description, content, author, published_at, image_url, image_credit }]. */
export function parseFeed(xml) {
  const text = String(xml || '')
  const isAtom = /<feed[\s>]/i.test(text) && !/<rss[\s>]/i.test(text)
  const blocks = isAtom ? allBlocks(text, 'entry') : allBlocks(text, 'item')
  return blocks
    .map((b) => {
      const descHtml = tag(b, 'description') || tag(b, 'summary') || ''
      const contentHtml = tag(b, 'content:encoded') || tag(b, 'content') || ''
      const link = isAtom ? attr(b, 'link', 'href') || tag(b, 'id') : tag(b, 'link') || tag(b, 'guid')
      const credit = tag(b, 'media:credit')
      return {
        title: stripHtml(tag(b, 'title') || '').trim(),
        url: link ? decodeEntities(link.trim()) : null,
        description: stripHtml(descHtml).trim(),
        content: stripHtml(contentHtml).trim(),
        author: stripHtml(tag(b, 'dc:creator') || tag(b, 'author') || '').replace(/\s+/g, ' ').trim() || null,
        published_at: toIso(tag(b, 'pubDate') || tag(b, 'dc:date') || tag(b, 'published') || tag(b, 'updated')),
        image_url: imageOf(b, `${descHtml}${contentHtml}`, link ? decodeEntities(link.trim()) : null),
        image_credit: credit ? stripHtml(credit).trim() : null,
      }
    })
    .filter((i) => i.title && i.url)
}
