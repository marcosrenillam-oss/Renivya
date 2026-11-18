/**
 * Actualización automática de la app: al abrirla, al volver a ella y cada pocos minutos
 * compara el código que está ejecutando con el publicado. Si hay versión nueva, se recarga sola.
 * (Las noticias se sincronizan aparte: ver useSnapshotSync.)
 */
const GUARD_KEY = 'renivya:update-attempt'

/** Script principal de una página (cambia de nombre en cada publicación con cambios). */
function entryOf(html) {
  return html.match(/<script[^>]+type="module"[^>]+src="([^"]*assets\/index-[^"]+\.js)"/)?.[1] ?? null
}

function currentEntry() {
  const el = document.querySelector('script[type="module"][src*="assets/index-"]')
  return el ? new URL(el.getAttribute('src'), location.href).pathname : null
}

/** Devuelve true si hay una versión publicada distinta de la que se está ejecutando. */
export async function hasNewVersion() {
  if (!import.meta.env.PROD) return false
  const running = currentEntry()
  if (!running) return false
  const res = await fetch(`${import.meta.env.BASE_URL}index.html?v=${Date.now()}`, { cache: 'no-store' })
  if (!res.ok) return false
  const published = entryOf(await res.text())
  if (!published) return false
  return new URL(published, location.href).pathname !== running
}

/** Recarga una sola vez por versión (evita bucles si la CDN aún sirve la antigua). */
export async function applyUpdate() {
  let target = 'new'
  try {
    const last = JSON.parse(sessionStorage.getItem(GUARD_KEY) || 'null')
    if (last && Date.now() - last.at < 120_000) return false
    sessionStorage.setItem(GUARD_KEY, JSON.stringify({ at: Date.now(), target }))
  } catch {
    /* sin almacenamiento */
  }
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    await reg?.update()
  } catch {
    /* sin service worker */
  }
  location.reload()
  return true
}
