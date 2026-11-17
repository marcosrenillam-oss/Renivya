import { useMemo, useRef, useState } from 'react'
import { layoutGraph } from '@/lib/news/networkService'
import { TYPE_COLOR } from '@/components/network/networkStyle'
import { cn } from '@/lib/utils'

const W = 900
const H = 620

/** Grafo SVG: nodos por tipo, tamaño por nº de historias, aristas de co-aparición y relaciones explícitas. */
export default function NetworkGraph({ nodes, edges, selected, onSelect, resetKey, className }) {
  const positions = useMemo(() => layoutGraph(nodes, edges, { width: W, height: H }), [nodes, edges])
  const [view, setView] = useState({ x: 0, y: 0, k: 1 })
  const drag = useRef(null)
  const pointers = useRef(new Map())
  const lastReset = useRef(resetKey)
  if (lastReset.current !== resetKey) {
    lastReset.current = resetKey
    if (view.k !== 1 || view.x || view.y) setView({ x: 0, y: 0, k: 1 })
  }

  const neighbours = useMemo(() => {
    if (!selected) return null
    const set = new Set([selected])
    for (const e of edges) {
      if (e.source === selected) set.add(e.target)
      if (e.target === selected) set.add(e.source)
    }
    return set
  }, [selected, edges])

  const maxW = Math.max(1, ...nodes.map((n) => n.weight))
  const radius = (n) => 5 + 13 * Math.sqrt(n.weight / maxW)

  function onWheel(e) {
    const factor = e.deltaY > 0 ? 0.9 : 1.1
    setView((v) => ({ ...v, k: Math.min(4, Math.max(0.5, v.k * factor)) }))
  }
  function onPointerDown(e) {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    drag.current = { x: e.clientX, y: e.clientY, moved: false, start: { ...view } }
  }
  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return
    const prev = pointers.current.get(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      // pellizco: distancia entre dos dedos
      const [a, b] = [...pointers.current.values()]
      const otherId = [...pointers.current.keys()].find((id) => id !== e.pointerId)
      const other = pointers.current.get(otherId)
      const before = Math.hypot(prev.x - other.x, prev.y - other.y)
      const after = Math.hypot(a.x - b.x, a.y - b.y)
      if (before > 0) setView((v) => ({ ...v, k: Math.min(4, Math.max(0.5, v.k * (after / before))) }))
      if (drag.current) drag.current.moved = true
      return
    }
    if (!drag.current) return
    const dx = e.clientX - drag.current.x
    const dy = e.clientY - drag.current.y
    if (Math.abs(dx) + Math.abs(dy) > 4) drag.current.moved = true
    const rect = e.currentTarget.getBoundingClientRect()
    const scale = W / rect.width
    setView({ ...drag.current.start, x: drag.current.start.x + dx * scale, y: drag.current.start.y + dy * scale })
  }
  function onPointerUp(e) {
    pointers.current.delete(e.pointerId)
    const moved = drag.current?.moved
    drag.current = null
    if (!moved && e.target === e.currentTarget) onSelect(null)
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn('h-full w-full touch-none select-none', className)}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="img"
    >
      <g transform={`translate(${view.x + (W / 2) * (1 - view.k)} ${view.y + (H / 2) * (1 - view.k)}) scale(${view.k})`}>
        {edges.map((e, i) => {
          const a = positions.get(e.source)
          const b = positions.get(e.target)
          if (!a || !b) return null
          const dim = neighbours && !(neighbours.has(e.source) && neighbours.has(e.target))
          const rel = e.kind === 'relation'
          return (
            <line
              key={i}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={rel ? 'hsl(var(--accent))' : 'hsl(var(--foreground))'}
              strokeOpacity={dim ? 0.04 : rel ? 0.85 : Math.min(0.35, 0.08 + e.weight * 0.07)}
              strokeWidth={rel ? 1.8 : Math.min(3, 0.6 + e.weight * 0.5)}
              strokeDasharray={rel ? '5 4' : undefined}
              pointerEvents="none"
            />
          )
        })}
        {nodes.map((n) => {
          const p = positions.get(n.id)
          if (!p) return null
          const r = radius(n)
          const dim = neighbours && !neighbours.has(n.id)
          const on = selected === n.id
          return (
            <g
              key={n.id}
              transform={`translate(${p.x} ${p.y})`}
              opacity={dim ? 0.2 : 1}
              className="cursor-pointer"
              onPointerUp={(e) => {
                e.stopPropagation()
                if (!drag.current?.moved) onSelect(n.id)
              }}
              role="button"
              aria-label={n.name}
            >
              <circle r={r + 8} fill="transparent" />
              <circle r={r} fill={TYPE_COLOR[n.type] || TYPE_COLOR.other} stroke="hsl(var(--card))" strokeWidth={2} />
              {on && <circle r={r + 5} fill="none" stroke="hsl(var(--foreground))" strokeWidth={1.5} />}
              {(r > 9 || on || (neighbours && neighbours.has(n.id))) && (
                <text y={r + 13} textAnchor="middle" className="fill-foreground text-[11px] font-medium" style={{ paintOrder: 'stroke', stroke: 'hsl(var(--background))', strokeWidth: 3 }}>
                  {n.name}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
