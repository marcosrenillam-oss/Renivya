import * as THREE from 'three'

/** lat/lng (grados) → punto sobre una esfera de radio r (Y arriba, lng 0 mirando a +Z). */
export function latLngToVector3(lat, lng, r = 1) {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lng + 180) * Math.PI) / 180
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
}

let landPromise = null

/** Malla de puntos de tierra (Natural Earth 1:110m, dominio público), cacheada. */
export function loadLandDots() {
  landPromise ??= fetch('/geo/land-dots.json')
    .then((r) => {
      if (!r.ok) throw new Error(`land-dots ${r.status}`)
      return r.json()
    })
    .then((json) => json.points)
    .catch((error) => {
      landPromise = null
      throw error
    })
  return landPromise
}

/** Lee un token HSL del tema ("12 72% 52%") y lo convierte en THREE.Color. */
export function cssColor(token, fallback = '#888888') {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(token).trim()
    const m = raw.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/)
    if (m) return new THREE.Color().setHSL(Number(m[1]) / 360, Number(m[2]) / 100, Number(m[3]) / 100)
    if (raw) return new THREE.Color(raw)
  } catch {
    /* sin DOM */
  }
  return new THREE.Color(fallback)
}

export { webglAvailable } from '@/lib/webgl'
