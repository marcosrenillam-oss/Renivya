// SDK simulado para probar las funciones backend en Deno sin servidor Base44.
// Un único almacén en memoria compartido; el rol del usuario se elige con la cabecera x-test-role.
import { createLocalClient } from '../../src/api/localClient.js'

const shared = createLocalClient({ memoryOnly: true })
export const calls = { llm: 0 }

shared.integrations.Core.InvokeLLM = async ({ prompt }) => {
  calls.llm++
  const original = JSON.parse(prompt.split('\n').pop())
  return { ...original, headline: `[EN] ${original.headline}`, summary: `[EN] ${original.summary}` }
}

export function createClientFromRequest(req) {
  const role = req.headers.get('x-test-role')
  return {
    entities: shared.entities,
    integrations: shared.integrations,
    asServiceRole: { entities: shared.entities, integrations: shared.integrations },
    auth: {
      async me() {
        if (!role) throw Object.assign(new Error('unauthorized'), { status: 401 })
        return { id: `u-${role}`, email: `${role}@test`, role }
      },
    },
  }
}

export const store = shared
