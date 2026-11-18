/**
 * Almacén LOCAL de RENIVYA con API de entidades (list/filter/get/create/update/delete…).
 * Persiste en localStorage (con caída a memoria si el almacenamiento no está disponible).
 *
 * Emula:
 *  - client.entities.<Entidad>.list/filter/get/create/bulkCreate/update/delete/deleteMany/count
 *  - Operadores de consulta: igualdad, $in, $nin, $ne, $gt, $gte, $lt, $lte, $exists, $regex, $or, $and
 *  - RLS por propietario (created_by_id) en Preference y SavedStory
 *  - client.auth (sesión local, sin servidor)
 *  - client.functions.invoke → error explícito "local_mode"
 */

const STORAGE_PREFIX = 'renivya:local:'
const OWNER_SCOPED = new Set(['Preference', 'SavedStory'])
export const ENTITY_NAMES = [
  'Story', 'NewsItem', 'Source', 'StorySource', 'StoryUpdate', 'Entity',
  'StoryEntity', 'EntityRelation', 'Media', 'ArticleEmbedding', 'Preference', 'SavedStory',
]

/** Entidades grandes (las noticias): van a IndexedDB, que admite cientos de MB. */
const BIG_KEYS = new Set(['Story', 'NewsItem', 'Source', 'StorySource', 'StoryUpdate', 'Entity', 'StoryEntity', 'EntityRelation', 'Media', 'ArticleEmbedding'].map((n) => `entity:${n}`))

function idb() {
  if (typeof indexedDB === 'undefined') return null
  const open = () =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open('renivya', 1)
      req.onupgradeneeded = () => req.result.createObjectStore('kv')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
  let dbp = null
  const db = () => (dbp ||= open())
  const tx = async (mode, fn) => {
    const d = await db()
    return new Promise((resolve, reject) => {
      const t = d.transaction('kv', mode)
      const out = fn(t.objectStore('kv'))
      t.oncomplete = () => resolve(out?.result)
      t.onerror = () => reject(t.error)
      t.onabort = () => reject(t.error)
    })
  }
  return {
    get: (key) => tx('readonly', (st) => st.get(key)),
    set: (key, value) => tx('readwrite', (st) => st.put(value, key)),
    del: (key) => tx('readwrite', (st) => st.delete(key)),
  }
}

/**
 * Almacén clave-valor con caché en memoria (cada dato se lee del disco una sola vez).
 * Lo pequeño (sesión, preferencias, guardadas) va a localStorage; las noticias, a IndexedDB.
 * `memoryOnly` crea un almacén aislado (pruebas, autotest de Brain) que nunca toca el disco.
 */
function createStore(memoryOnly = false) {
  const memory = new Map()
  const db = memoryOnly ? null : idb()
  const local = {
    get(key) {
      try {
        const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
        return raw ? JSON.parse(raw) : null
      } catch {
        return null
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
      } catch {
        /* sin espacio o sin permiso: queda en memoria */
      }
    },
    del(key) {
      try {
        window.localStorage.removeItem(STORAGE_PREFIX + key)
      } catch {
        /* noop */
      }
    },
  }
  // Al arrancar, las noticias se cargan una vez de IndexedDB (y se mudan las que hubiera en localStorage).
  const ready = db
    ? Promise.all(
        [...BIG_KEYS].map(async (key) => {
          try {
            let value = await db.get(key)
            const legacy = local.get(key)
            if (legacy != null) {
              if (value == null) {
                value = legacy
                await db.set(key, legacy)
              }
              local.del(key)
            }
            if (value != null) memory.set(key, value)
          } catch {
            const legacy = local.get(key)
            if (legacy != null) memory.set(key, legacy)
          }
        })
      ).catch(() => {})
    : Promise.resolve()

  return {
    ready,
    read(key) {
      if (memory.has(key)) return memory.get(key)
      if (memoryOnly || (db && BIG_KEYS.has(key))) return null
      const value = local.get(key)
      memory.set(key, value)
      return value
    },
    write(key, value) {
      memory.set(key, value)
      if (memoryOnly) return
      if (db && BIG_KEYS.has(key)) db.set(key, value).catch(() => local.set(key, value))
      else local.set(key, value)
    },
    remove(key) {
      memory.delete(key)
      if (memoryOnly) return
      if (db && BIG_KEYS.has(key)) db.del(key).catch(() => {})
      local.del(key)
    },
  }
}

function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID().replace(/-/g, '').slice(0, 24)
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

class LocalError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
    this.response = { status, data: { message, code } }
  }
}

/* ---------------- consultas ---------------- */

function getPath(obj, path) {
  return path.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj)
}

function compare(a, b) {
  if (a == null && b == null) return 0
  if (a == null) return -1
  if (b == null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a).localeCompare(String(b))
}

function matchValue(value, cond) {
  if (cond !== null && typeof cond === 'object' && !Array.isArray(cond)) {
    return Object.entries(cond).every(([op, arg]) => {
      switch (op) {
        case '$in': return Array.isArray(value) ? value.some((v) => arg.includes(v)) : arg.includes(value)
        case '$nin': return Array.isArray(value) ? !value.some((v) => arg.includes(v)) : !arg.includes(value)
        case '$ne': return value !== arg
        case '$gt': return value != null && compare(value, arg) > 0
        case '$gte': return value != null && compare(value, arg) >= 0
        case '$lt': return value != null && compare(value, arg) < 0
        case '$lte': return value != null && compare(value, arg) <= 0
        case '$exists': return arg ? value !== undefined && value !== null : value === undefined || value === null
        case '$regex': {
          const re = new RegExp(arg, cond.$options || '')
          return typeof value === 'string' && re.test(value)
        }
        case '$options': return true
        default: return false
      }
    })
  }
  if (Array.isArray(value) && !Array.isArray(cond)) return value.includes(cond)
  return value === cond
}

export function matchQuery(record, query = {}) {
  return Object.entries(query || {}).every(([key, cond]) => {
    if (key === '$or') return cond.some((q) => matchQuery(record, q))
    if (key === '$and') return cond.every((q) => matchQuery(record, q))
    return matchValue(getPath(record, key), cond)
  })
}

function sortRecords(records, sort) {
  if (!sort) return records
  const desc = sort.startsWith('-')
  const field = desc ? sort.slice(1) : sort
  return [...records].sort((a, b) => (desc ? -1 : 1) * compare(getPath(a, field), getPath(b, field)))
}

function pickFields(record, fields) {
  // Copia: los datos en caché no se pueden modificar desde fuera.
  if (!fields || !fields.length) return { ...record }
  const out = { id: record.id }
  fields.forEach((f) => { out[f] = record[f] })
  return out
}

/* ---------------- auth ---------------- */

const SESSION_KEY = '__session'
const USERS_KEY = '__users'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function randomSalt() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** PBKDF2-SHA-256 (WebCrypto), 150 000 iteraciones. */
async function hashPassword(password, salt) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(String(password)), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 150000 }, key, 256)
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function createAuth(store) {
  const { read: readStore, write: writeStore, remove: removeStore } = store
  const currentUser = () => readStore(SESSION_KEY)
  const users = () => readStore(USERS_KEY) || {}

  function startSession(user) {
    writeStore(SESSION_KEY, user)
    return { access_token: `local-${user.id}`, user }
  }

  return {
    async me() {
      const user = currentUser()
      if (!user) throw new LocalError('No autenticado', 401, 'auth_required')
      return user
    },
    async isAuthenticated() {
      return Boolean(currentUser())
    },
    hasToken() {
      return Boolean(currentUser())
    },
    async updateMe(data) {
      const user = currentUser()
      if (!user) throw new LocalError('No autenticado', 401, 'auth_required')
      const next = { ...user, ...data, id: user.id, email: user.email, updated_date: new Date().toISOString() }
      writeStore(SESSION_KEY, next)
      const all = users()
      if (user.email && all[user.email]) {
        all[user.email] = { ...all[user.email], user: next }
        writeStore(USERS_KEY, all)
      }
      return next
    },
    /** Entrada con correo y contraseña (comprobada contra el hash guardado en el dispositivo). */
    async loginViaEmailPassword(email, password) {
      const key = normalizeEmail(email)
      const record = users()[key]
      if (!record || !record.hash || (await hashPassword(password, record.salt)) !== record.hash) {
        throw new LocalError('Correo o contraseña incorrectos', 401, 'invalid_credentials')
      }
      return startSession(record.user)
    },
    /**
     * Alta de cuenta: nombre, correo y contraseña, sin códigos de verificación.
     * La contraseña nunca se guarda: solo su hash PBKDF2 con sal.
     */
    async register({ name, email, password, country = null, locale = null }) {
      const key = normalizeEmail(email)
      if (!EMAIL_RE.test(key)) throw new LocalError('Correo no válido', 400, 'invalid_email')
      if (!password || String(password).length < 6) throw new LocalError('La contraseña necesita al menos 6 caracteres', 400, 'weak_password')
      const all = users()
      if (all[key]) throw new LocalError('Ese correo ya tiene cuenta en este dispositivo', 409, 'already_registered')
      const now = new Date().toISOString()
      const user = {
        id: uid(),
        email: key,
        full_name: String(name || '').trim() || key.split('@')[0],
        country,
        locale,
        role: 'admin',
        created_date: now,
        updated_date: now,
      }
      const salt = randomSalt()
      all[key] = { salt, hash: await hashPassword(password, salt), user }
      writeStore(USERS_KEY, all)
      // Lo que el lector anónimo ya tenía (guardadas, preferencias) pasa a la cuenta nueva.
      const previous = currentUser()
      if (previous?.id === 'local-reader') {
        for (const entity of ['Preference', 'SavedStory']) {
          const rows = readStore(`entity:${entity}`) || []
          writeStore(`entity:${entity}`, rows.map((r) => (r.created_by_id === 'local-reader' ? { ...r, created_by_id: user.id } : r)))
        }
      }
      return startSession(user)
    },
    /** Solo en modo local: sesión de invitado para explorar sin servidor. */
    async loginAsLocalGuest() {
      const now = new Date().toISOString()
      return startSession({ id: 'local-reader', email: null, full_name: 'Lector', role: 'admin', created_date: now, updated_date: now })
    },
    loginWithProvider() {
      throw new LocalError('Proveedor externo no disponible en modo local', 501, 'local_mode')
    },
    redirectToLogin(nextUrl) {
      window.location.assign(`/login?returnTo=${encodeURIComponent(nextUrl || '/')}`)
    },
    logout(redirectUrl) {
      removeStore(SESSION_KEY)
      if (redirectUrl) window.location.assign(redirectUrl)
    },
    setToken() {},
  }
}

/* ---------------- entidades ---------------- */

function createEntityHandler(name, store) {
  const { read: readStore, write: writeStore } = store
  const currentUser = () => readStore(SESSION_KEY)
  const load = () => readStore(`entity:${name}`) || []
  const save = (rows) => writeStore(`entity:${name}`, rows)

  function visible(rows) {
    if (!OWNER_SCOPED.has(name)) return rows
    const user = currentUser()
    if (!user) return []
    return rows.filter((r) => r.created_by_id === user.id)
  }

  function assertOwner(row) {
    if (!OWNER_SCOPED.has(name)) return
    const user = currentUser()
    if (!user || row.created_by_id !== user.id) throw new LocalError('Sin permiso', 403, 'forbidden')
  }

  function stamp(data) {
    const user = currentUser()
    const now = new Date().toISOString()
    return {
      ...data,
      id: uid(),
      created_date: now,
      updated_date: now,
      created_by: user?.email ?? null,
      created_by_id: user?.id ?? null,
    }
  }

  const api = {
    async list(sort, limit, skip = 0, fields) {
      const rows = sortRecords(visible(load()), sort)
      return rows.slice(skip, limit ? skip + limit : undefined).map((r) => pickFields(r, fields))
    },
    async filter(query, sort, limit, skip = 0, fields) {
      const rows = sortRecords(visible(load()).filter((r) => matchQuery(r, query)), sort)
      return rows.slice(skip, limit ? skip + limit : undefined).map((r) => pickFields(r, fields))
    },
    async count(query) {
      return visible(load()).filter((r) => matchQuery(r, query)).length
    },
    async get(id) {
      const row = visible(load()).find((r) => r.id === id)
      if (!row) throw new LocalError(`${name} ${id} no encontrado`, 404, 'not_found')
      return { ...row }
    },
    async create(data) {
      if (OWNER_SCOPED.has(name) && !currentUser()) throw new LocalError('No autenticado', 401, 'auth_required')
      const row = stamp(data)
      save([...load(), row])
      return row
    },
    async bulkCreate(items) {
      const rows = items.map(stamp)
      save([...load(), ...rows])
      return rows
    },
    async update(id, data) {
      const rows = load()
      const index = rows.findIndex((r) => r.id === id)
      if (index === -1) throw new LocalError(`${name} ${id} no encontrado`, 404, 'not_found')
      assertOwner(rows[index])
      const next = { ...rows[index], ...data, id, updated_date: new Date().toISOString() }
      rows[index] = next
      save(rows)
      return next
    },
    async delete(id) {
      const rows = load()
      const row = rows.find((r) => r.id === id)
      if (!row) throw new LocalError(`${name} ${id} no encontrado`, 404, 'not_found')
      assertOwner(row)
      save(rows.filter((r) => r.id !== id))
      return { success: true }
    },
    async deleteMany(query) {
      const rows = load()
      const doomed = visible(rows).filter((r) => matchQuery(r, query))
      const ids = new Set(doomed.map((r) => r.id))
      save(rows.filter((r) => !ids.has(r.id)))
      return { deleted: ids.size }
    },
    subscribe() {
      return () => {}
    },
    /** Sustituye todas las filas (sincronización de snapshot). Conserva ids y fechas. */
    async replaceAll(rows) {
      save(rows.map((r) => ({ ...r })))
      return { count: rows.length }
    },
  }
  // Toda operación espera a que las noticias guardadas se hayan cargado del disco.
  return Object.fromEntries(
    Object.entries(api).map(([k, fn]) => [k, k === 'subscribe' ? fn : async (...args) => (await store.ready, fn(...args))])
  )
}

export function createLocalClient({ memoryOnly = false } = {}) {
  const store = createStore(memoryOnly)
  if (memoryOnly) {
    const now = new Date().toISOString()
    store.write(SESSION_KEY, { id: 'memory-user', email: 'memory@renivya.local', full_name: 'Pruebas', role: 'admin', created_date: now, updated_date: now })
  }
  const entities = Object.fromEntries(ENTITY_NAMES.map((n) => [n, createEntityHandler(n, store)]))
  const unavailable = (what) => async () => {
    throw new LocalError(`${what} no está disponible en modo local`, 501, 'local_mode')
  }
  const client = {
    isLocal: true,
    entities,
    auth: createAuth(store),
    functions: {
      invoke: async (name) => {
        throw new LocalError(`La función backend "${name}" no existe: RENIVYA funciona sin servidor`, 501, 'local_mode')
      },
    },
    integrations: {
      Core: {
        InvokeLLM: unavailable('InvokeLLM'),
        UploadFile: unavailable('UploadFile'),
      },
    },
  }
  client.asServiceRole = client
  return client
}
