/**
 * Adaptador LOCAL con la misma superficie que el SDK de Base44 (@base44/sdk).
 * Se usa solo cuando no hay VITE_BASE44_APP_ID. Persiste en localStorage
 * (con caída a memoria si el almacenamiento no está disponible).
 *
 * Emula:
 *  - base44.entities.<Entidad>.list/filter/get/create/bulkCreate/update/delete/deleteMany/count
 *  - Operadores de consulta: igualdad, $in, $nin, $ne, $gt, $gte, $lt, $lte, $exists, $regex, $or, $and
 *  - RLS por propietario (created_by_id) en Preference y SavedStory
 *  - base44.auth (sesión local, sin servidor)
 *  - base44.functions.invoke → error explícito "local_mode"
 */

const STORAGE_PREFIX = 'renivya:local:'
const OWNER_SCOPED = new Set(['Preference', 'SavedStory'])
export const ENTITY_NAMES = [
  'Story', 'NewsItem', 'Source', 'StorySource', 'StoryUpdate', 'Entity',
  'StoryEntity', 'EntityRelation', 'Media', 'ArticleEmbedding', 'Preference', 'SavedStory',
]

const memory = new Map()

function readStore(key) {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key)
    if (raw) return JSON.parse(raw)
  } catch {
    /* almacenamiento no disponible: usamos memoria */
  }
  return memory.get(key) ?? null
}

function writeStore(key, value) {
  memory.set(key, value)
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
  } catch {
    /* sin persistencia: queda en memoria */
  }
}

function removeStore(key) {
  memory.delete(key)
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    /* noop */
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
  if (!fields || !fields.length) return record
  const out = { id: record.id }
  fields.forEach((f) => { out[f] = record[f] })
  return out
}

/* ---------------- auth ---------------- */

const SESSION_KEY = '__session'
const USERS_KEY = '__users'

function currentUser() {
  return readStore(SESSION_KEY)
}

function createAuth() {
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
      const all = users()
      all[user.email] = { ...all[user.email], user: next }
      writeStore(USERS_KEY, all)
      writeStore(SESSION_KEY, next)
      return next
    },
    async loginViaEmailPassword(email, password) {
      const key = String(email || '').trim().toLowerCase()
      const record = users()[key]
      if (!record || record.password !== password) throw new LocalError('Credenciales no válidas', 401, 'invalid_credentials')
      return startSession(record.user)
    },
    async register({ email, password }) {
      const key = String(email || '').trim().toLowerCase()
      if (!key || !password) throw new LocalError('Email y contraseña obligatorios', 400, 'invalid_params')
      const all = users()
      if (all[key]) throw new LocalError('Ese email ya está registrado', 409, 'already_registered')
      const now = new Date().toISOString()
      const user = { id: uid(), email: key, full_name: key.split('@')[0], role: 'admin', created_date: now, updated_date: now }
      all[key] = { password, user, verified: false }
      writeStore(USERS_KEY, all)
      return { email: key, requires_verification: true }
    },
    async verifyOtp({ email }) {
      const key = String(email || '').trim().toLowerCase()
      const all = users()
      if (!all[key]) throw new LocalError('Usuario no encontrado', 404, 'not_found')
      all[key].verified = true
      writeStore(USERS_KEY, all)
      return startSession(all[key].user)
    },
    async resendOtp() {
      return { ok: true }
    },
    async resetPasswordRequest() {
      return { ok: true }
    },
    async resetPassword() {
      return { ok: true }
    },
    /** Solo en modo local: sesión de invitado para explorar sin servidor. */
    async loginAsLocalGuest() {
      const now = new Date().toISOString()
      return startSession({ id: 'local-guest', email: 'local@renivya.local', full_name: 'Lector local', role: 'admin', created_date: now, updated_date: now })
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

function createEntityHandler(name) {
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

  return {
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
      return row
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
  }
}

export function createLocalClient() {
  const entities = Object.fromEntries(ENTITY_NAMES.map((n) => [n, createEntityHandler(n)]))
  const unavailable = (what) => async () => {
    throw new LocalError(`${what} no está disponible en modo local`, 501, 'local_mode')
  }
  const client = {
    isLocal: true,
    entities,
    auth: createAuth(),
    functions: {
      invoke: async (name) => {
        throw new LocalError(`La función backend "${name}" requiere Base44 (modo local)`, 501, 'local_mode')
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
