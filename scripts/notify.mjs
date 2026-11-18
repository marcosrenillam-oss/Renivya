// Avisos de última hora: tras cada actualización, envía al móvil las noticias urgentes nuevas
// de la edición del lector, en su idioma. Necesita el secreto RENIVYA_AVISOS (el código que
// genera la app en Perfil → Avisos). Sin él no hace nada.
import * as webpush from 'web-push'
import { storyInLocale } from '../engine/translation.js'
import { storyInEdition } from '../engine/editions.js'

const MAX_PER_RUN = 3
const FRESH_MINUTES = 90

export function readPushConfig(raw = process.env.RENIVYA_AVISOS) {
  if (!raw) return null
  try {
    const cfg = JSON.parse(Buffer.from(raw.trim(), 'base64').toString('utf8'))
    return cfg?.sub?.endpoint && cfg.pub && cfg.priv ? cfg : null
  } catch {
    return null
  }
}

/** Historias que merecen aviso: urgentes, recientes, de la edición, en el idioma, no avisadas. */
export function pickAlerts(stories, { edition = 'ES', locale = 'es', notified = new Set(), now = new Date() } = {}) {
  const since = now.getTime() - FRESH_MINUTES * 60_000
  return stories
    .filter((s) => s.is_breaking && !s.is_demo && s.status !== 'archived' && !notified.has(s.id))
    .filter((s) => Date.parse(s.breaking_detected_at || s.updated_date || s.published_at || 0) >= since)
    .filter((s) => storyInEdition(s, edition))
    .map((s) => storyInLocale(s, locale))
    .filter(Boolean)
    .sort((a, b) => (b.renivya_score ?? 0) - (a.renivya_score ?? 0))
    .slice(0, MAX_PER_RUN)
}

/**
 * Envía los avisos y devuelve la lista de ids ya avisados (para no repetir en la próxima ejecución).
 */
export async function sendAlerts(snapshot, { previousNotified = [], log = console.log, appUrl, send = null } = {}) {
  const notified = new Set(previousNotified)
  const cfg = readPushConfig()
  if (!cfg) {
    log('avisos: sin RENIVYA_AVISOS, se omite')
    return [...notified].slice(-500)
  }
  const alerts = pickAlerts(snapshot.entities?.Story || [], { edition: cfg.edition, locale: cfg.locale, notified })
  if (!alerts.length) {
    log('avisos: ninguna última hora nueva')
    return [...notified].slice(-500)
  }
  const subject = appUrl || 'https://github.com/'
  webpush.setVapidDetails(subject, cfg.pub, cfg.priv)
  const deliver = send || ((sub, payload) => webpush.sendNotification(sub, payload, { TTL: 6 * 3600, urgency: 'high' }))
  const breakingWord = cfg.locale === 'en' ? 'Breaking' : 'Última hora'
  for (const s of alerts) {
    const payload = JSON.stringify({
      title: `${breakingWord} · ${s.title}`.slice(0, 120),
      body: String(s.summary || '').slice(0, 180),
      url: `${appUrl || ''}story/${s.id}`,
      tag: `story-${s.id}`,
    })
    try {
      await deliver(cfg.sub, payload)
      notified.add(s.id)
      log(`avisos: enviado «${s.title.slice(0, 60)}»`)
    } catch (err) {
      const code = err?.statusCode
      log(`avisos: error ${code ?? ''} ${code === 404 || code === 410 ? '(la suscripción caducó: vuelve a generar el código en Perfil → Avisos)' : err?.message ?? ''}`)
      break
    }
  }
  return [...notified].slice(-500)
}
