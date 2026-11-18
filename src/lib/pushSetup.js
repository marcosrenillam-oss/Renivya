/**
 * Avisos de última hora (Web Push) sin servidor propio.
 * El móvil genera su propio par de claves VAPID y su suscripción, y lo empaqueta en un
 * "código de avisos". Ese código se guarda UNA vez como secreto en GitHub (RENIVYA_AVISOS) y
 * GitHub Actions lo usa para enviar los avisos. La clave privada nunca sale de ese secreto.
 */
const STORE = 'renivya:push'

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0))

export function pushSupport() {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
  const apis = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
  return { apis, standalone, ios, ok: apis && (standalone || !ios), permission: apis ? Notification.permission : 'unsupported' }
}

export function savedPush() {
  try {
    return JSON.parse(localStorage.getItem(STORE) || 'null')
  } catch {
    return null
  }
}

async function vapidKeys() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const pub = b64url(await crypto.subtle.exportKey('raw', pair.publicKey))
  const { d } = await crypto.subtle.exportKey('jwk', pair.privateKey)
  return { pub, priv: d }
}

/** Pide permiso, se suscribe y devuelve el código para pegar en GitHub. */
export async function enablePush({ edition, locale }) {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('permission')
  const reg = await navigator.serviceWorker.ready
  const old = await reg.pushManager.getSubscription()
  if (old) await old.unsubscribe().catch(() => {})
  const keys = await vapidKeys()
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: fromB64url(keys.pub) })
  const config = { v: 1, sub: sub.toJSON(), pub: keys.pub, priv: keys.priv, edition, locale }
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(config))))
  const saved = { code, edition, locale, at: new Date().toISOString() }
  localStorage.setItem(STORE, JSON.stringify(saved))
  return saved
}

/** Aviso de prueba local (sin pasar por GitHub). */
export async function testNotification(title, body) {
  const reg = await navigator.serviceWorker.ready
  await reg.showNotification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png`, badge: `${import.meta.env.BASE_URL}icons/favicon-32.png`, tag: 'renivya-test' })
}
