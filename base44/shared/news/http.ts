// @ts-nocheck — JavaScript estándar en archivos .ts: se ejecuta igual en Deno (funciones) y en Vite (interfaz).
// Utilidades HTTP para las funciones backend (Deno). Sin dependencias externas.

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } })
}

export async function readBody(req) {
  if (req.method === 'GET') return Object.fromEntries(new URL(req.url).searchParams)
  try {
    return await req.json()
  } catch {
    return {}
  }
}

function env(name) {
  try {
    return globalThis.Deno?.env?.get(name) ?? null
  } catch {
    return null
  }
}

/**
 * Autoriza operaciones de mantenimiento:
 *  - usuario con rol admin, o
 *  - tarea programada con cabecera x-cron-secret igual a la variable de entorno CRON_SECRET.
 * Devuelve { ok, user, via } o { ok: false, response }.
 */
export async function requireAdminOrCron(base44, req) {
  const secret = env('CRON_SECRET')
  if (secret && req.headers.get('x-cron-secret') === secret) return { ok: true, user: null, via: 'cron' }
  let user = null
  try {
    user = await base44.auth.me()
  } catch {
    /* sin sesión */
  }
  if (user?.role === 'admin') return { ok: true, user, via: 'admin' }
  return { ok: false, response: json({ error: user ? 'forbidden' : 'unauthorized' }, user ? 403 : 401) }
}

export async function requireUser(base44) {
  try {
    const user = await base44.auth.me()
    if (user) return { ok: true, user }
  } catch {
    /* sin sesión */
  }
  return { ok: false, response: json({ error: 'unauthorized' }, 401) }
}

export function embeddingApiKey() {
  return env('OPENAI_API_KEY')
}
