/* RENIVYA — service worker.
 * - Navegación: red primero; sin red → shell cacheado (la app sigue abriendo).
 * - Recursos estáticos propios (/assets, /icons) y fuentes: caché primero.
 * - Nunca cachea las noticias (data/snapshot.json): siempre se piden a la red;
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
    const response = await fetch(request)
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
