/**
 * Geometría del símbolo RENIVYA: estrella-rosa de 16 puntas.
 * - 8 puntas largas (cardinales + intercardinales) en marrón #4A3528.
 * - 8 puntas cortas intercaladas (22.5°) en terracota #D2691E.
 * - Núcleo marrón con halo marfil, sobre cuadrado redondeado marfil #F5EFE0.
 * Sistema de coordenadas: viewBox 0 0 64 64, centro (32, 32).
 */
export const LOGO_COLORS = {
  ivory: '#F5EFE0',
  brown: '#4A3528',
  terracotta: '#D2691E',
}

const C = 32

function polar(r, deg) {
  const a = ((deg - 90) * Math.PI) / 180
  return [C + r * Math.cos(a), C + r * Math.sin(a)]
}

function fmt([x, y]) {
  return `${x.toFixed(2)},${y.toFixed(2)}`
}

/** Punta en forma de cometa: centro → flanco izq. → vértice → flanco der. */
function kite(angle, tipRadius, flankRadius, halfSpread) {
  return [polar(0, angle), polar(flankRadius, angle - halfSpread), polar(tipRadius, angle), polar(flankRadius, angle + halfSpread)]
    .map(fmt)
    .join(' ')
}

/** Mitad de una punta (para el sombreado bicolor de las puntas largas). */
function halfKite(angle, tipRadius, flankRadius, halfSpread, side) {
  const flank = polar(flankRadius, angle + side * halfSpread)
  return [polar(0, angle), flank, polar(tipRadius, angle)].map(fmt).join(' ')
}

export const LONG_POINTS = Array.from({ length: 8 }, (_, i) => i * 45)
export const SHORT_POINTS = Array.from({ length: 8 }, (_, i) => 22.5 + i * 45)

export function buildLogoShapes() {
  return {
    short: SHORT_POINTS.map((a) => kite(a, 18, 6.2, 15)),
    longLight: LONG_POINTS.map((a) => halfKite(a, 27, 6.8, 20, -1)),
    longDark: LONG_POINTS.map((a) => halfKite(a, 27, 6.8, 20, 1)),
  }
}

/** SVG serializado (favicon / uso fuera de React). */
export function logoSvgString({ size = 64, withBackground = true } = {}) {
  const s = buildLogoShapes()
  const bg = withBackground ? `<rect x="0" y="0" width="64" height="64" rx="15" fill="${LOGO_COLORS.ivory}"/>` : ''
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">`,
    bg,
    ...s.short.map((p) => `<polygon points="${p}" fill="${LOGO_COLORS.terracotta}"/>`),
    ...s.longLight.map((p) => `<polygon points="${p}" fill="${LOGO_COLORS.brown}"/>`),
    ...s.longDark.map((p) => `<polygon points="${p}" fill="${LOGO_COLORS.brown}" fill-opacity="0.78"/>`),
    `<circle cx="32" cy="32" r="6.4" fill="${LOGO_COLORS.ivory}"/>`,
    `<circle cx="32" cy="32" r="4.2" fill="${LOGO_COLORS.brown}"/>`,
    '</svg>',
  ].join('')
}
