/* RENIVYA — service worker.
 * - Navegación: red primero y sin caché HTTP (siempre la última versión); sin red → shell cacheado.
 * - Recursos estáticos propios (/assets, /icons) y fuentes: caché primero.
 * - Nunca cachea las noticias (data/app.json, data/snapshot.json): siempre se piden a la red;
 *   sin conexión, la app sigue mostrando las que ya guardó en el dispositivo.
 */
// VERSION y PRECACHE los rellena scripts/postbuild.mjs en cada publicación.
const VERSION = 'renivya-dev'
const PRECACHE = []
// Rutas relativas al alcance del service worker (funciona en / y en /Renivya/).
const BASE = new URL(self.registration.scope).pathname
const SHELL = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './icons/apple-touch-icon.png', './icons/icon-192.png']
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com']

self.addEventListener('install', (event) => {
  // Toda la app (incluidas las pantallas que se cargan bajo demanda) queda disponible sin conexión.
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll([...new Set([...SHELL, ...PRECACHE])])).then(() => self.skipWaiting())) // addAll rechaza URLs duplicadas
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  )
})

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(VERSION)
    cache.put(request, response.clone())
  }
  return response
}

async function networkFirstNavigation(request) {
  try {
    // Siempre la versión publicada más reciente (sin la caché HTTP del navegador).
    const response = await fetch(request.url, { cache: 'no-store', credentials: 'same-origin' })
    const cache = await caches.open(VERSION)
    cache.put(`${BASE}index.html`, response.clone())
    return response
  } catch {
    return (await caches.match(`${BASE}index.html`)) || (await caches.match(BASE)) || Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(networkFirstNavigation(request))
    return
  }
  if (url.origin === self.location.origin && ['assets/', 'icons/', 'geo/'].some((p) => url.pathname.startsWith(BASE + p))) {
    event.respondWith(cacheFirst(request))
    return
  }
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request))
  }
})

// Avisos de última hora (los envía GitHub Actions con Web Push).
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'RENIVYA', body: event.data?.text() || '' }
  }
  const title = data.title || 'RENIVYA'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: `${BASE}icons/icon-192.png`,
      badge: `${BASE}icons/favicon-32.png`,
      tag: data.tag || 'renivya',
      data: { url: data.url || BASE },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL(event.notification.data?.url || BASE, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate?.(url)
          return c.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
