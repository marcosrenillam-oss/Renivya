/**
 * Símbolo RENIVYA: la Cruz del Sur. Cinco estrellas de cuatro puntas, en oro viejo,
 * sobre un cielo azul medianoche. Es el icono de la app y el botón del menú.
 * Sistema de coordenadas: viewBox 0 0 64 64.
 */
export const LOGO_COLORS = {
  night: '#0E1A33',
  nightDeep: '#070D1C',
  gold: '#E2B550',
  goldSoft: '#F3D88E',
}

// Gacrux (arriba), Acrux (abajo), Mimosa (izquierda), Delta (derecha), Épsilon (pequeña).
export const STARS = [
  { x: 33, y: 12.5, r: 6.6 },
  { x: 30.5, y: 51, r: 8 },
  { x: 16.5, y: 30, r: 6.4 },
  { x: 47, y: 27, r: 5 },
  { x: 39.5, y: 39.5, r: 3.1 },
]

/** Estrella de cuatro puntas (curvas cóncavas) centrada en (x, y) con radio r. */
export function starPath({ x, y, r }) {
  const k = r * 0.2
  return [
    `M${x} ${y - r}`,
    `Q${x + k} ${y - k} ${x + r} ${y}`,
    `Q${x + k} ${y + k} ${x} ${y + r}`,
    `Q${x - k} ${y + k} ${x - r} ${y}`,
    `Q${x - k} ${y - k} ${x} ${y - r}Z`,
  ].join(' ')
}

/** SVG serializado (iconos de la app / favicon). `scale` < 1 deja margen (iconos maskable/iOS). */
export function logoSvgString({ size = 64, withBackground = true, radius = 15, scale = 1 } = {}) {
  const tx = 32 - 32 * scale
  const bg = withBackground
    ? [
        '<defs><radialGradient id="sky" cx="35%" cy="25%" r="90%">',
        `<stop offset="0" stop-color="#1B2D57"/><stop offset="0.55" stop-color="${LOGO_COLORS.night}"/><stop offset="1" stop-color="${LOGO_COLORS.nightDeep}"/>`,
        '</radialGradient></defs>',
        `<rect x="0" y="0" width="64" height="64" rx="${radius}" fill="url(#sky)"/>`,
      ].join('')
    : ''
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">`,
    bg,
    `<g transform="translate(${tx} ${tx}) scale(${scale})">`,
    ...STARS.map((s) => `<path d="${starPath(s)}" fill="${LOGO_COLORS.gold}"/>`),
    ...STARS.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${(s.r * 0.16).toFixed(2)}" fill="${LOGO_COLORS.goldSoft}"/>`),
    '</g>',
    '</svg>',
  ].join('')
}
