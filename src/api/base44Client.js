import { createClient } from '@base44/sdk'
import { createLocalClient } from '@/api/localClient'

/**
 * Cliente preinicializado de RENIVYA.
 * - Con VITE_BASE44_APP_ID → SDK real de Base44.
 * - Sin él → adaptador local con la misma API (desarrollo / demo sin servidor).
 */
const appId = import.meta.env.VITE_BASE44_APP_ID
const serverUrl = import.meta.env.VITE_BASE44_SERVER_URL

export const isLocalMode = !appId

export const base44 = appId
  ? createClient({ appId, ...(serverUrl ? { serverUrl } : {}), requiresAuth: false })
  : createLocalClient()

export default base44
