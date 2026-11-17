// Adaptador de entidades: misma interfaz para el SDK de Base44 (frontend o asServiceRole) y el cliente local.
export const ENTITY_NAMES = [
  'Story', 'NewsItem', 'Source', 'StorySource', 'StoryUpdate', 'Entity',
  'StoryEntity', 'EntityRelation', 'Media', 'ArticleEmbedding',
]

function wrap(handler) {
  return {
    list: (...a) => handler.list(...a),
    filter: (...a) => handler.filter(...a),
    get: (id) => handler.get(id),
    create: (data) => handler.create(data),
    update: (id, data) => handler.update(id, data),
    delete: (id) => handler.delete(id),
    async bulkCreate(rows) {
      if (!rows.length) return []
      if (typeof handler.bulkCreate === 'function') return handler.bulkCreate(rows)
      const out = []
      for (const r of rows) out.push(await handler.create(r))
      return out
    },
    /** Todas las filas que cumplen la consulta, paginando de 500 en 500. */
    async filterAll(query, sort, max = 5000) {
      const out = []
      for (let skip = 0; skip < max; skip += 500) {
        const page = await handler.filter(query, sort, 500, skip)
        out.push(...page)
        if (page.length < 500) break
      }
      return out
    },
  }
}

/** `entities` = base44.entities o base44.asServiceRole.entities. */
export function createDataAdapter(entities) {
  return Object.fromEntries(ENTITY_NAMES.filter((n) => entities[n]).map((n) => [n, wrap(entities[n])]))
}
