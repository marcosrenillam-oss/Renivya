#!/usr/bin/env node
/**
 * Resumen semanal de RENIVYA: un PDF con aspecto de periódico antiguo (portada, índice con
 * enlaces a cada sección y titulares que abren la noticia original) enviado por correo.
 *
 *   node scripts/weekly-digest.mjs            # genera el PDF y lo envía si hay credenciales
 *   node scripts/weekly-digest.mjs --dry-run  # solo genera el PDF (OUT_DIR, por defecto ./weekly)
 *
 * Variables (secretos de GitHub Actions):
 *   GMAIL_USER, GMAIL_APP_PASSWORD   cuenta de Gmail que envía (contraseña de aplicación)
 *   RESUMEN_PARA                     destinatario (por defecto, GMAIL_USER)
 *   RESUMEN_NOMBRE                   nombre del lector para la portada (opcional)
 *   RESUMEN_EDICION / RESUMEN_IDIOMA país (ES) e idioma (es) de la edición
 *   SNAPSHOT_URL                     estado publicado (por defecto, public/data/snapshot.json)
 *   APP_URL                          dirección de la app (para el enlace «Abrir RENIVYA»)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs'
import { join } from 'node:path'
import { storyInLocale } from '../engine/translation.js'
import { storyInEdition } from '../engine/editions.js'

const DRY = process.argv.includes('--dry-run')
const OUT_DIR = process.env.OUT_DIR || 'weekly'
const EDITION = (process.env.RESUMEN_EDICION || 'ES').toUpperCase()
const LOCALE = process.env.RESUMEN_IDIOMA === 'en' ? 'en' : 'es'
const NAME = (process.env.RESUMEN_NOMBRE || '').trim()
const APP_URL = process.env.APP_URL || ''
const log = (...a) => console.log('[resumen]', ...a)

const T = {
  es: {
    weekly: 'Resumen semanal', edition: 'Edición', for: 'Para', week: (a, b) => `Semana del ${a} al ${b}`, issue: 'Nº',
    inThisIssue: 'En este número', figures: 'La semana en cifras', stories: 'historias', sources: 'periódicos', countries: 'países',
    according: 'Según', open: 'Abrir RENIVYA', page: 'Página', of: 'de', more: 'Más noticias de la semana',
    subject: (d) => `RENIVYA · Tu resumen de la semana (${d})`, hello: (n) => (n ? `Buenos días, ${n}.` : 'Buenos días.'),
    intro: 'Aquí tienes lo más importante de la semana, contrastado. El PDF adjunto tiene la edición completa: toca el índice para ir a cada sección y cada titular para leer la noticia original.',
    breaking: 'Última hora', footer: 'Hecho con RENIVYA a partir de la prensa publicada esta semana.',
  },
  en: {
    weekly: 'Weekly digest', edition: 'Edition', for: 'For', week: (a, b) => `Week of ${a} to ${b}`, issue: 'No.',
    inThisIssue: 'In this issue', figures: 'The week in numbers', stories: 'stories', sources: 'newspapers', countries: 'countries',
    according: 'According to', open: 'Open RENIVYA', page: 'Page', of: 'of', more: 'More news this week',
    subject: (d) => `RENIVYA · Your week in review (${d})`, hello: (n) => (n ? `Good morning, ${n}.` : 'Good morning.'),
    intro: 'Here is the most important news of the week, cross-checked. The attached PDF has the full edition: tap the index to jump to each section and any headline to read the original story.',
    breaking: 'Breaking', footer: 'Made by RENIVYA from the press published this week.',
  },
}[LOCALE]

const CATEGORY = {
  es: { conflict: 'Conflictos', disasters: 'Catástrofes', crime: 'Sucesos', space: 'Espacio', markets: 'Mercados', world: 'Internacional', politics: 'Política', economy: 'Economía', business: 'Economía', technology: 'Tecnología', artificial_intelligence: 'Tecnología', science: 'Ciencia', sports: 'Deportes', football: 'Deportes', culture: 'Cultura', entertainment: 'Cultura', health: 'Salud', environment: 'Medio ambiente', travel: 'Viajes', society: 'Sociedad' },
  en: { conflict: 'Conflicts', disasters: 'Disasters', crime: 'Crime', space: 'Space', markets: 'Markets', world: 'World', politics: 'Politics', economy: 'Economy', business: 'Economy', technology: 'Technology', artificial_intelligence: 'Technology', science: 'Science', sports: 'Sports', football: 'Sports', culture: 'Culture', entertainment: 'Culture', health: 'Health', environment: 'Environment', travel: 'Travel', society: 'Society' },
}[LOCALE]
const SECTION_ORDER = ['world', 'politics', 'economy', 'society', 'technology', 'science', 'health', 'environment', 'culture', 'sports', 'travel']
const sectionOf = (c) => ({ business: 'economy', markets: 'economy', artificial_intelligence: 'technology', football: 'sports', entertainment: 'culture', space: 'science', conflict: 'world', disasters: 'world', crime: 'society' })[c] || c || 'society'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const fmtDate = (d, opts) => new Intl.DateTimeFormat(LOCALE === 'es' ? 'es-ES' : 'en-GB', opts).format(d)
const sourcesOf = (s) => [...new Set((s.sources || []).map((x) => x?.name).filter(Boolean))]
const linkOf = (s) => (s.sources || []).find((x) => x?.url && !/\.invalid\//.test(x.url))?.url || (APP_URL ? `${APP_URL}story/${s.id}` : '#')

async function loadSnapshot() {
  const url = process.env.SNAPSHOT_URL
  if (url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (res.ok) return res.json()
    log('no se pudo descargar el estado publicado:', res.status)
  }
  const local = 'public/data/snapshot.json'
  if (!existsSync(local)) throw new Error('no hay snapshot')
  return JSON.parse(readFileSync(local, 'utf8'))
}

/** Historias de la semana de la edición, en el idioma del lector, de más a menos relevante. */
export function weeklyStories(stories, { edition = EDITION, locale = LOCALE, now = new Date() } = {}) {
  const since = now.getTime() - 7 * 86_400_000
  const inWeek = (s) => Date.parse(s.first_detected_at || s.published_at || 0) >= since
  const pool = stories.filter((s) => storyInEdition(s, edition) && s.status !== 'archived')
  const week = pool.filter(inWeek)
  return (week.length >= 5 ? week : pool)
    .map((s) => storyInLocale(s, locale))
    .filter(Boolean)
    .sort((a, b) => (b.renivya_score ?? 0) - (a.renivya_score ?? 0) || (b.source_count ?? 0) - (a.source_count ?? 0))
}

function photo(s, cls = '') {
  return s.image_url ? `<img class="photo ${cls}" src="${esc(s.image_url)}" referrerpolicy="no-referrer" onerror="this.remove()" alt="">` : ''
}

function kicker(s) {
  return s.is_breaking ? `<span class="kicker red">${T.breaking}</span>` : `<span class="kicker">${esc(CATEGORY[s.category] || '')}</span>`
}

function byline(s) {
  const names = sourcesOf(s)
  const date = s.published_at ? fmtDate(new Date(s.published_at), { day: 'numeric', month: 'long' }) : ''
  return `<p class="byline">${names.length ? `${T.according} ${esc(names.slice(0, 3).join(', '))}${names.length > 3 ? ` +${names.length - 3}` : ''} · ` : ''}${esc(date)}</p>`
}

function storyBlock(s, { big = false, withPhoto = false } = {}) {
  const body = [s.summary, ...(s.body || []).slice(0, big ? 3 : 1)].filter(Boolean)
  return `<article class="story ${big ? 'big' : ''}">
    ${kicker(s)}
    <h3><a href="${esc(linkOf(s))}">${esc(s.title)}</a></h3>
    ${withPhoto ? photo(s) : ''}
    <div class="text ${big ? 'cols2' : ''}">${body.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
    ${byline(s)}
  </article>`
}

export function buildHtml(stories, { now = new Date() } = {}) {
  const start = new Date(now.getTime() - 6 * 86_400_000)
  const week = T.week(fmtDate(start, { day: 'numeric', month: 'long' }), fmtDate(now, { day: 'numeric', month: 'long', year: 'numeric' }))
  const issue = Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 86_400_000))
  const editionName = new Intl.DisplayNames([LOCALE], { type: 'region' }).of(EDITION)

  const lead = stories.find((s) => s.image_url) || stories[0]
  const rest = stories.filter((s) => s !== lead)
  const second = rest.slice(0, 3)
  const used = new Set([lead, ...second].map((s) => s?.id))
  const sections = new Map()
  for (const s of stories.slice(0, 60)) {
    if (used.has(s.id)) continue
    const key = sectionOf(s.category)
    if (!sections.has(key)) sections.set(key, [])
    if (sections.get(key).length < 8) sections.get(key).push(s)
  }
  const orderedSections = [...sections.entries()].sort((a, b) => SECTION_ORDER.indexOf(a[0]) - SECTION_ORDER.indexOf(b[0]))
  const allSources = new Set(stories.flatMap(sourcesOf))
  const allCountries = new Set(stories.flatMap((s) => s.countries || []))

  const index = orderedSections
    .map(([key, list]) => `<li><a href="#sec-${key}">${esc(CATEGORY[key] || key)}</a><span class="dots"></span><span>${list.length}</span></li>`)
    .join('')

  const sectionPages = orderedSections
    .map(([key, list]) => {
      const [first, ...others] = list
      return `<section class="section" id="sec-${key}">
        <div class="keep">
          <header class="sec-head"><div class="rule thick"></div><h2>${esc(CATEGORY[key] || key)}</h2><div class="rule"></div></header>
          ${storyBlock({ ...first, category: first.is_breaking ? first.category : null }, { big: true, withPhoto: true })}
        </div>
        <div class="grid">${others.map((s) => storyBlock(s, { withPhoto: Boolean(s.image_url) && others.indexOf(s) < 2 })).join('')}</div>
      </section>`
    })
    .join('')

  return `<!doctype html><html lang="${LOCALE}"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Inter:wght@500;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; color: #141210; font-family: 'Source Serif 4', Georgia, serif; font-size: 10.5pt; line-height: 1.42; background: #f3eee2; }
  /* El papel cubre toda la hoja y los márgenes se repiten en cada página. */
  .paper { position: fixed; inset: 0; background: radial-gradient(120% 80% at 50% 0%, #f7f3e9, #efe8d8 70%, #e9e1cf); z-index: -1; }
  .content { padding: 13mm 13mm 15mm; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .runfoot { position: fixed; left: 13mm; right: 13mm; bottom: 6mm; display: flex; justify-content: space-between; font: 700 6.5pt Inter, sans-serif; letter-spacing: .16em; text-transform: uppercase; color: #6b655a; border-top: .5pt solid #b9b2a2; padding-top: 1.2mm; }
  .front { }
  a { color: inherit; text-decoration: none; }
  .rule { border-top: 0.8pt solid #141210; }
  .rule.thick { border-top: 2.6pt solid #141210; }
  .rule.double { border-top: 3pt double #141210; }
  .masthead { text-align: center; }
  .ears { display: flex; justify-content: space-between; font: 700 7.5pt Inter, sans-serif; letter-spacing: .16em; text-transform: uppercase; padding: 2mm 0 1mm; }
  .title { font-family: 'UnifrakturMaguntia', serif; font-size: 56pt; line-height: 1; margin: 0 0 1.5mm; }
  .dateline { display: flex; justify-content: space-between; font: 700 7.5pt Inter, sans-serif; letter-spacing: .12em; text-transform: uppercase; padding: 1.4mm 0; }
  .kicker { display: block; font: 700 7pt Inter, sans-serif; letter-spacing: .18em; text-transform: uppercase; color: #555; margin-bottom: 1mm; }
  .kicker.red { color: #b3121e; }
  h1, h3 { font-family: 'Playfair Display', Georgia, serif; font-weight: 900; margin: 0; letter-spacing: -0.01em; }
  .lead h1 { font-size: 25pt; line-height: 1.04; margin: 2mm 0 2.5mm; }
  .lead .wrap { display: grid; grid-template-columns: 1.25fr 1fr; gap: 6mm; }
  .photo { width: 100%; height: auto; max-height: 85mm; object-fit: cover; filter: grayscale(1) contrast(1.12) sepia(.15); display: block; margin: 1.5mm 0 2mm; border: .5pt solid #141210; }
  .lead .photo { max-height: 66mm; }
  .lead .text p:nth-child(n+2) { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
  .seconds .photo { max-height: 26mm; }
  .boxes { break-inside: avoid; }
  .seconds .text p { display: -webkit-box; -webkit-line-clamp: 5; -webkit-box-orient: vertical; overflow: hidden; }
  .text p { margin: 0 0 1.6mm; text-align: justify; hyphens: auto; }
  .lead .text p:first-child::first-letter { float: left; font: 900 34pt/0.8 'Playfair Display', serif; margin: 1mm 1.5mm 0 0; }
  .cols2 { column-count: 2; column-gap: 6mm; column-rule: .5pt solid #b9b2a2; }
  .byline { font-style: italic; font-size: 8pt; color: #555; margin: 1mm 0 0; }
  .seconds { display: grid; grid-template-columns: repeat(3, 1fr); gap: 5mm; margin-top: 4mm; }
  .seconds .story + .story { border-left: .5pt solid #141210; padding-left: 5mm; }
  .story { break-inside: avoid; }
  .story h3 { font-size: 13pt; line-height: 1.12; margin-bottom: 1.5mm; }
  .story.big h3 { font-size: 21pt; line-height: 1.06; }
  .boxes { display: grid; grid-template-columns: 1.3fr 1fr; gap: 6mm; margin-top: 4mm; }
  .box { border-top: 2.6pt solid #141210; border-bottom: .8pt solid #141210; padding: 2mm 0; }
  .box h4 { font: 700 8pt Inter, sans-serif; letter-spacing: .18em; text-transform: uppercase; margin: 0 0 2mm; }
  .box ol { list-style: none; margin: 0; padding: 0; }
  .box li { display: flex; gap: 2mm; align-items: baseline; font-family: 'Playfair Display', serif; font-weight: 700; font-size: 12pt; padding: .8mm 0; }
  .box li a { text-decoration: underline; text-decoration-thickness: .4pt; text-underline-offset: 2pt; }
  .dots { flex: 1; border-bottom: .8pt dotted #141210; transform: translateY(-1mm); }
  .figures { display: grid; grid-template-columns: repeat(3, 1fr); text-align: center; }
  .figures b { display: block; font: 900 24pt 'Playfair Display', serif; }
  .figures span { font: 700 7pt Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #555; }
  .open { display: inline-block; margin-top: 3mm; border: .8pt solid #141210; padding: 1.5mm 3mm; font: 700 7.5pt Inter, sans-serif; letter-spacing: .16em; text-transform: uppercase; }
  .section { margin-top: 7mm; }
  .sec-head { break-after: avoid; }
  .keep { break-inside: avoid; }
  .section .story.big .photo { max-height: 72mm; }
  .sec-head { margin-bottom: 4mm; }
  .sec-head h2 { font: 900 26pt 'Playfair Display', serif; text-transform: uppercase; letter-spacing: .04em; margin: 1.5mm 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm 7mm; margin-top: 4mm; border-top: .8pt solid #141210; padding-top: 3mm; }
  .grid .story { padding-bottom: 3mm; border-bottom: .5pt solid #b9b2a2; }
</style></head><body>
<div class="paper"></div>
<div class="runfoot"><span>RENIVYA · ${T.weekly}</span><span>${esc(week)}</span></div>
<div class="content">
<div class="front">
<div class="masthead">
  <div class="rule thick"></div>
  <div class="ears"><span>${T.weekly}</span><span>${T.edition} ${esc(editionName)}</span></div>
  <div class="title">Renivya</div>
  <div class="rule double"></div>
  <div class="dateline"><span>${esc(week)}</span><span>${NAME ? `${T.for} ${esc(NAME)} · ` : ''}${T.issue} ${issue}</span></div>
  <div class="rule"></div>
</div>
${lead ? `<section class="lead">
  ${kicker(lead)}
  <h1><a href="${esc(linkOf(lead))}">${esc(lead.title)}</a></h1>
  <div class="wrap">
    <div>${photo(lead)}</div>
    <div class="text">${[lead.summary, ...(lead.body || []).slice(0, 1)].filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join('')}${byline(lead)}</div>
  </div>
</section>` : ''}
<div class="rule thick" style="margin-top:4mm"></div>
<div class="seconds">${second.map((s) => storyBlock({ ...s, body: [] }, { withPhoto: true })).join('')}</div>
<div class="boxes">
  <div class="box"><h4>${T.inThisIssue}</h4><ol>${index}</ol></div>
  <div class="box"><h4>${T.figures}</h4>
    <div class="figures"><div><b>${stories.length}</b><span>${T.stories}</span></div><div><b>${allSources.size}</b><span>${T.sources}</span></div><div><b>${allCountries.size}</b><span>${T.countries}</span></div></div>
    ${APP_URL ? `<a class="open" href="${esc(APP_URL)}">${T.open} →</a>` : ''}
  </div>
</div>
</div>
${sectionPages}
</div>
</body></html>`
}

function emailHtml(stories) {
  const top = stories.slice(0, 5)
  return `<div style="background:#f3eee2;padding:24px 0;font-family:Georgia,serif;color:#141210">
  <div style="max-width:560px;margin:0 auto;background:#faf7ef;padding:24px 28px;border-top:4px solid #141210">
    <div style="text-align:center;font-family:'UnifrakturMaguntia','Old English Text MT',Georgia,serif;font-size:44px;line-height:1">Renivya</div>
    <div style="border-top:3px double #141210;margin:8px 0 4px"></div>
    <div style="font:bold 10px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;text-align:center">${T.weekly}</div>
    <p style="font-size:17px;margin:18px 0 6px"><i>${esc(T.hello(NAME))}</i></p>
    <p style="font-size:15px;line-height:1.5;margin:0 0 16px">${esc(T.intro)}</p>
    ${top
      .map(
        (s) => `<div style="border-top:1px solid #141210;padding:10px 0">
        <div style="font:bold 9px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;color:${s.is_breaking ? '#b3121e' : '#666'}">${esc(s.is_breaking ? T.breaking : CATEGORY[s.category] || '')}</div>
        <a href="${esc(linkOf(s))}" style="color:#141210;text-decoration:none;font:bold 19px Georgia,serif;line-height:1.2">${esc(s.title)}</a>
      </div>`
      )
      .join('')}
    ${APP_URL ? `<p style="margin:18px 0 0"><a href="${esc(APP_URL)}" style="display:inline-block;background:#141210;color:#faf7ef;padding:10px 16px;font:bold 11px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase;text-decoration:none">${T.open}</a></p>` : ''}
    <p style="font-size:12px;color:#666;margin:20px 0 0"><i>${esc(T.footer)}</i></p>
  </div></div>`
}

async function renderPdf(html, file) {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  try {
    // Ancho de un A4 a 96 ppp: las fotos se maquetan igual que en la impresión.
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1.6 })
    await page.emulateMedia({ media: 'print' })
    await page.setContent(html, { waitUntil: 'networkidle', timeout: 90000 })
    await page.evaluate(() => document.fonts.ready)
    // Fotos al tamaño al que se ven (JPEG ligero): el PDF pasa de decenas de MB a 1–3 MB.
    for (const img of await page.$$('img')) {
      const ok = await img.evaluate((i) => i.complete && i.naturalWidth > 0 && i.getBoundingClientRect().width > 0)
      if (!ok) {
        await img.evaluate((i) => i.parentNode && i.parentNode.removeChild(i))
        continue
      }
      const shot = await img.screenshot({ type: 'jpeg', quality: 70 }).catch(() => null)
      if (shot) {
        await img.evaluate((i, src) => {
          i.src = src
          i.style.filter = 'none'
        }, `data:image/jpeg;base64,${shot.toString('base64')}`)
      }
    }
    await page.pdf({
      path: file,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    })
  } finally {
    await browser.close()
  }
}

async function main() {
  const snapshot = await loadSnapshot()
  const stories = weeklyStories(snapshot.entities?.Story || [])
  if (!stories.length) {
    log('no hay historias para el resumen')
    return
  }
  const now = new Date()
  const stamp = now.toISOString().slice(0, 10)
  mkdirSync(OUT_DIR, { recursive: true })
  const file = join(OUT_DIR, `Renivya-resumen-${stamp}.pdf`)
  const html = buildHtml(stories, { now })
  writeFileSync(join(OUT_DIR, 'resumen.html'), html)
  await renderPdf(html, file)
  log(`PDF: ${file} (${stories.length} historias)`)

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  const to = process.env.RESUMEN_PARA || user
  let sent = false
  if (!DRY && user && pass && to) {
    const nodemailer = await import('nodemailer')
    const transport = nodemailer.createTransport({ service: 'gmail', auth: { user, pass } })
    await transport.sendMail({
      from: `RENIVYA <${user}>`,
      to,
      subject: T.subject(fmtDate(now, { day: 'numeric', month: 'long' })),
      html: emailHtml(stories),
      attachments: [{ filename: `Renivya-resumen-${stamp}.pdf`, path: file }],
    })
    sent = true
    log('correo enviado')
  } else log('correo no enviado (modo prueba o faltan GMAIL_USER / GMAIL_APP_PASSWORD)')
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `sent=${sent}\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[resumen] error:', err?.message || err)
    process.exit(1)
  })
}
