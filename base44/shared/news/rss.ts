// Parser RSS 2.0 / RDF / Atom sin dependencias (Deno no trae DOMParser). Determinista.
import { decodeEntities, stripHtml } from './normalizer.ts'

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

/** Imagen del feed: enclosure de tipo imagen, media:content, media:thumbnail o <img> en el HTML. */
function imageOf(block, html) {
  const enclosure = block.match(/<enclosure\s[^>]*>/i)?.[0]
  if (enclosure && /type=["']image\//i.test(enclosure)) return attr(enclosure, 'enclosure', 'url')
  const media = attr(block, 'media:content', 'url')
  if (media && !/\.(mp4|mp3|m3u8)(\?|$)/i.test(media)) return media
  const thumb = attr(block, 'media:thumbnail', 'url')
  if (thumb) return thumb
  const img = String(html || '').match(/<img[^>]+src=["']([^"']+)["']/i)
  return img ? decodeEntities(img[1]) : null
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
        image_url: imageOf(b, `${descHtml}${contentHtml}`),
        image_credit: credit ? stripHtml(credit).trim() : null,
      }
    })
    .filter((i) => i.title && i.url)
}
