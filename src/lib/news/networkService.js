import { base44 } from '@/api/base44Client'

/**
 * Grafo de entidades: co-apariciones en Stories (peso = historias compartidas)
 * + relaciones explícitas (EntityRelation, solo con evidencia).
 * Lanza en caso de error: la UI distingue "error" de "vacío".
 */
export async function loadEntityGraph({ maxNodes = 60, minStories = 1, types = null } = {}) {
  const E = base44.entities
  const links = await E.StoryEntity.list('-created_date', 3000)
  const storiesByEntity = new Map()
  for (const l of links) {
    if (types && !types.includes(l.entity_type)) continue
    if (!storiesByEntity.has(l.entity_id)) storiesByEntity.set(l.entity_id, new Set())
    storiesByEntity.get(l.entity_id).add(l.story_id)
  }
  const ranked = [...storiesByEntity.entries()]
    .filter(([, s]) => s.size >= minStories)
    .sort((a, b) => b[1].size - a[1].size || String(a[0]).localeCompare(String(b[0])))
    .slice(0, maxNodes)
  const ids = ranked.map(([id]) => id)
  if (!ids.length) return { nodes: [], edges: [], stats: { entities: 0, relations: 0 } }

  const [entities, relations] = await Promise.all([
    E.Entity.filter({ id: { $in: ids } }, undefined, ids.length),
    E.EntityRelation.filter({ source_entity_id: { $in: ids } }, undefined, 2000),
  ])
  const byId = new Map(entities.map((e) => [e.id, e]))
  const nodes = ranked
    .filter(([id]) => byId.has(id))
    .map(([id, stories]) => ({ id, name: byId.get(id).name, type: byId.get(id).type, country_code: byId.get(id).country_code ?? null, stories: [...stories], weight: stories.size }))

  const idSet = new Set(nodes.map((n) => n.id))
  const edges = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = new Set(nodes[i].stories)
      const shared = nodes[j].stories.filter((s) => a.has(s)).length
      if (shared) edges.push({ source: nodes[i].id, target: nodes[j].id, weight: shared, kind: 'co' })
    }
  }
  for (const r of relations) {
    if (!idSet.has(r.source_entity_id) || !idSet.has(r.target_entity_id)) continue
    edges.push({ source: r.source_entity_id, target: r.target_entity_id, weight: 2, kind: 'relation', relation_type: r.relation_type, story_id: r.story_id ?? null })
  }
  return { nodes, edges, stats: { entities: nodes.length, relations: edges.filter((e) => e.kind === 'relation').length } }
}

/** Layout de fuerzas determinista (semilla fija): mismas entradas → mismas posiciones. */
export function layoutGraph(nodes, edges, { width = 800, height = 560, iterations = 260, seed = 7 } = {}) {
  let s = seed
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
  const pos = new Map(nodes.map((n, i) => {
    const angle = (i / Math.max(1, nodes.length)) * Math.PI * 2
    const r = Math.min(width, height) * (0.25 + rand() * 0.2)
    return [n.id, { x: width / 2 + Math.cos(angle) * r, y: height / 2 + Math.sin(angle) * r, vx: 0, vy: 0 }]
  }))
  const k = Math.sqrt((width * height) / Math.max(1, nodes.length)) * 0.5
  for (let it = 0; it < iterations; it++) {
    const t = 1 - it / iterations
    for (const a of nodes) {
      const pa = pos.get(a.id)
      for (const b of nodes) {
        if (a.id === b.id) continue
        const pb = pos.get(b.id)
        const dx = pa.x - pb.x || 0.01
        const dy = pa.y - pb.y || 0.01
        const d2 = dx * dx + dy * dy
        if (d2 > 9 * k * k) continue // repulsión solo local: los grupos sueltos no salen disparados
        const f = (k * k) / d2
        pa.vx += dx * f * 0.02
        pa.vy += dy * f * 0.02
      }
    }
    for (const e of edges) {
      const pa = pos.get(e.source)
      const pb = pos.get(e.target)
      if (!pa || !pb) continue
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const d = Math.sqrt(dx * dx + dy * dy) || 1
      const f = ((d - k) / d) * 0.04 * Math.min(3, e.weight)
      pa.vx += dx * f
      pa.vy += dy * f
      pb.vx -= dx * f
      pb.vy -= dy * f
    }
    for (const n of nodes) {
      const p = pos.get(n.id)
      p.vx += (width / 2 - p.x) * 0.012
      p.vy += (height / 2 - p.y) * 0.012
      const v = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1
      const max = 12 * t + 0.5
      p.x += (p.vx / v) * Math.min(v, max)
      p.y += (p.vy / v) * Math.min(v, max)
      p.x = Math.max(30, Math.min(width - 30, p.x))
      p.y = Math.max(30, Math.min(height - 30, p.y))
      p.vx *= 0.6
      p.vy *= 0.6
    }
  }
  return new Map([...pos.entries()].map(([id, p]) => [id, { x: p.x, y: p.y }]))
}
