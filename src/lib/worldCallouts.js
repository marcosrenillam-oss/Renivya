/**
 * Etiquetas flotantes del globo: países más relevantes visibles en la cara frontal,
 * con separación mínima en pantalla para que no se solapen.
 */
export function layoutCallouts(projected, { max = 5, minGap = 34 } = {}) {
  const visible = projected.filter((p) => p.visible).sort((a, b) => b.weight - a.weight)
  const placed = []
  for (const p of visible) {
    if (placed.length >= max) break
    if (placed.some((q) => Math.abs(q.x - p.x) < 110 && Math.abs(q.y - p.y) < minGap)) continue
    placed.push(p)
  }
  return placed
}
