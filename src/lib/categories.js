import {
  Globe2, Landmark, TrendingUp, Briefcase, Cpu, BrainCircuit, FlaskConical, Trophy, Goal,
  Palette, Clapperboard, HeartPulse, Leaf, Plane, Users, Swords, Tornado, Gavel, Rocket, CandlestickChart,
} from 'lucide-react'

/**
 * Catálogo de categorías (enum de Story.category). Orden editorial.
 * `tone` es un token de color sobrio (no neón) para acentos mínimos.
 * El CLASIFICADOR determinista vive en el motor (src/lib/news), no aquí.
 */
export const CATEGORIES = [
  { id: 'world', icon: Globe2, tone: 'accent' },
  { id: 'conflict', icon: Swords, tone: 'primary' },
  { id: 'disasters', icon: Tornado, tone: 'chart-4' },
  { id: 'politics', icon: Landmark, tone: 'primary' },
  { id: 'economy', icon: TrendingUp, tone: 'chart-3' },
  { id: 'business', icon: Briefcase, tone: 'chart-3' },
  { id: 'markets', icon: CandlestickChart, tone: 'chart-3' },
  { id: 'technology', icon: Cpu, tone: 'accent' },
  { id: 'artificial_intelligence', icon: BrainCircuit, tone: 'accent' },
  { id: 'science', icon: FlaskConical, tone: 'chart-4' },
  { id: 'space', icon: Rocket, tone: 'chart-4' },
  { id: 'sports', icon: Trophy, tone: 'chart-4' },
  { id: 'football', icon: Goal, tone: 'chart-4' },
  { id: 'culture', icon: Palette, tone: 'chart-5' },
  { id: 'entertainment', icon: Clapperboard, tone: 'chart-5' },
  { id: 'health', icon: HeartPulse, tone: 'primary' },
  { id: 'environment', icon: Leaf, tone: 'chart-4' },
  { id: 'travel', icon: Plane, tone: 'accent' },
  { id: 'society', icon: Users, tone: 'primary' },
  { id: 'crime', icon: Gavel, tone: 'primary' },
]

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id)
const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]))

/** Categorías hijas: una historia de fútbol también cuenta para deportes, etc. */
export const CATEGORY_PARENT = {
  football: 'sports',
  artificial_intelligence: 'technology',
  business: 'economy',
  entertainment: 'culture',
  markets: 'economy',
  space: 'science',
  conflict: 'world',
  disasters: 'world',
  crime: 'society',
}

export function isCategory(id) {
  return BY_ID.has(id)
}

export function getCategory(id) {
  return BY_ID.get(id) ?? null
}

export function getCategoryLabel(id, t) {
  if (!id) return ''
  return isCategory(id) ? t(`category.${id}`) : id
}

/** Familia de una categoría (ella misma + su padre, si existe). */
export function categoryFamily(id) {
  const parent = CATEGORY_PARENT[id]
  return parent ? [id, parent] : [id]
}

/** Clase de color de texto para el tono (solo tokens del sistema de diseño). */
export function categoryToneClass(id) {
  const tone = getCategory(id)?.tone ?? 'primary'
  return {
    primary: 'text-primary',
    accent: 'text-accent',
    'chart-3': 'text-chart-3',
    'chart-4': 'text-chart-4',
    'chart-5': 'text-chart-5',
  }[tone]
}
